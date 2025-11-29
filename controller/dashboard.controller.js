import Loan from "../model/loan.model.js";
import Payment from "../model/payment.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Total Active Loans
    const activeLoans = await Loan.countDocuments({ 
      status: { $in: ['active', 'on-track', 'ahead'] } 
    });

    // Total Active Loans Amount
    const activeLoansAmount = await Loan.aggregate([
      { $match: { status: { $in: ['active', 'on-track', 'ahead'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Pending Payments (payments due but not paid)
    const today = new Date();
    const pendingPayments = await Loan.aggregate([
      { 
        $match: { 
          status: { $in: ['active', 'on-track', 'ahead'] },
          dueDate: { $lte: today }
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: '$remainingBalance' },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Pending Approvals
    const pendingApprovals = await Loan.countDocuments({ status: 'pending' });

    // Recent Activity (last 10 activities)
    const recentActivity = await Payment.find()
      .populate('client', 'firstName lastName')
      .populate('loan', 'loanNumber')
      .sort({ paymentDate: -1 })
      .limit(10)
      .select('amount paymentDate paymentMethod client loan status');

    // Format recent activity
    const formattedActivity = recentActivity.map(payment => ({
      id: payment._id,
      type: 'payment',
      title: 'Payment Received',
      subtitle: `Client: ${payment.client.firstName} ${payment.client.lastName} • ${payment.loan.loanNumber}`,
      amount: payment.amount,
      time: payment.paymentDate,
      status: payment.status
    }));
const borrowerLeaderboard = await Payment.aggregate([
  {
    $match: { status: 'completed' }
  },
  {
    $lookup: {
      from: 'loans',
      localField: 'loan',
      foreignField: '_id',
      as: 'loanInfo'
    }
  },
  {
    $unwind: '$loanInfo'
  },
  {
    $match: {
      'loanInfo.status': { $in: ['active', 'on-track', 'ahead', 'at-risk'] }
    }
  },
  {
    $group: {
      _id: '$client',
      totalPaid: { $sum: '$amount' },
      paymentCount: { $sum: 1 },
      lastPaymentDate: { $max: '$paymentDate' },
      totalLoanAmount: { $sum: '$loanInfo.totalAmount' },
      amountPaid: { $sum: '$loanInfo.amountPaid' },
      activeLoansCount: {
        $addToSet: '$loanInfo._id'
      }
    }
  },
  {
    $addFields: {
      activeLoansCount: { $size: '$activeLoansCount' },
      progress: {
        $cond: [
          { $eq: ['$totalLoanAmount', 0] },
          0,
          { $multiply: [{ $divide: ['$amountPaid', '$totalLoanAmount'] }, 100] }
        ]
      }
    }
  },
  {
    $lookup: {
      from: 'clients',
      localField: '_id',
      foreignField: '_id',
      as: 'client'
    }
  },
  {
    $unwind: '$client'
  },
  {
    $project: {
      'client.firstName': 1,
      'client.lastName': 1,
      'client.phoneNumber': 1,
      totalPaid: 1,
      paymentCount: 1,
      lastPaymentDate: 1,
      activeLoansCount: 1,
      totalLoanAmount: 1,
      amountPaid: 1,
      progress: { $round: ['$progress', 1] } // Round to 1 decimal place
    }
  },
  {
    $sort: { totalPaid: -1 }
  },
  {
    $limit: 10
  }
]);

    res.json({
      success: true,
      data: {
        activeLoans: {
          count: activeLoans,
          amount: activeLoansAmount[0]?.total || 0
        },
        pendingPayments: {
          count: pendingPayments[0]?.count || 0,
          amount: pendingPayments[0]?.totalAmount || 0
        },
        pendingApprovals: pendingApprovals,
        recentActivity: formattedActivity,
        borrowerLeaderboard: borrowerLeaderboard
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

export const getBorrowerLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // First, get all clients with active loans
    const activeClients = await Loan.aggregate([
      {
        $match: {
          status: { $in: ['active', 'on-track', 'ahead', 'at-risk'] }
        }
      },
      {
        $group: {
          _id: '$client',
          activeLoansCount: { $sum: 1 },
          totalLoanAmount: { $sum: '$totalAmount' },
          totalAmountPaid: { $sum: '$amountPaid' },
          totalRemainingBalance: { $sum: '$remainingBalance' }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: '$client'
      },
      {
        $project: {
          'client.firstName': 1,
          'client.lastName': 1,
          'client.phoneNumber': 1,
          'client.email': 1,
          activeLoansCount: 1,
          totalLoanAmount: 1,
          totalAmountPaid: 1,
          totalRemainingBalance: 1,
          repaymentRate: {
            $cond: [
              { $eq: ['$totalLoanAmount', 0] },
              0,
              { $multiply: [{ $divide: ['$totalAmountPaid', '$totalLoanAmount'] }, 100] }
            ]
          }
        }
      }
    ]);

    // Get client IDs with active loans
    const activeClientIds = activeClients.map(client => client._id);

    // Now get payment statistics for these active clients only
    const leaderboard = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          client: { $in: activeClientIds }
        }
      },
      {
        $group: {
          _id: '$client',
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
          lastPaymentDate: { $max: '$paymentDate' },
          averagePayment: { $avg: '$amount' },
          firstPaymentDate: { $min: '$paymentDate' }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: '$client'
      },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'client',
          as: 'loans'
        }
      },
      {
        $addFields: {
          activeLoans: {
            $filter: {
              input: '$loans',
              as: 'loan',
              cond: {
                $in: ['$$loan.status', ['active', 'on-track', 'ahead', 'at-risk']]
              }
            }
          }
        }
      },
      {
        $addFields: {
          currentLoanAmount: { $sum: '$activeLoans.totalAmount' },
          currentAmountPaid: { $sum: '$activeLoans.amountPaid' },
          currentRemainingBalance: { $sum: '$activeLoans.remainingBalance' },
          activeLoansCount: { $size: '$activeLoans' }
        }
      },
      {
        $project: {
          'client.firstName': 1,
          'client.lastName': 1,
          'client.phoneNumber': 1,
          'client.email': 1,
          totalPaid: 1,
          paymentCount: 1,
          lastPaymentDate: 1,
          averagePayment: 1,
          firstPaymentDate: 1,
          currentLoanAmount: 1,
          currentAmountPaid: 1,
          currentRemainingBalance: 1,
          activeLoansCount: 1,
          currentRepaymentRate: {
            $cond: [
              { $eq: ['$currentLoanAmount', 0] },
              0,
              { $multiply: [{ $divide: ['$currentAmountPaid', '$currentLoanAmount'] }, 100] }
            ]
          },
          overallRepaymentRate: {
            $cond: [
              { $eq: ['$totalPaid', 0] },
              0,
              { $multiply: [{ $divide: ['$currentAmountPaid', '$currentLoanAmount'] }, 100] }
            ]
          }
        }
      },
      {
        $match: search ? {
          $or: [
            { 'client.firstName': { $regex: search, $options: 'i' } },
            { 'client.lastName': { $regex: search, $options: 'i' } },
            { 'client.phoneNumber': { $regex: search, $options: 'i' } },
            { 'client.email': { $regex: search, $options: 'i' } }
          ]
        } : {}
      },
      {
        $sort: { 
          currentAmountPaid: -1,
          paymentCount: -1 
        }
      },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) }
          ],
          pagination: [
            { $count: 'total' }
          ]
        }
      }
    ]);

    const data = leaderboard[0].data;
    const total = leaderboard[0].pagination[0]?.total || 0;
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        borrowers: data,
        pagination: {
          current: parseInt(page),
          pages: pages,
          total: total,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Borrower leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching borrower leaderboard',
      error: error.message
    });
  }
};