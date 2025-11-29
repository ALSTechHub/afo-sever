import mongoose from 'mongoose';
import Payment from '../model/payment.model.js';

// Helper function to generate unique payment number
const generatePaymentNumber = async () => {
  const prefix = 'PMT';
  const year = new Date().getFullYear();
  const lastPayment = await Payment.findOne().sort({ createdAt: -1 });

  let sequence = 1;
  if (lastPayment && lastPayment.paymentNumber) {
    const lastSequence = parseInt(lastPayment.paymentNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `${prefix}-${year}-${sequence.toString().padStart(6, '0')}`;
};

// Helper function to calculate late days and penalties
const calculateLateDetails = (paymentDate, dueDate, loan) => {
  const paymentDateObj = new Date(paymentDate);
  const dueDateObj = new Date(dueDate);

  const lateDays = Math.max(0, Math.floor((paymentDateObj - dueDateObj) / (1000 * 60 * 60 * 24)));
  const isOnTime = lateDays === 0;

  // Calculate penalty based on loan's interest plan penalty rate
  let penaltyAmount = 0;
  if (lateDays > 0 && loan.interestPlan && loan.interestPlan.penaltyRate) {
    const dailyPenaltyRate = loan.interestPlan.penaltyRate / 100;
    penaltyAmount = loan.installmentAmount * dailyPenaltyRate * lateDays;
  }

  return {
    isOnTime,
    lateDays,
    penaltyAmount: Math.ceil(penaltyAmount)
  };
};

export const createPayment = async (req, res) => {
  try {
    const {
      loan: loanId,
      client: clientId,
      amount,
      paymentMethod,
      transactionId,
      paymentDate,
      dueDate,
      notes
    } = req.body;

    // Validate loan exists and is active
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loan = await Loan.findById(loanId)
      .populate('interestPlan', 'penaltyRate')
      .populate('client', 'firstName middleName lastName')
      .populate('createdBy', 'firstName lastName'); 

    if (!loan) {
      return res.status(400).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (!['active', 'at-risk', 'ahead', 'on-track'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot make payment for this loan status'
      });
    }

    // Validate client matches loan client
    if (loan.client._id.toString() !== clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client does not match loan client'
      });
    }

    // Validate payment amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    if (amount > loan.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance of ${loan.remainingBalance}`
      });
    }

    // Validate transaction ID for electronic payments
    if ((paymentMethod === 'mpesa' || paymentMethod === 'bank') && !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required for mpesa and bank payments'
      });
    }

    // Check for duplicate transaction ID
    if (transactionId) {
      const existingPayment = await Payment.findOne({ transactionId });
      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID already exists'
        });
      }
    }

    // Calculate late payment details
    const lateDetails = calculateLateDetails(paymentDate, dueDate, loan);
    const totalAmount = amount + lateDetails.penaltyAmount;

    // Generate payment number
    const paymentNumber = await generatePaymentNumber();

    const payment = await Payment.create({
      paymentNumber,
      loan: loanId,
      client: clientId,
      amount,
      paymentMethod,
      transactionId: paymentMethod !== 'cash' ? transactionId : null,
      receivedBy: req.user._id,
      paymentDate: new Date(paymentDate),
      dueDate: new Date(dueDate),
      isOnTime: lateDetails.isOnTime,
      lateDays: lateDetails.lateDays,
      penaltyAmount: lateDetails.penaltyAmount,
      notes,
      status: 'completed'
    });

    // NOTIFICATION: Payment Recorded - Send to Admin
    try {
      // Import User model to find admin users
      const User = await import('../model/user.model.js').then(mod => mod.default);
      
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      
      // Import notification function
      const { createNotification } = await import('../controller/notification.controller.js');
      
      // Send notification to all admin users
      const notificationPromises = adminUsers.map(adminUser => 
        createNotification({
          title: '💰 Payment Recorded',
          message: `Payment of KES ${amount.toLocaleString()} recorded for ${loan.client.firstName} ${loan.client.lastName} (Loan: ${loan.loanNumber})`,
          type: 'payment_recorded',
          recipient: adminUser._id,
          sender: req.user._id,
          relatedEntity: {
            entityType: 'payment',
            entityId: payment._id
          },
          priority: 'medium',
        })
      );
      
      await Promise.all(notificationPromises);
      console.log(`📨 Payment notifications sent to ${adminUsers.length} admin(s)`);
    } catch (notificationError) {
      console.error('❌ Error sending payment notification:', notificationError);
      // Don't fail the payment if notification fails
    }

    // Update loan details
    const newAmountPaid = loan.amountPaid + amount;
    const newRemainingBalance = loan.totalAmount - newAmountPaid;

    // Determine loan status based on payment progress
    let newStatus = loan.status;
    if (newRemainingBalance <= 0) {
      newStatus = 'completed';
    } else if (lateDetails.lateDays > 0) {
      newStatus = 'at-risk';
    } else if (newAmountPaid > (loan.totalAmount * 0.8)) { // 80% paid
      newStatus = 'ahead';
    } else {
      newStatus = 'on-track';
    }

    // Update missed payments count
    const missedPayments = {
      count: loan.missedPayments?.count || 0,
      totalAmount: loan.missedPayments?.totalAmount || 0,
      lastMissedDate: loan.missedPayments?.lastMissedDate
    };

    if (!lateDetails.isOnTime) {
      missedPayments.count += 1;
      missedPayments.totalAmount += lateDetails.penaltyAmount;
      missedPayments.lastMissedDate = new Date(paymentDate);
    }

    // Add to loan's payment history
    const paymentHistoryEntry = {
      date: new Date(paymentDate),
      amount: amount,
      paidBy: loan.client.firstName + ' ' + loan.client.lastName,
      receivedBy: req.user._id
    };

    await Loan.findByIdAndUpdate(loanId, {
      amountPaid: newAmountPaid,
      remainingBalance: newRemainingBalance,
      status: newStatus,
      missedPayments: missedPayments,
      $push: { paymentHistory: paymentHistoryEntry }
    });

    // If loan is completed, update client's loan count and send completion notification
    if (newStatus === 'completed') {
      const Client = await import('../model/client.model.js').then(mod => mod.default);
      await Client.findByIdAndUpdate(clientId, {
        $inc: {
          totalLoansRepaid: 1,
          currentActiveLoans: -1
        }
      });

      // Update credit score based on payment performance
      const creditScoreUpdate = lateDetails.lateDays === 0 ? 5 : -2;
      await Client.findByIdAndUpdate(clientId, {
        $inc: { creditScore: creditScoreUpdate },
        $max: { creditScore: 100 },
        $min: { creditScore: 0 }
      });

      // NOTIFICATION: Loan Completed - Send to Employee who created the loan
      try {
        const { createNotification } = await import('../controller/notification.controller.js');
        
        if (loan.createdBy && loan.createdBy._id.toString() !== req.user._id.toString()) {
          await createNotification({
            title: '🎉 Loan Completed',
            message: `Loan ${loan.loanNumber} for ${loan.client.firstName} ${loan.client.lastName} has been fully paid!`,
            type: 'loan_completed',
            recipient: loan.createdBy._id,
            sender: req.user._id,
            relatedEntity: {
              entityType: 'loan',
              entityId: loan._id
            },
            priority: 'medium'
          });
          console.log(`📨 Loan completion notification sent to employee ${loan.createdBy._id}`);
        }
      } catch (completionNotificationError) {
        console.error('❌ Error sending loan completion notification:', completionNotificationError);
      }
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('loan', 'loanNumber totalAmount remainingBalance installmentAmount')
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('receivedBy', 'firstName lastName email')
      .populate('reversedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording payment',
      error: error.message
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentMethod,
      receivedBy,
      loan,
      client,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search by payment number, transaction ID, or client name
    if (search) {
      query.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { 'client.firstName': { $regex: search, $options: 'i' } },
        { 'client.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by received by (employee)
    if (receivedBy && mongoose.Types.ObjectId.isValid(receivedBy)) {
      query.receivedBy = receivedBy;
    }

    // Filter by loan
    if (loan && mongoose.Types.ObjectId.isValid(loan)) {
      query.loan = loan;
    }

    // Filter by client
    if (client && mongoose.Types.ObjectId.isValid(client)) {
      query.client = client;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get payments with pagination
    const payments = await Payment.find(query)
      .populate('loan', 'loanNumber totalAmount')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('receivedBy', 'firstName lastName email')
      .populate('reversedBy', 'firstName lastName')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Payment.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: error.message
    });
  }
};

export const getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID'
      });
    }

    const payment = await Payment.findById(id)
      .populate('loan', 'loanNumber totalAmount remainingBalance installmentAmount interestPlan')
      .populate('client', 'firstName middleName lastName phoneNumber nationalId address')
      .populate('receivedBy', 'firstName lastName email phoneNumber')
      .populate('reversedBy', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment',
      error: error.message
    });
  }
};

