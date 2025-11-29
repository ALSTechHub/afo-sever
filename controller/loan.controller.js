import mongoose from 'mongoose';
import Loan from '../model/loan.model.js';
const generateLoanNumber = async () => {
  const prefix = 'LN';
  const year = new Date().getFullYear();
  const lastLoan = await Loan.findOne().sort({ createdAt: -1 });

  let sequence = 1;
  if (lastLoan && lastLoan.loanNumber) {
    const lastSequence = parseInt(lastLoan.loanNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `${prefix}-${year}-${sequence.toString().padStart(6, '0')}`;
};

// Helper function to calculate loan details
const calculateLoanDetails = (principal, interestRate, duration, paymentFrequency, depositPercentage = 0) => {
  const interestAmount = (principal * interestRate) / 100;
  const totalAmount = principal + interestAmount;
  const depositAmount = (principal * depositPercentage) / 100;
  const amountAfterDeposit = totalAmount - depositAmount;

  let installmentAmount = 0;
  let numberOfInstallments = 0;

  switch (paymentFrequency) {
    case 'daily':
      numberOfInstallments = duration;
      installmentAmount = amountAfterDeposit / duration;
      break;
    case 'weekly':
      numberOfInstallments = Math.ceil(duration / 7);
      installmentAmount = amountAfterDeposit / numberOfInstallments;
      break;
    case 'monthly':
      numberOfInstallments = Math.ceil(duration / 30);
      installmentAmount = amountAfterDeposit / numberOfInstallments;
      break;
    case 'one-time':
      numberOfInstallments = 1;
      installmentAmount = amountAfterDeposit;
      break;
  }

  return {
    totalAmount: Math.ceil(totalAmount),
    depositAmount: Math.ceil(depositAmount),
    interestAmount: Math.ceil(interestAmount),
    installmentAmount: Math.ceil(installmentAmount),
    numberOfInstallments
  };
};

// Helper function to calculate due dates
const calculateDueDate = (startDate, duration, durationUnit) => {
  const dueDate = new Date(startDate);

  switch (durationUnit) {
    case 'days':
      dueDate.setDate(dueDate.getDate() + duration);
      break;
    case 'weeks':
      dueDate.setDate(dueDate.getDate() + (duration * 7));
      break;
    case 'months':
      dueDate.setMonth(dueDate.getMonth() + duration);
      break;
  }

  return dueDate;
};

export const createLoan = async (req, res) => {
  try {
    const {
      client,
      loanType,
      item,
      loanAmount,
      interestPlan,
      loanDuration,
      durationUnit,
      startDate,
      /* assignedEmployee, */
      notes
    } = req.body;

    // Validate client exists and is eligible
    const Client = await import('../model/client.model.js').then(mod => mod.default);
    const clientData = await Client.findById(client);
    if (!clientData) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!clientData.isEligible) {
      return res.status(400).json({
        success: false,
        message: 'Client is not eligible for loans'
      });
    }

    // Check if client has active loans
    const activeLoans = await Loan.countDocuments({
      client: client,
      status: { $in: ['active', 'at-risk', 'ahead', 'on-track', 'pending'] }
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'Client has active loans. Must complete existing loans first.'
      });
    }

    // Validate interest plan
    const Interest = await import('../model/interest.model.js').then(mod => mod.default);
    const interestPlanData = await Interest.findById(interestPlan);
    if (!interestPlanData) {
      return res.status(400).json({
        success: false,
        message: 'Interest plan not found'
      });
    }

    if (!interestPlanData.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Interest plan is not active'
      });
    }

    let principalAmount = 0;
    let itemPrice = 0;
    let depositPercentage = 0;
    let itemData = null;

    if (loanType === 'item') {
      // Validate item exists and has stock
      const Item = await import('../model/item.model.js').then(mod => mod.default);
      itemData = await Item.findById(item);
      if (!itemData) {
        return res.status(400).json({
          success: false,
          message: 'Item not found'
        });
      }

      if (!itemData.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Item is not active'
        });
      }

      if (itemData.currentStock <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item is out of stock'
        });
      }

      principalAmount = itemData.actualPrice;
      itemPrice = itemData.actualPrice;
      depositPercentage = itemData.depositPercentage;
    } else {
      // Money loan validation
      if (!loanAmount || loanAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Loan amount is required for money loans'
        });
      }

      // Validate against interest plan amount limits
      if (interestPlanData.minimumAmount && loanAmount < interestPlanData.minimumAmount) {
        return res.status(400).json({
          success: false,
          message: `Loan amount is below minimum allowed amount of ${interestPlanData.minimumAmount}`
        });
      }

      if (interestPlanData.maximumAmount && loanAmount > interestPlanData.maximumAmount) {
        return res.status(400).json({
          success: false,
          message: `Loan amount exceeds maximum allowed amount of ${interestPlanData.maximumAmount}`
        });
      }

      principalAmount = loanAmount;
    }

    // Validate duration against interest plan
    if (interestPlanData.minimumDuration && loanDuration < interestPlanData.minimumDuration) {
      return res.status(400).json({
        success: false,
        message: `Loan duration is below minimum allowed duration of ${interestPlanData.minimumDuration} ${interestPlanData.durationUnit}`
      });
    }

    if (interestPlanData.maximumDuration && loanDuration > interestPlanData.maximumDuration) {
      return res.status(400).json({
        success: false,
        message: `Loan duration exceeds maximum allowed duration of ${interestPlanData.maximumDuration} ${interestPlanData.durationUnit}`
      });
    }

    // Calculate loan details
    const loanDetails = calculateLoanDetails(
      principalAmount,
      interestPlanData.interestRate,
      loanDuration,
      interestPlanData.paymentFrequency,
      depositPercentage
    );

    const startDateObj = new Date(startDate);
    const dueDate = calculateDueDate(startDateObj, loanDuration, durationUnit);
    const expectedCompletionDate = calculateDueDate(startDateObj, loanDuration, durationUnit);

    // Generate loan number
    const loanNumber = await generateLoanNumber();

    const loan = await Loan.create({
      loanNumber,
      client,
      loanType,
      item: loanType === 'item' ? item : null,
      loanAmount: loanType === 'money' ? loanAmount : null,
      itemPrice: loanType === 'item' ? itemPrice : null,
      depositAmount: loanDetails.depositAmount,
      depositPaid: false,
      totalAmount: loanDetails.totalAmount,
      amountPaid: 0,
      remainingBalance: loanDetails.totalAmount,
      interestPlan,
      interestRate: interestPlanData.interestRate,
      paymentFrequency: interestPlanData.paymentFrequency,
      installmentAmount: loanDetails.installmentAmount,
      loanDuration,
      durationUnit,
      startDate: startDateObj,
      dueDate,
      expectedCompletionDate,
      /* assignedEmployee, */
      createdBy: req.user._id,
      notes
    });

    // If item loan, reduce stock
    if (loanType === 'item' && itemData) {
      const Item = await import('../model/item.model.js').then(mod => mod.default);
      await Item.findByIdAndUpdate(item, {
        $inc: { currentStock: -1 }
      });
    }

    const populatedLoan = await Loan.findById(loan._id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId address creditScore')
      .populate('item', 'name brand model actualPrice')
      .populate('interestPlan', 'name interestRate paymentFrequency penaltyRate')
      /* .populate('assignedEmployee', 'firstName lastName email') */
      .populate('createdBy', 'firstName lastName email');

    // NOTIFICATION: Loan Created - Send to All Admins
    try {
      // Import User model to find admin users
      const User = await import('../model/user.model.js').then(mod => mod.default);
      const { createNotification } = await import('./notification.controller.js');
      
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' }).select('_id firstName lastName');
      
      // Send notification to all admin users
      const notificationPromises = adminUsers.map(adminUser => 
        createNotification({
          title: '📋 New Loan Application',
          message: `New ${loanType} loan application from ${clientData.firstName} ${clientData.lastName} for KES ${principalAmount.toLocaleString()} requires approval`,
          type: 'loan_created',
          recipient: adminUser._id,
          sender: req.user._id,
          relatedEntity: {
            entityType: 'loan',
            entityId: loan._id
          },
          priority: 'high',
          channelId: 'default'
        })
      );
      
      await Promise.all(notificationPromises);
      console.log(`📨 Loan creation notifications sent to ${adminUsers.length} admin(s)`);
    } catch (notificationError) {
      console.error('❌ Error sending loan notification:', notificationError);
      // Don't fail loan creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Loan created successfully and pending approval',
      data: populatedLoan
    });
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating loan',
      error: error.message
    });
  }
};
export const getLoans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      loanType,
      assignedEmployee,
      client,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search by loan number or client name
    if (search) {
      query.$or = [
        { loanNumber: { $regex: search, $options: 'i' } },
        { 'client.firstName': { $regex: search, $options: 'i' } },
        { 'client.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by loan type
    if (loanType) {
      query.loanType = loanType;
    }

    // Filter by assigned employee
    if (assignedEmployee && mongoose.Types.ObjectId.isValid(assignedEmployee)) {
      query.assignedEmployee = assignedEmployee;
    }

    // Filter by client
    if (client && mongoose.Types.ObjectId.isValid(client)) {
      query.client = client;
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get loans with pagination
    const loans = await Loan.find(query)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('assignedEmployee', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Loan.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: loans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loans',
      error: error.message
    });
  }
};

export const getLoan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    const loan = await Loan.findById(id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId address creditScore')
      .populate('item', 'name brand model actualPrice specifications')
      .populate('interestPlan', 'name interestRate paymentFrequency penaltyRate description')
      .populate('assignedEmployee', 'firstName lastName email phoneNumber')
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('disbursementDetails.disbursedBy', 'firstName lastName')
      .populate('paymentHistory.receivedBy', 'firstName lastName');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    const Payment = await import('../model/payment.model.js').then(mod => mod.default);
    const payments = await Payment.find({ loan: id })
      .populate('client', 'firstName middleName lastName')
      .populate('receivedBy', 'firstName lastName')
      .sort({ paymentDate: -1 });
    const loanWithPayments = loan.toObject();
    loanWithPayments.detailedPayments = payments;

    res.json({
      success: true,
      data: loanWithPayments
    });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan',
      error: error.message
    });
  }
};
export const getOverdueLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      status: { $in: ['active', 'at-risk'] },
      dueDate: { $lt: new Date() }
    };

    const loans = await Loan.find(query)
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('item', 'name brand model')
      .populate('assignedEmployee', 'firstName lastName email')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Loan.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: loans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get overdue loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue loans',
      error: error.message
    });
  }
};
export const updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    const validStatuses = ['pending', 'approved', 'active', 'completed', 'defaulted', 'rejected', 'at-risk', 'ahead', 'on-track'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan status'
      });
    }

    const loan = await Loan.findById(id)
      .populate('client', 'firstName lastName')
      .populate('createdBy', 'firstName lastName _id'); // Populate the employee who created the loan

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Status transition validation
    if (status === 'approved' && loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending loans can be approved'
      });
    }

    if (status === 'rejected' && loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending loans can be rejected'
      });
    }

    if (status === 'completed' && loan.remainingBalance > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete loan with outstanding balance'
      });
    }

    loan.status = status;

    if (status === 'approved') {
      loan.approvedBy = req.user._id;
      loan.approvedAt = new Date();
    }

    if (notes) {
      loan.notes = notes;
    }

    const updatedLoan = await loan.save();
    const populatedLoan = await Loan.findById(updatedLoan._id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('assignedEmployee', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    // NOTIFICATION: Only send for approved status
    if (status === 'approved') {
      try {
        const { createNotification } = await import('./notification.controller.js');
        
        // Only send notification if the loan creator is different from the approver
        // and if the creator exists (employee who created the loan)
        if (loan.createdBy && loan.createdBy._id.toString() !== req.user._id.toString()) {
          await createNotification({
            title: '✅ Loan Approved',
            message: `Your loan application #${loan.loanNumber} for ${loan.client.firstName} ${loan.client.lastName} has been approved and is ready for disbursement`,
            type: 'loan_approved',
            recipient: loan.createdBy._id,
            sender: req.user._id, 
            relatedEntity: {
              entityType: 'loan',
              entityId: loan._id
            },
            priority: 'medium',
            channelId: 'default'
          });
          console.log(`📨 Loan approval notification sent to employee ${loan.createdBy._id}`);
        } else {
          console.log('ℹ️  No notification sent: Loan approved by same user who created it');
        }
      } catch (notificationError) {
        console.error('❌ Error sending loan approval notification:', notificationError);
        // Don't fail status update if notification fails
      }
    }

    // Optional: You can add notifications for other statuses if needed
    // For example, for rejected status:
    /*
    if (status === 'rejected') {
      try {
        const { createNotification } = await import('./notification.controller.js');
        
        if (loan.createdBy && loan.createdBy._id.toString() !== req.user._id.toString()) {
          await createNotification({
            title: '❌ Loan Rejected',
            message: `Your loan application #${loan.loanNumber} for ${loan.client.firstName} ${loan.client.lastName} has been rejected`,
            type: 'loan_rejected',
            recipient: loan.createdBy._id,
            sender: req.user._id,
            relatedEntity: {
              entityType: 'loan',
              entityId: loan._id
            },
            priority: 'medium'
          });
        }
      } catch (notificationError) {
        console.error('❌ Error sending loan rejection notification:', notificationError);
      }
    }
    */

    res.json({
      success: true,
      message: `Loan status updated to ${status}`,
      data: populatedLoan
    });
  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating loan status',
      error: error.message
    });
  }
};

