import mongoose from 'mongoose';
import { Savings, SavingsTransaction } from '../model/savings.model.js';
import Payment from '../model/payment.model.js';

// Helper function to generate unique savings number
const generateSavingsNumber = async () => {
  let savingsNumber;

  while (true) {
    savingsNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // Check uniqueness
    const exists = await Savings.findOne({ savingsNumber });
    if (!exists) break; 
  }

  return savingsNumber;
};


// Helper function to calculate interest
const calculateInterest = (balance, interestRate, days) => {
  const dailyRate = interestRate / 100 / 365;
  return balance * dailyRate * days;
};

export const createSavingsAccount = async (req, res) => {
  try {
    const { client, interestRate } = req.body;

    // Validate client exists
    const Client = await import('../model/client.model.js').then(mod => mod.default);
    const clientData = await Client.findById(client);
    if (!clientData) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if client already has an active savings account
    const existingSavings = await Savings.findOne({ 
      client: client,
      isActive: true 
    });

    if (existingSavings) {
      return res.status(400).json({
        success: false,
        message: 'Client already has an active savings account'
      });
    }

    // Generate savings number
    const savingsNumber = await generateSavingsNumber();

    const savings = await Savings.create({
      client,
      savingsNumber,
      interestRate: interestRate || 0,
      createdBy: req.user._id
    });

    const populatedSavings = await Savings.findById(savings._id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Savings account created successfully',
      data: populatedSavings
    });
  } catch (error) {
    console.error('Create savings account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating savings account',
      error: error.message
    });
  }
};

export const getSavingsAccounts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isActive, 
      client,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search by savings number or client name
    if (search) {
      query.$or = [
        { savingsNumber: { $regex: search, $options: 'i' } },
        { 'client.firstName': { $regex: search, $options: 'i' } },
        { 'client.lastName': { $regex: search, $options: 'i' } },
        { 'client.phoneNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
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

    // Get savings accounts with pagination
    const savingsAccounts = await Savings.find(query)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('createdBy', 'firstName lastName email')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Savings.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: savingsAccounts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get savings accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings accounts',
      error: error.message
    });
  }
};

export const getSavingsAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    const savings = await Savings.findById(id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId address')
      .populate('createdBy', 'firstName lastName email');

    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    res.json({
      success: true,
      data: savings
    });
  } catch (error) {
    console.error('Get savings account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings account',
      error: error.message
    });
  }
};

export const updateSavingsAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { interestRate, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    const savings = await Savings.findById(id);

    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    // Update fields
    if (interestRate !== undefined) {
      if (interestRate < 0 || interestRate > 100) {
        return res.status(400).json({
          success: false,
          message: 'Interest rate must be between 0 and 100'
        });
      }
      savings.interestRate = interestRate;
    }

    if (isActive !== undefined) {
      savings.isActive = isActive;
    }

    const updatedSavings = await savings.save();
    const populatedSavings = await Savings.findById(updatedSavings._id)
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Savings account updated successfully',
      data: populatedSavings
    });
  } catch (error) {
    console.error('Update savings account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating savings account',
      error: error.message
    });
  }
};

export const makeDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be greater than 0'
      });
    }

    // Validate transaction ID for mpesa payments
    if (paymentMethod === 'mpesa' && !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required for mpesa payments'
      });
    }

    const savings = await Savings.findById(id);

    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    if (!savings.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deposit to inactive savings account'
      });
    }

    // Check for duplicate transaction ID
    if (transactionId) {
      const existingTransaction = await SavingsTransaction.findOne({ 
        transactionId,
        transactionType: 'deposit'
      });
      if (existingTransaction) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID already exists'
        });
      }
    }

    const newBalance = savings.currentBalance + amount;
    const newTotalDeposits = savings.totalDeposits + amount;

    // Update savings account
    savings.currentBalance = newBalance;
    savings.totalDeposits = newTotalDeposits;
    await savings.save();

    // Create transaction record
    const transaction = await SavingsTransaction.create({
      savings: id,
      client: savings.client,
      transactionType: 'deposit',
      amount: amount,
      paymentMethod,
      transactionId: paymentMethod === 'mpesa' ? transactionId : null,
      processedBy: req.user._id,
      notes,
      balanceAfter: newBalance
    });

    const populatedTransaction = await SavingsTransaction.findById(transaction._id)
      .populate('savings', 'savingsNumber')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('processedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber');

    res.status(201).json({
      success: true,
      message: 'Deposit made successfully',
      data: {
        transaction: populatedTransaction,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Make deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing deposit',
      error: error.message
    });
  }
};