export const reversePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reversalReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID'
      });
    }

    if (!reversalReason) {
      return res.status(400).json({
        success: false,
        message: 'Reversal reason is required'
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'reversed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is already reversed'
      });
    }

    if (payment.status === 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reverse a failed payment'
      });
    }

    // Update payment status
    payment.status = 'reversed';
    payment.reversalReason = reversalReason;
    payment.reversedBy = req.user._id;
    payment.reversedAt = new Date();

    const reversedPayment = await payment.save();

    // Update loan details - subtract the payment amount
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loan = await Loan.findById(payment.loan);

    if (loan) {
      const newAmountPaid = Math.max(0, loan.amountPaid - payment.amount);
      const newRemainingBalance = loan.totalAmount - newAmountPaid;

      // Recalculate loan status
      let newStatus = loan.status;
      if (newRemainingBalance > 0 && loan.status === 'completed') {
        newStatus = 'active'; // Reactivate if it was completed
      }

      // Remove from loan's payment history
      await Loan.findByIdAndUpdate(payment.loan, {
        amountPaid: newAmountPaid,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        $pull: {
          paymentHistory: {
            date: payment.paymentDate,
            amount: payment.amount
          }
        }
      });

      // Update client's loan count if loan was completed
      if (loan.status === 'completed') {
        const Client = await import('../model/client.model.js').then(mod => mod.default);
        await Client.findByIdAndUpdate(payment.client, {
          $inc: {
            totalLoansRepaid: -1,
            currentActiveLoans: 1
          }
        });
      }
    }

    const populatedPayment = await Payment.findById(reversedPayment._id)
      .populate('loan', 'loanNumber totalAmount remainingBalance')
      .populate('client', 'firstName middleName lastName')
      .populate('receivedBy', 'firstName lastName email')
      .populate('reversedBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Payment reversed successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error('Reverse payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reversing payment',
      error: error.message
    });
  }
};
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.paymentDate = {};
      if (startDate) dateFilter.paymentDate.$gte = new Date(startDate);
      if (endDate) dateFilter.paymentDate.$lte = new Date(endDate);
    }

    // Get total payments statistics
    const totalStats = await Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPenalties: { $sum: '$penaltyAmount' },
          averagePayment: { $avg: '$amount' }
        }
      }
    ]);

    // Get payments by method
    const methodStats = await Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get payments by status
    const statusStats = await Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get daily payments for the last 30 days
    const dailyStats = await Payment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPenalties: { $sum: '$penaltyAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get late payments statistics
    const lateStats = await Payment.aggregate([
      { $match: { ...dateFilter, isOnTime: false } },
      {
        $group: {
          _id: null,
          totalLatePayments: { $sum: 1 },
          totalLateAmount: { $sum: '$amount' },
          totalPenalties: { $sum: '$penaltyAmount' },
          averageLateDays: { $avg: '$lateDays' }
        }
      }
    ]);

    const totals = totalStats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      totalPenalties: 0,
      averagePayment: 0
    };

    const lateTotals = lateStats[0] || {
      totalLatePayments: 0,
      totalLateAmount: 0,
      totalPenalties: 0,
      averageLateDays: 0
    };

    res.json({
      success: true,
      data: {
        summary: totals,
        latePayments: lateTotals,
        byMethod: methodStats,
        byStatus: statusStats,
        daily: dailyStats
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics',
      error: error.message
    });
  }
};

