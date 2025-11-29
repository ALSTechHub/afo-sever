import mongoose from 'mongoose';
import CompanyFunds from '../model/companyFund.model.js';

// Helper function to get or create company funds record
const getCompanyFunds = async () => {
  let companyFunds = await CompanyFunds.findOne();
  
  if (!companyFunds) {
    companyFunds = await CompanyFunds.create({
      currentBalance: 0,
      totalDisbursed: 0,
      totalRecovered: 0,
      totalProfit: 0,
      totalExpenses: 0,
      updatedBy: new mongoose.Types.ObjectId() // Temporary ID, will be updated when used
    });
  }
  
  return companyFunds;
};

// Helper function to add transaction to company funds
const addFundsTransaction = async (transactionData, userId) => {
  const companyFunds = await getCompanyFunds();
  const previousBalance = companyFunds.currentBalance;
  
  let newBalance = previousBalance;
  let totalDisbursed = companyFunds.totalDisbursed;
  let totalRecovered = companyFunds.totalRecovered;
  let totalProfit = companyFunds.totalProfit;
  let totalExpenses = companyFunds.totalExpenses;

  // Update balances based on transaction type
  switch (transactionData.transactionType) {
    case 'initial':
    case 'replenishment':
    case 'loan-repayment':
    case 'profit':
      newBalance = previousBalance + transactionData.amount;
      if (transactionData.transactionType === 'loan-repayment') {
        totalRecovered += transactionData.amount;
      } else if (transactionData.transactionType === 'profit') {
        totalProfit += transactionData.amount;
      }
      break;
      
    case 'loan-disbursement':
    case 'expense':
      newBalance = previousBalance - transactionData.amount;
      if (transactionData.transactionType === 'loan-disbursement') {
        totalDisbursed += transactionData.amount;
      } else if (transactionData.transactionType === 'expense') {
        totalExpenses += transactionData.amount;
      }
      break;
  }

  // Validate sufficient funds for disbursements and expenses
  if (newBalance < 0) {
    throw new Error('Insufficient company funds for this transaction');
  }

  // Create transaction record
  const transaction = {
    transactionType: transactionData.transactionType,
    amount: transactionData.amount,
    previousBalance: previousBalance,
    newBalance: newBalance,
    description: transactionData.description,
    loan: transactionData.loan || null,
    payment: transactionData.payment || null,
    processedBy: userId,
    transactionDate: transactionData.transactionDate || new Date()
  };

  // Update company funds
  companyFunds.currentBalance = newBalance;
  companyFunds.totalDisbursed = totalDisbursed;
  companyFunds.totalRecovered = totalRecovered;
  companyFunds.totalProfit = totalProfit;
  companyFunds.totalExpenses = totalExpenses;
  companyFunds.transactionHistory.push(transaction);
  companyFunds.lastUpdated = new Date();
  companyFunds.updatedBy = userId;

  await companyFunds.save();
  return companyFunds;
};
export const getCompanyFundsOverview = async (req, res) => {
  try {
    const companyFunds = await getCompanyFunds();

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName')
      .populate('transactionHistory.loan', 'loanNumber')
      .populate('transactionHistory.payment', 'paymentNumber');

    res.json({
      success: true,
      data: populatedFunds
    });
  } catch (error) {
    console.error('Get company funds overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company funds',
      error: error.message
    });
  }
};

export const initializeCompanyFunds = async (req, res) => {
  try {
    const { initialAmount, description } = req.body;

    if (!initialAmount || initialAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Initial amount must be greater than 0'
      });
    }

    // Check if funds already exist and have transactions
    const existingFunds = await CompanyFunds.findOne();
    if (existingFunds && existingFunds.transactionHistory.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Company funds have already been initialized'
      });
    }

    const transactionData = {
      transactionType: 'initial',
      amount: initialAmount,
      description: description || 'Initial company funds setup'
    };

    const companyFunds = await addFundsTransaction(transactionData, req.user._id);

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Company funds initialized successfully',
      data: populatedFunds
    });
  } catch (error) {
    console.error('Initialize company funds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while initializing company funds',
      error: error.message
    });
  }
};