export const makeWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount must be greater than 0'
      });
    }

    const savings = await Savings.findById(id);

    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    if (!savings.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw from inactive savings account'
      });
    }

    if (amount > savings.currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Available balance: ${savings.currentBalance}`
      });
    }

    const newBalance = savings.currentBalance - amount;
    const newTotalWithdrawals = savings.totalWithdrawals + amount;

    // Update savings account
    savings.currentBalance = newBalance;
    savings.totalWithdrawals = newTotalWithdrawals;
    await savings.save();

    // Create transaction record
    const transaction = await SavingsTransaction.create({
      savings: id,
      client: savings.client,
      transactionType: 'withdrawal',
      amount: amount,
      paymentMethod,
      transactionId: paymentMethod === 'mpesa' ? transactionId : null,
      processedBy: req.user._id,
      notes,
      balanceAfter: newBalance
    });

    const populatedTransaction = await SavingsTransaction.findById(transaction._id)
      .populate('savings', 'savingsNumber')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('processedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        transaction: populatedTransaction,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Make withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing withdrawal',
      error: error.message
    });
  }
};
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

export const useSavingsForLoanRepayment = async (req, res) => {
  const paymentNumber = await generatePaymentNumber();
  try {
    const { id } = req.params;
    const { amount, loan: loanId, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const savings = await Savings.findById(id);
    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    // Validate loan exists and belongs to the same client
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.client.toString() !== savings.client.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Loan does not belong to the savings account owner'
      });
    }

    if (amount > savings.currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient savings balance. Available: ${savings.currentBalance}`
      });
    }

    if (amount > loan.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds loan remaining balance of ${loan.remainingBalance}`
      });
    }

    const newBalance = savings.currentBalance - amount;
    const newTotalWithdrawals = savings.totalWithdrawals + amount;

    // Update savings account
    savings.currentBalance = newBalance;
    savings.totalWithdrawals = newTotalWithdrawals;
    await savings.save();

    // Create transaction record
    const transaction = await SavingsTransaction.create({
      savings: id,
      client: savings.client,
      transactionType: 'loan-repayment',
      amount: amount,
      paymentMethod: 'savings',
      processedBy: req.user._id,
      loan: loanId,
      notes,
      balanceAfter: newBalance
    });

    // Update loan details
    const newAmountPaid = loan.amountPaid + amount;
    const newRemainingBalance = loan.totalAmount - newAmountPaid;

    // Update loan status if fully paid
    let newStatus = loan.status;
    if (newRemainingBalance <= 0) {
      newStatus = 'completed';
    }

    await Loan.findByIdAndUpdate(loanId, {
      amountPaid: newAmountPaid,
      remainingBalance: newRemainingBalance,
      status: newStatus
    });

    // Create payment record for the loan
    const Payment = await import('../model/payment.model.js').then(mod => mod.default);
    await Payment.create({
      paymentNumber,
      loan: loanId,
      client: savings.client,
      amount: amount,
      paymentMethod: 'savings',
      receivedBy: req.user._id,
      paymentDate: new Date(),
      dueDate: loan.dueDate,
      isOnTime: true,
      notes: `Paid from savings account: ${notes || 'Loan repayment'}`
    });

    const populatedTransaction = await SavingsTransaction.findById(transaction._id)
      .populate('savings', 'savingsNumber')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('processedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber totalAmount');

    res.status(201).json({
      success: true,
      message: 'Loan repayment processed successfully from savings',
      data: {
        transaction: populatedTransaction,
        newBalance: newBalance,
        loanRemainingBalance: newRemainingBalance
      }
    });
  } catch (error) {
    console.error('Use savings for loan repayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing loan repayment from savings',
      error: error.message
    });
  }
};
export const calculateInterests = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    const savings = await Savings.findById(id);

    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    if (savings.interestRate <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Interest rate is 0, no interest to calculate'
      });
    }

    const now = new Date();
    const lastCalculation = savings.lastInterestCalculation || savings.createdAt;
    const daysSinceLastCalculation = Math.floor((now - lastCalculation) / (1000 * 60 * 60 * 24));

    if (daysSinceLastCalculation < 1) {
      return res.status(400).json({
        success: false,
        message: 'Interest can only be calculated once per day'
      });
    }
    const interestAmount = calculateInterest(
      savings.currentBalance,
      savings.interestRate,
      daysSinceLastCalculation
    );

    if (interestAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No interest to add (zero or negative amount)'
      });
    }

    const newBalance = savings.currentBalance + interestAmount;

    // Update savings account
    savings.currentBalance = newBalance;
    savings.lastInterestCalculation = now;
    await savings.save();

    // Create interest transaction record
    const transaction = await SavingsTransaction.create({
      savings: id,
      client: savings.client,
      transactionType: 'interest',
      amount: interestAmount,
      paymentMethod: 'system',
      processedBy: req.user._id,
      notes: `Interest calculated for ${daysSinceLastCalculation} days at ${savings.interestRate}% rate`,
      balanceAfter: newBalance
    });
    const populatedTransaction = await SavingsTransaction.findById(transaction._id)
      .populate('savings', 'savingsNumber')
      .populate('client', 'firstName middleName lastName phoneNumber')
      .populate('processedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: `Interest of ${interestAmount.toFixed(2)} added successfully`,
      data: {
        transaction: populatedTransaction,
        interestAmount: parseFloat(interestAmount.toFixed(2)),
        days: daysSinceLastCalculation,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Calculate interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating interest',
      error: error.message
    });
  }
};

export const getSavingsTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      transactionType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid savings account ID'
      });
    }

    const savings = await Savings.findById(id);
    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'Savings account not found'
      });
    }

    let query = { savings: id };

    // Filter by transaction type
    if (transactionType) {
      query.transactionType = transactionType;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await SavingsTransaction.find(query)
      .populate('processedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await SavingsTransaction.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        savings: {
          savingsNumber: savings.savingsNumber,
          currentBalance: savings.currentBalance,
          client: savings.client
        },
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get savings transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings transactions',
      error: error.message
    });
  }
};

export const getSavingsStats = async (req, res) => {
  try {
    // Get total savings statistics
    const totalStats = await Savings.aggregate([
      {
        $group: {
          _id: null,
          totalAccounts: { $sum: 1 },
          activeAccounts: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalBalance: { $sum: '$currentBalance' },
          totalDeposits: { $sum: '$totalDeposits' },
          totalWithdrawals: { $sum: '$totalWithdrawals' },
          averageBalance: { $avg: '$currentBalance' }
        }
      }
    ]);

    // Get transaction statistics
    const transactionStats = await SavingsTransaction.aggregate([
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Get monthly deposits
    const monthlyDeposits = await SavingsTransaction.aggregate([
      {
        $match: {
          transactionType: 'deposit',
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top savings accounts by balance
    const topAccounts = await Savings.find({ isActive: true })
      .populate('client', 'firstName lastName phoneNumber')
      .select('savingsNumber currentBalance interestRate totalDeposits totalWithdrawals')
      .sort({ currentBalance: -1 })
      .limit(10)
      .lean();

    const totals = totalStats[0] || {
      totalAccounts: 0,
      activeAccounts: 0,
      totalBalance: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      averageBalance: 0
    };

    res.json({
      success: true,
      data: {
        summary: totals,
        transactions: transactionStats,
        monthlyDeposits,
        topAccounts
      }
    });
  } catch (error) {
    console.error('Get savings stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching savings statistics',
      error: error.message
    });
  }
};

export const getClientSavingsAccount = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const savings = await Savings.findOne({ client: clientId, isActive: true })
      .populate('client', 'firstName middleName lastName phoneNumber nationalId')
      .populate('createdBy', 'firstName lastName email');

    if (!savings) {
      return res.status(404).json({
        success: false,
        message: 'No active savings account found for this client'
      });
    }

    res.json({
      success: true,
      data: savings
    });
  } catch (error) {
    console.error('Get client savings account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client savings account',
      error: error.message
    });
  }
};