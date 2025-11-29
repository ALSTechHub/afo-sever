import CompanyFunds from "../model/companyFund.model.js";
import Payment from "../model/payment.model.js";
import { SavingsTransaction } from "../model/savings.model.js";

export const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      timeFilter = 'all',
      startDate,
      endDate,
      transactionType = 'all',
      paymentMethod,
      search = ''
    } = req.query;

    const skip = (page - 1) * limit;

    let dateFilter = {};
    const now = new Date();

    switch (timeFilter) {
      case 'today':
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
        break;
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { createdAt: { $gte: weekAgo } };
        break;
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { createdAt: { $gte: monthAgo } };
        break;
      case '3months':
        const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        dateFilter = { createdAt: { $gte: threeMonthsAgo } };
        break;
      case '6months':
        const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        dateFilter = { createdAt: { $gte: sixMonthsAgo } };
        break;
      case 'year':
        const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        dateFilter = { createdAt: { $gte: yearAgo } };
        break;
      case 'custom':
        if (startDate && endDate) {
          const customStart = new Date(startDate);
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: customStart, $lte: customEnd } };
        }
        break;
    }

    let transactions = [];
    let totalCount = 0;

    const baseMatchStage = {
      ...dateFilter,
      ...(paymentMethod && { paymentMethod })
    };

    const searchMatch = search ? {
      $or: [
        { 'client.firstName': { $regex: search, $options: 'i' } },
        { 'client.lastName': { $regex: search, $options: 'i' } },
        { 'loan.loanNumber': { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { paymentNumber: { $regex: search, $options: 'i' } },
        { savingsNumber: { $regex: search, $options: 'i' } }
      ]
    } : {};

    if (transactionType === 'all' || transactionType === 'loan') {
      const loanPayments = await Payment.aggregate([
        {
          $match: {
            ...baseMatchStage,
            status: 'completed'
          }
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'client',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: '$client' },
        {
          $lookup: {
            from: 'loans',
            localField: 'loan',
            foreignField: '_id',
            as: 'loan'
          }
        },
        { $unwind: '$loan' },
        {
          $lookup: {
            from: 'users',
            localField: 'receivedBy',
            foreignField: '_id',
            as: 'receivedBy'
          }
        },
        { $unwind: '$receivedBy' },
        {
          $match: searchMatch
        },
        {
          $project: {
            _id: 1,
            transactionType: 'loan',
            amount: 1,
            paymentMethod: 1,
            transactionId: 1,
            paymentNumber: 1,
            paymentDate: 1,
            dueDate: 1,
            isOnTime: 1,
            lateDays: 1,
            penaltyAmount: 1,
            notes: 1,
            status: 1,
            createdAt: 1,
            'client.firstName': 1,
            'client.lastName': 1,
            'client.phoneNumber': 1,
            'loan.loanNumber': 1,
            'receivedBy.firstName': 1,
            'receivedBy.lastName': 1,
            source: 'loan_payment'
          }
        }
      ]);

      transactions = [...transactions, ...loanPayments];
    }

    if (transactionType === 'all' || transactionType === 'savings') {
      const savingsTransactions = await SavingsTransaction.aggregate([
        {
          $match: baseMatchStage
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'client',
            foreignField: '_id',
            as: 'client'
          }
        },
        { $unwind: '$client' },
        {
          $lookup: {
            from: 'users',
            localField: 'processedBy',
            foreignField: '_id',
            as: 'processedBy'
          }
        },
        { $unwind: '$processedBy' },
        {
          $lookup: {
            from: 'loans',
            localField: 'loan',
            foreignField: '_id',
            as: 'loan'
          }
        },
        {
          $addFields: {
            loan: { $arrayElemAt: ['$loan', 0] }
          }
        },
        {
          $match: searchMatch
        },
        {
          $project: {
            _id: 1,
            transactionType: '$transactionType',
            amount: 1,
            paymentMethod: 1,
            transactionId: 1,
            paymentDate: '$createdAt',
            notes: 1,
            balanceAfter: 1,
            createdAt: 1,
            'client.firstName': 1,
            'client.lastName': 1,
            'client.phoneNumber': 1,
            'loan.loanNumber': 1,
            'processedBy.firstName': 1,
            'processedBy.lastName': 1,
            source: 'savings'
          }
        }
      ]);

      transactions = [...transactions, ...savingsTransactions];
    }

    if (transactionType === 'all' || transactionType === 'company') {
      const companyTransactions = await CompanyFunds.aggregate([
        { $unwind: '$transactionHistory' },
        {
          $match: {
            'transactionHistory.createdAt': dateFilter.createdAt
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'transactionHistory.processedBy',
            foreignField: '_id',
            as: 'processedBy'
          }
        },
        { $unwind: '$processedBy' },
        {
          $lookup: {
            from: 'loans',
            localField: 'transactionHistory.loan',
            foreignField: '_id',
            as: 'loan'
          }
        },
        {
          $addFields: {
            loan: { $arrayElemAt: ['$loan', 0] }
          }
        },
        {
          $project: {
            _id: '$transactionHistory._id',
            transactionType: '$transactionHistory.transactionType',
            amount: '$transactionHistory.amount',
            paymentMethod: 'system',
            transactionDate: '$transactionHistory.transactionDate',
            description: '$transactionHistory.description',
            previousBalance: '$transactionHistory.previousBalance',
            newBalance: '$transactionHistory.newBalance',
            createdAt: '$transactionHistory.createdAt',
            'loan.loanNumber': 1,
            'processedBy.firstName': 1,
            'processedBy.lastName': 1,
            source: 'company_funds'
          }
        }
      ]);

      transactions = [...transactions, ...companyTransactions];
    }

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    totalCount = transactions.length;

    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    const transactionStats = await getTransactionStats(timeFilter, startDate, endDate, transactionType);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(totalCount / limit),
          total: totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        stats: transactionStats
      }
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