export const recordDisbursement = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, transactionId, disbursedAt } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved loans can be disbursed'
      });
    }

    loan.disbursementDetails = {
      method,
      transactionId: method !== 'cash' ? transactionId : null,
      disbursedAt: disbursedAt ? new Date(disbursedAt) : new Date(),
      disbursedBy: req.user._id
    };

    loan.status = 'active';

    const updatedLoan = await loan.save();
    const populatedLoan = await Loan.findById(updatedLoan._id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('assignedEmployee', 'firstName lastName email')
      .populate('disbursementDetails.disbursedBy', 'firstName lastName');

    // Update client's loan count
    const Client = await import('../model/client.model.js').then(mod => mod.default);
    await Client.findByIdAndUpdate(loan.client, {
      $inc: {
        totalLoansTaken: 1,
        currentActiveLoans: 1
      },
      lastLoanDate: new Date()
    });

    res.json({
      success: true,
      message: 'Loan disbursed successfully',
      data: populatedLoan
    });
  } catch (error) {
    console.error('Record disbursement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording disbursement',
      error: error.message
    });
  }
};

export const payDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paidBy, paymentMethod, transactionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.depositPaid) {
      return res.status(400).json({
        success: false,
        message: 'Deposit already paid'
      });
    }

    if (amount < loan.depositAmount) {
      return res.status(400).json({
        success: false,
        message: `Deposit amount must be at least ${loan.depositAmount}`
      });
    }

    loan.depositPaid = true;
    loan.amountPaid = amount;
    loan.remainingBalance = loan.totalAmount - amount;

    // Add to payment history
    loan.paymentHistory.push({
      date: new Date(),
      amount: amount,
      paidBy: paidBy || 'Client',
      receivedBy: req.user._id
    });

    const updatedLoan = await loan.save();
    const populatedLoan = await Loan.findById(updatedLoan._id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('paymentHistory.receivedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Deposit paid successfully',
      data: populatedLoan
    });
  } catch (error) {
    console.error('Pay deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing deposit payment',
      error: error.message
    });
  }
};