export const getPaymentsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    let query = { receivedBy: employeeId };

    // Date filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const payments = await Payment.find(query)
      .populate('loan', 'loanNumber totalAmount')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Payment.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    // Get employee collection statistics
    const collectionStats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCollections: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPenalties: { $sum: '$penaltyAmount' },
          onTimePayments: {
            $sum: { $cond: ['$isOnTime', 1, 0] }
          },
          latePayments: {
            $sum: { $cond: ['$isOnTime', 0, 1] }
          }
        }
      }
    ]);

    const stats = collectionStats[0] || {
      totalCollections: 0,
      totalAmount: 0,
      totalPenalties: 0,
      onTimePayments: 0,
      latePayments: 0
    };

    res.json({
      success: true,
      data: {
        payments,
        performance: stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get payments by employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee payments',
      error: error.message
    });
  }
};

export const getPaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    const query = { loan: loanId };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const payments = await Payment.find(query)
      .populate('receivedBy', 'firstName lastName email')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Payment.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    // Get loan details
    const Loan = await import('../models/Loan.js').then(mod => mod.default);
    const loan = await Loan.findById(loanId)
      .populate('client', 'firstName middleName lastName')
      .populate('item', 'name brand model')
      .select('loanNumber totalAmount amountPaid remainingBalance status');

    res.json({
      success: true,
      data: {
        loan,
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get payments by loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan payments',
      error: error.message
    });
  }
};