const getTransactionStats = async (timeFilter, startDate, endDate, transactionType) => {
  let dateFilter = {};
  const now = new Date();

  switch (timeFilter) {
    case 'today':
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now.setHours(23, 59, 59, 999));
      dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
      break;
    case 'week':
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { createdAt: { $gte: weekAgo } };
      break;
    case 'month':
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      dateFilter = { createdAt: { $gte: monthAgo } };
      break;
    case '3months':
      const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
      dateFilter = { createdAt: { $gte: threeMonthsAgo } };
      break;
    case '6months':
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      dateFilter = { createdAt: { $gte: sixMonthsAgo } };
      break;
    case 'year':
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      dateFilter = { createdAt: { $gte: yearAgo } };
      break;
    case 'custom':
      if (startDate && endDate) {
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: customStart, $lte: customEnd } };
      }
      break;
  }

  const stats = {
    totalTransactions: 0,
    totalAmount: 0,
    loanTransactions: 0,
    loanAmount: 0,
    savingsTransactions: 0,
    savingsAmount: 0,
    companyTransactions: 0,
    companyAmount: 0
  };

  if (transactionType === 'all' || transactionType === 'loan') {
    const loanStats = await Payment.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    if (loanStats.length > 0) {
      stats.loanTransactions = loanStats[0].count;
      stats.loanAmount = loanStats[0].totalAmount;
    }
  }

  if (transactionType === 'all' || transactionType === 'savings') {
    const savingsStats = await SavingsTransaction.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    if (savingsStats.length > 0) {
      stats.savingsTransactions = savingsStats[0].count;
      stats.savingsAmount = savingsStats[0].totalAmount;
    }
  }

  if (transactionType === 'all' || transactionType === 'company') {
    const companyStats = await CompanyFunds.aggregate([
      { $unwind: '$transactionHistory' },
      {
        $match: {
          'transactionHistory.createdAt': dateFilter.createdAt
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$transactionHistory.amount' }
        }
      }
    ]);

    if (companyStats.length > 0) {
      stats.companyTransactions = companyStats[0].count;
      stats.companyAmount = companyStats[0].totalAmount;
    }
  }

  stats.totalTransactions = stats.loanTransactions + stats.savingsTransactions + stats.companyTransactions;
  stats.totalAmount = stats.loanAmount + stats.savingsAmount + stats.companyAmount;

  return stats;
};