export const replenishCompanyFunds = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Replenishment amount must be greater than 0'
      });
    }

    const transactionData = {
      transactionType: 'replenishment',
      amount: amount,
      description: description || 'Funds replenishment'
    };

    const companyFunds = await addFundsTransaction(transactionData, req.user._id);

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: `Company funds replenished with ${amount} successfully`,
      data: populatedFunds
    });
  } catch (error) {
    console.error('Replenish company funds error:', error);
    if (error.message === 'Insufficient company funds for this transaction') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while replenishing company funds',
      error: error.message
    });
  }
};

export const recordLoanDisbursement = async (req, res) => {
  try {
    const { amount, loan: loanId, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Disbursement amount must be greater than 0'
      });
    }

    if (!loanId || !mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid loan ID is required'
      });
    }

    // Validate loan exists
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const transactionData = {
      transactionType: 'loan-disbursement',
      amount: amount,
      loan: loanId,
      description: description || `Loan disbursement for ${loan.loanNumber}`
    };

    const companyFunds = await addFundsTransaction(transactionData, req.user._id);

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName')
      .populate('transactionHistory.loan', 'loanNumber');

    res.status(201).json({
      success: true,
      message: `Loan disbursement of ${amount} recorded successfully`,
      data: populatedFunds
    });
  } catch (error) {
    console.error('Record loan disbursement error:', error);
    if (error.message === 'Insufficient company funds for this transaction') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while recording loan disbursement',
      error: error.message
    });
  }
};

export const recordLoanRepayment = async (req, res) => {
  try {
    const { amount, loan: loanId, payment: paymentId, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Repayment amount must be greater than 0'
      });
    }

    if (!loanId || !mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid loan ID is required'
      });
    }

    // Validate loan exists
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Validate payment exists if provided
    if (paymentId && !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment ID is required'
      });
    }

    let paymentData = null;
    if (paymentId) {
      const Payment = await import('../model/payment.model.js').then(mod => mod.default);
      paymentData = await Payment.findById(paymentId);
      if (!paymentData) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }
    }

    const transactionData = {
      transactionType: 'loan-repayment',
      amount: amount,
      loan: loanId,
      payment: paymentId || null,
      description: description || `Loan repayment for ${loan.loanNumber}`
    };

    const companyFunds = await addFundsTransaction(transactionData, req.user._id);

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName')
      .populate('transactionHistory.loan', 'loanNumber')
      .populate('transactionHistory.payment', 'paymentNumber');

    res.status(201).json({
      success: true,
      message: `Loan repayment of ${amount} recorded successfully`,
      data: populatedFunds
    });
  } catch (error) {
    console.error('Record loan repayment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording loan repayment',
      error: error.message
    });
  }
};
export const recordExpense = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be greater than 0'
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Expense description is required'
      });
    }

    const transactionData = {
      transactionType: 'expense',
      amount: amount,
      description: description
    };

    const companyFunds = await addFundsTransaction(transactionData, req.user._id);

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: `Expense of ${amount} recorded successfully`,
      data: populatedFunds
    });
  } catch (error) {
    console.error('Record expense error:', error);
    if (error.message === 'Insufficient company funds for this transaction') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while recording expense',
      error: error.message
    });
  }
};