export const getLoanStats = async (req, res) => {
  try {
    // Get total loans count by status
    const statusStats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' }
        }
      }
    ]);

    // Get loans by type
    const typeStats = await Loan.aggregate([
      {
        $group: {
          _id: '$loanType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get monthly loan distribution
    const monthlyStats = await Loan.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get total amounts
    const totalStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanAmount: { $sum: '$totalAmount' },
          totalAmountPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$remainingBalance' },
          averageLoanAmount: { $avg: '$totalAmount' }
        }
      }
    ]);

    const totals = totalStats[0] || {
      totalLoans: 0,
      totalLoanAmount: 0,
      totalAmountPaid: 0,
      totalOutstanding: 0,
      averageLoanAmount: 0
    };

    res.json({
      success: true,
      data: {
        summary: totals,
        byStatus: statusStats,
        byType: typeStats,
        monthly: monthlyStats
      }
    });
  } catch (error) {
    console.error('Get loan stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan statistics',
      error: error.message
    });
  }
};
export const getLoansByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    let query = { assignedEmployee: employeeId };

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const loans = await Loan.find(query)
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Loan.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    // Get employee performance stats
    const performanceStats = await Loan.aggregate([
      { $match: { assignedEmployee: new mongoose.Types.ObjectId(employeeId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalCollected: { $sum: '$amountPaid' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        loans,
        performance: performanceStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get loans by employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee loans',
      error: error.message
    });
  }
};

// Get active loans for a specific client
export const getClientActiveLoans = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    // Validate client exists
    const Client = await import('../model/client.model.js').then(mod => mod.default);
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get active loans for this client
    const loans = await Loan.find({
      client: clientId,
      status: { $in: ['active', 'at-risk', 'ahead', 'on-track'] }
    })
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency penaltyRate')
      .populate('assignedEmployee', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: loans,
      count: loans.length
    });
  } catch (error) {
    console.error('Get client active loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client loans',
      error: error.message
    });
  }
};
export const getClientLoans = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      loanType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    // Validate client exists
    const Client = await import('../model/client.model.js').then(mod => mod.default);
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Build query
    let query = { client: clientId };

    // Filter by status
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by loan type
    if (loanType) {
      query.loanType = loanType;
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get loans with pagination
    const loans = await Loan.find(query)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('assignedEmployee', 'firstName lastName email phoneNumber')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('interestPlan', 'name description')
      .populate('item', 'name description category')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Loan.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    // Calculate loan statistics for this client
    const loanStats = await Loan.aggregate([
      { $match: { client: new mongoose.Types.ObjectId(clientId) } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          activeLoans: {
            $sum: { $cond: [{ $in: ['$status', ['active', 'on-track', 'ahead']] }, 1, 0] }
          },
          completedLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalBorrowed: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          totalRemaining: { $sum: '$remainingBalance' },
          defaultedLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = loanStats[0] || {
      totalLoans: 0,
      activeLoans: 0,
      completedLoans: 0,
      totalBorrowed: 0,
      totalPaid: 0,
      totalRemaining: 0,
      defaultedLoans: 0
    };

    res.json({
      success: true,
      data: {
        client: {
          _id: client._id,
          firstName: client.firstName,
          middleName: client.middleName,
          lastName: client.lastName,
          phoneNumber: client.phoneNumber,
          nationalId: client.nationalId
        },
        loans,
        statistics: stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get client loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client loans',
      error: error.message
    });
  }
};

export const getClientsActiveLoans = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }
    const loan = await Loan.findOne({
      client: clientId,
      status: { $in: ['active', 'on-track', 'ahead', 'at-risk'] },
      remainingBalance: { $gt: 0 }
    })
      .select('loanNumber loanType totalAmount remainingBalance status dueDate installmentAmount')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .lean();

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'No active loan found for this client',
        data: null
      });
    }

    res.json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Get client active loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client active loan',
      error: error.message
    });
  }

};
