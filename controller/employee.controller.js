import Client from "../model/client.model.js";
import Loan from "../model/loan.model.js";
import Payment from "../model/payment.model.js";
import Task from "../model/task.model.js";

export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user._id;
    
    // Get employee's clients count
    const clientsCount = await Client.countDocuments({ createdBy: employeeId });
    
    // Get employee's payments count and total collection
    const paymentsData = await Payment.aggregate([
      {
        $match: { 
          receivedBy: employeeId,
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
    
    const paymentsCount = paymentsData.length > 0 ? paymentsData[0].count : 0;
    const totalCollection = paymentsData.length > 0 ? paymentsData[0].totalAmount : 0;
    
    // Get employee's pending tasks count
    const pendingTasksCount = await Task.countDocuments({ 
      assignedTo: employeeId,
      status: { $in: ['pending', 'in-progress', 'overdue'] }
    });
    
    // Get recent tasks assigned to employee - FIXED: populate loan and then client from loan
    const recentTasks = await Task.find({ 
      assignedTo: employeeId 
    })
    .populate({
      path: 'loan',
      select: 'loanNumber client',
      populate: {
        path: 'client',
        select: 'firstName lastName'
      }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title taskType status dueDate loan amountCollected createdAt');
    
    // Format recent tasks to include client information
    const formattedRecentTasks = recentTasks.map(task => ({
      _id: task._id,
      title: task.title,
      taskType: task.taskType,
      status: task.status,
      dueDate: task.dueDate,
      amountCollected: task.amountCollected,
      createdAt: task.createdAt,
      client: task.loan?.client ? {
        firstName: task.loan.client.firstName,
        lastName: task.loan.client.lastName
      } : null,
      loan: task.loan ? {
        loanNumber: task.loan.loanNumber
      } : null
    }));
    
    // Calculate performance score
    const completedTasks = await Task.countDocuments({ 
      assignedTo: employeeId,
      status: 'completed'
    });
    
    const totalTasks = completedTasks + pendingTasksCount;
    const performanceScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
    
    res.json({
      success: true,
      data: {
        clientsRecorded: clientsCount,
        paymentsCollected: paymentsCount,
        totalCollection: totalCollection,
        pendingTasks: pendingTasksCount,
        performanceScore: performanceScore,
        monthlyTarget: 30, 
        recentTasks: formattedRecentTasks
      }
    });
    
  } catch (error) {
    console.error('Employee dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};
export const getEmployeePerformance = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { period = 'month' } = req.query; // month, quarter, year

    // Calculate date range based on period
    const getDateRange = (period) => {
      const now = new Date();
      switch (period) {
        case 'week':
          return new Date(now.setDate(now.getDate() - 7));
        case 'quarter':
          return new Date(now.setMonth(now.getMonth() - 3));
        case 'year':
          return new Date(now.setFullYear(now.getFullYear() - 1));
        default: // month
          return new Date(now.setMonth(now.getMonth() - 1));
      }
    };

    const startDate = getDateRange(period);
    const currentDate = new Date();

    // 1. CLIENT REGISTRATION ANALYTICS
    const clientStats = await Client.aggregate([
      {
        $match: {
          createdBy: employeeId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          eligibleClients: {
            $sum: { $cond: ['$isEligible', 1, 0] }
          },
          avgCreditScore: { $avg: '$creditScore' },
          totalLoansTaken: { $sum: '$totalLoansTaken' }
        }
      }
    ]);

    // 2. LOAN PROCESSING ANALYTICS
    const loanStats = await Loan.aggregate([
      {
        $match: {
          createdBy: employeeId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' },
          totalAmountDisbursed: { $sum: '$totalAmount' },
          avgLoanAmount: { $avg: '$loanAmount' },
          completedLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          activeLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          defaultedLoans: {
            $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] }
          },
          totalRemainingBalance: { $sum: '$remainingBalance' }
        }
      }
    ]);

    // 3. PAYMENT COLLECTION ANALYTICS
    const paymentStats = await Payment.aggregate([
      {
        $match: {
          receivedBy: employeeId,
          paymentDate: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmountCollected: { $sum: '$amount' },
          onTimePayments: {
            $sum: { $cond: ['$isOnTime', 1, 0] }
          },
          latePayments: {
            $sum: { $cond: [{ $eq: ['$isOnTime', false] }, 1, 0] }
          },
          totalPenalties: { $sum: '$penaltyAmount' },
          avgPaymentAmount: { $avg: '$amount' }
        }
      }
    ]);

    // 4. TASK PERFORMANCE ANALYTICS
    const taskStats = await Task.aggregate([
      {
        $match: {
          assignedTo: employeeId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTasks: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'in-progress']] }, 1, 0] }
          },
          overdueTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] }
          },
          totalAmountCollected: { $sum: '$amountCollected' },
          highPriorityTasks: {
            $sum: { $cond: [{ $in: ['$priority', ['high', 'urgent']] }, 1, 0] }
          }
        }
      }
    ]);

    // 5. PERFORMANCE SCORES & RATINGS
    const clientData = clientStats[0] || {};
    const loanData = loanStats[0] || {};
    const paymentData = paymentStats[0] || {};
    const taskData = taskStats[0] || {};

    // Calculate performance metrics
    const collectionEfficiency = paymentData.totalPayments > 0 
      ? (paymentData.onTimePayments / paymentData.totalPayments) * 100 
      : 0;

    const taskCompletionRate = taskData.totalTasks > 0 
      ? (taskData.completedTasks / taskData.totalTasks) * 100 
      : 0;

    const loanSuccessRate = loanData.totalLoans > 0 
      ? ((loanData.completedLoans + loanData.activeLoans) / loanData.totalLoans) * 100 
      : 0;

    const recoveryRate = loanData.totalAmountDisbursed > 0 
      ? ((loanData.totalAmountDisbursed - loanData.totalRemainingBalance) / loanData.totalAmountDisbursed) * 100 
      : 0;

    // Overall Performance Score (Weighted Average)
    const overallScore = Math.round(
      (collectionEfficiency * 0.3) +
      (taskCompletionRate * 0.25) +
      (loanSuccessRate * 0.25) +
      (recoveryRate * 0.2)
    );

    // 6. TREND DATA (Last 6 months)
    const monthlyTrends = await Payment.aggregate([
      {
        $match: {
          receivedBy: employeeId,
          paymentDate: { 
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // 7. RECENT ACTIVITIES
    const recentActivities = await Task.find({
      assignedTo: employeeId
    })
    .populate({
      path: 'loan',
      select: 'loanNumber client',
      populate: {
        path: 'client',
        select: 'firstName lastName'
      }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('title taskType status dueDate amountCollected createdAt outcome');

    // 8. PERFORMANCE BADGES
    const getPerformanceBadges = () => {
      const badges = [];
      if (collectionEfficiency >= 95) badges.push('Collection Expert');
      if (taskCompletionRate >= 90) badges.push('Task Master');
      if (clientData.totalClients >= 20) badges.push('Client Champion');
      if (loanData.completedLoans >= 10) badges.push('Loan Specialist');
      if (paymentData.totalAmountCollected >= 100000) badges.push('Revenue Generator');
      return badges;
    };

    res.json({
      success: true,
      data: {
        overview: {
          overallScore,
          performanceRating: getPerformanceRating(overallScore),
          period,
          badges: getPerformanceBadges()
        },
        clientRegistration: {
          totalClients: clientData.totalClients || 0,
          eligibleClients: clientData.eligibleClients || 0,
          avgCreditScore: Math.round(clientData.avgCreditScore || 0),
          totalLoansTaken: clientData.totalLoansTaken || 0
        },
        loanProcessing: {
          totalLoans: loanData.totalLoans || 0,
          totalLoanAmount: loanData.totalLoanAmount || 0,
          totalAmountDisbursed: loanData.totalAmountDisbursed || 0,
          avgLoanAmount: Math.round(loanData.avgLoanAmount || 0),
          completedLoans: loanData.completedLoans || 0,
          activeLoans: loanData.activeLoans || 0,
          defaultedLoans: loanData.defaultedLoans || 0,
          loanSuccessRate: Math.round(loanSuccessRate),
          recoveryRate: Math.round(recoveryRate)
        },
        paymentCollection: {
          totalPayments: paymentData.totalPayments || 0,
          totalAmountCollected: paymentData.totalAmountCollected || 0,
          onTimePayments: paymentData.onTimePayments || 0,
          latePayments: paymentData.latePayments || 0,
          collectionEfficiency: Math.round(collectionEfficiency),
          totalPenalties: paymentData.totalPenalties || 0,
          avgPaymentAmount: Math.round(paymentData.avgPaymentAmount || 0)
        },
        taskPerformance: {
          totalTasks: taskData.totalTasks || 0,
          completedTasks: taskData.completedTasks || 0,
          pendingTasks: taskData.pendingTasks || 0,
          overdueTasks: taskData.overdueTasks || 0,
          taskCompletionRate: Math.round(taskCompletionRate),
          totalAmountCollected: taskData.totalAmountCollected || 0,
          highPriorityTasks: taskData.highPriorityTasks || 0
        },
        trends: monthlyTrends,
        recentActivities,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Employee performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load performance data'
    });
  }
};

function getPerformanceRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Satisfactory';
  return 'Needs Improvement';
}