export const recordProfit = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Profit amount must be greater than 0'
      });
    }

    const transactionData = {
      transactionType: 'profit',
      amount: amount,
      description: description || 'Company profit'
    };

    const companyFunds = await addFundsTransaction(transactionData, req.user._id);

    const populatedFunds = await CompanyFunds.findById(companyFunds._id)
      .populate('updatedBy', 'firstName lastName email')
      .populate('transactionHistory.processedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: `Profit of ${amount} recorded successfully`,
      data: populatedFunds
    });
  } catch (error) {
    console.error('Record profit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording profit',
      error: error.message
    });
  }
};
export const getCompanyFundsTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      transactionType,
      startDate,
      endDate,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = req.query;

    const companyFunds = await getCompanyFunds();

    let transactions = companyFunds.transactionHistory;

    // Filter by transaction type
    if (transactionType) {
      if (Array.isArray(transactionType)) {
        transactions = transactions.filter(t => transactionType.includes(t.transactionType));
      } else {
        transactions = transactions.filter(t => t.transactionType === transactionType);
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort transactions
    transactions.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      } else {
        return new Date(aValue) - new Date(bValue);
      }
    });

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const paginatedTransactions = transactions.slice(skip, skip + limitNum);

    // Populate transaction references
    const populatedTransactions = await Promise.all(
      paginatedTransactions.map(async (transaction) => {
        const populated = { ...transaction.toObject ? transaction.toObject() : transaction };
        
        if (transaction.processedBy) {
          const User = await import('../model/user.model.js').then(mod => mod.default);
          const user = await User.findById(transaction.processedBy).select('firstName lastName email');
          populated.processedBy = user;
        }
        
        if (transaction.loan) {
          const Loan = await import('../model/loan.model.js').then(mod => mod.default);
          const loan = await Loan.findById(transaction.loan).select('loanNumber');
          populated.loan = loan;
        }
        
        if (transaction.payment) {
          const Payment = await import('../model/payment.model.js').then(mod => mod.default);
          const payment = await Payment.findById(transaction.payment).select('paymentNumber');
          populated.payment = payment;
        }
        
        return populated;
      })
    );

    const total = transactions.length;
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        summary: {
          currentBalance: companyFunds.currentBalance,
          totalDisbursed: companyFunds.totalDisbursed,
          totalRecovered: companyFunds.totalRecovered,
          totalProfit: companyFunds.totalProfit,
          totalExpenses: companyFunds.totalExpenses
        },
        transactions: populatedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get company funds transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company funds transactions',
      error: error.message
    });
  }
};

export const getCompanyFundsStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyFunds = await getCompanyFunds();

    let transactions = companyFunds.transactionHistory;

    // Filter by date range if provided
    if (startDate || endDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        if (startDate && transactionDate < new Date(startDate)) return false;
        if (endDate && transactionDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Calculate statistics by transaction type
    const statsByType = transactions.reduce((acc, transaction) => {
      const type = transaction.transactionType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalAmount: 0
        };
      }
      acc[type].count += 1;
      acc[type].totalAmount += transaction.amount;
      return acc;
    }, {});

    // Calculate monthly breakdown
    const monthlyBreakdown = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          income: 0,
          expenses: 0,
          net: 0
        };
      }

      if (['initial', 'replenishment', 'loan-repayment', 'profit'].includes(transaction.transactionType)) {
        acc[monthYear].income += transaction.amount;
        acc[monthYear].net += transaction.amount;
      } else {
        acc[monthYear].expenses += transaction.amount;
        acc[monthYear].net -= transaction.amount;
      }

      return acc;
    }, {});

    // Calculate profit/loss
    const totalIncome = transactions
      .filter(t => ['initial', 'replenishment', 'loan-repayment', 'profit'].includes(t.transactionType))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => ['loan-disbursement', 'expense'].includes(t.transactionType))
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;

    // Get recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        currentBalance: companyFunds.currentBalance,
        totalDisbursed: companyFunds.totalDisbursed,
        totalRecovered: companyFunds.totalRecovered,
        totalProfit: companyFunds.totalProfit,
        totalExpenses: companyFunds.totalExpenses,
        performance: {
          totalIncome,
          totalExpenses,
          netProfit,
          roi: companyFunds.totalDisbursed > 0 ? 
               ((companyFunds.totalRecovered - companyFunds.totalDisbursed) / companyFunds.totalDisbursed * 100).toFixed(2) : 0
        },
        byType: statsByType,
        monthly: monthlyBreakdown,
        recentTransactions: recentTransactions.length
      }
    });
  } catch (error) {
    console.error('Get company funds stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company funds statistics',
      error: error.message
    });
  }
};

export const getCompanyFundsBalance = async (req, res) => {
  try {
    const companyFunds = await getCompanyFunds();

    res.json({
      success: true,
      data: {
        currentBalance: companyFunds.currentBalance,
        lastUpdated: companyFunds.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get company funds balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching company funds balance',
      error: error.message
    });
  }
};