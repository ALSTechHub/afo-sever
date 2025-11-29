import mongoose from 'mongoose';
import Client from '../model/client.model.js';
import Loan from '../model/loan.model.js';
import Payment from '../model/payment.model.js';

export const createClient = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      phoneNumber,
      nationalId,
      address,
      emergencyContact
    } = req.body;

    // Check if client with same phone number already exists
    const clientWithPhoneExists = await Client.findOne({
      phoneNumber: phoneNumber
    });

    if (clientWithPhoneExists) {
      return res.status(400).json({
        success: false,
        message: 'Client with this phone number already exists'
      });
    }

    // Check if client with same national ID already exists
    const clientWithNationalIdExists = await Client.findOne({
      nationalId: nationalId
    });

    if (clientWithNationalIdExists) {
      return res.status(400).json({
        success: false,
        message: 'Client with this national ID already exists'
      });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Validate national ID format (basic validation)
    if (nationalId.length < 5 || nationalId.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'National ID must be between 5 and 20 characters'
      });
    }

    const client = await Client.create({
      firstName,
      middleName,
      lastName,
      phoneNumber,
      nationalId,
      address,
      emergencyContact,
      createdBy: req.user._id
    });

    const populatedClient = await Client.findById(client._id)
      .populate('createdBy', 'firstName lastName email');

    // NOTIFICATION: Client Created - Send to All Admins
    try {
      // Import User model to find admin users
      const User = await import('../model/user.model.js').then(mod => mod.default);
      const { createNotification } = await import('./notification.controller.js');
      
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' }).select('_id firstName lastName');
      
      // Send notification to all admin users
      const notificationPromises = adminUsers.map(adminUser => 
        createNotification({
          title: '👤 New Client Registered',
          message: `${client.firstName} ${client.lastName} has been registered by ${req.user.firstName} ${req.user.lastName}`,
          type: 'client_created',
          recipient: adminUser._id,
          sender: req.user._id, 
          relatedEntity: {
            entityType: 'client',
            entityId: client._id
          },
          priority: 'medium',
        })
      );
      
      await Promise.all(notificationPromises);
      console.log(`📨 Client creation notifications sent to ${adminUsers.length} admin(s)`);
    } catch (notificationError) {
      console.error('❌ Error sending client notification:', notificationError);
      // Don't fail client creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: populatedClient
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating client',
      error: error.message
    });
  }
};
export const getClients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isEligible,
      county,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search by name, phone, or national ID
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { middleName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by eligibility
    if (isEligible !== undefined) {
      query.isEligible = isEligible === 'true';
    }

    // Filter by county
    if (county) {
      query['address.county'] = { $regex: county, $options: 'i' };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get clients with pagination
    const clients = await Client.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Client.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: clients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clients',
      error: error.message
    });
  }
};

export const getClient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    // Get client with populated createdBy
    const client = await Client.findById(id)
      .populate('createdBy', 'firstName lastName email phoneNumber')
      .lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get all loans for this client with detailed population
    const loans = await Loan.find({ client: id })
      .populate('item', 'name description actualPrice brand model')
      .populate('interestPlan', 'name interestRate description')
      .populate('assignedEmployee', 'firstName lastName phoneNumber')
      .populate('approvedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('disbursementDetails.disbursedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    // Get all payments for this client
    const payments = await Payment.find({ client: id })
      .populate('loan', 'loanNumber totalAmount loanType')
      .populate('receivedBy', 'firstName lastName phoneNumber')
      .populate('reversedBy', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .lean();

    // Calculate performance metrics
    const performance = await calculateClientPerformance(id, loans, payments);

    // Calculate automatic credit score
    const calculatedCreditScore = await calculateAutomaticCreditScore(id, loans, payments);

    // Update client's credit score if different
    if (client.creditScore !== calculatedCreditScore) {
      await Client.findByIdAndUpdate(id, { creditScore: calculatedCreditScore });
      client.creditScore = calculatedCreditScore;
    }

    res.json({
      success: true,
      data: {
        client,
        loans,
        payments,
        performance
      }
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client details',
      error: error.message
    });
  }
};

const calculateClientPerformance = async (clientId, loans, payments) => {
  const totalLoans = loans.length;
  const activeLoans = loans.filter(loan => ['active', 'at-risk', 'on-track', 'ahead'].includes(loan.status)).length;
  const completedLoans = loans.filter(loan => loan.status === 'completed').length;
  const defaultedLoans = loans.filter(loan => loan.status === 'defaulted').length;

  // Payment analysis
  const totalPayments = payments.length;
  const onTimePayments = payments.filter(p => p.isOnTime && p.status === 'completed').length;
  const latePayments = payments.filter(p => !p.isOnTime && p.status === 'completed').length;

  // Amount calculations
  const totalBorrowed = loans.reduce((sum, loan) => sum + (loan.totalAmount || 0), 0);
  const totalRepaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);

  const totalInterestPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => {
      const loan = loans.find(l => l._id.toString() === payment.loan._id.toString());
      if (loan) {
        const principal = loan.loanAmount || loan.itemPrice || 0;
        const interestRate = loan.interestRate || 0;
        const interestAmount = (payment.amount * interestRate) / 100;
        return sum + interestAmount;
      }
      return sum;
    }, 0);

  // Timely repayment rate
  const timelyRepaymentRate = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 100;

  // Default rate
  const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

  // Average days late
  const latePaymentDays = payments
    .filter(p => p.lateDays > 0)
    .reduce((sum, p) => sum + p.lateDays, 0);
  const averageDaysLate = latePayments > 0 ? latePaymentDays / latePayments : 0;

  // Loan utilization (if we had credit limit)
  const loanUtilizationRate = 0; // This would require credit limit data

  return {
    summary: {
      totalLoans,
      activeLoans,
      completedLoans,
      defaultedLoans,
      totalPayments,
      onTimePayments,
      latePayments,
      timelyRepaymentRate: Math.round(timelyRepaymentRate),
      defaultRate: Math.round(defaultRate),
      averageDaysLate: Math.round(averageDaysLate * 10) / 10
    },
    financials: {
      totalBorrowed: Math.round(totalBorrowed),
      totalRepaid: Math.round(totalRepaid),
      totalInterestPaid: Math.round(totalInterestPaid),
      outstandingBalance: Math.round(totalBorrowed - totalRepaid),
      loanUtilizationRate: Math.round(loanUtilizationRate)
    },
    trends: {
      paymentConsistency: calculatePaymentConsistency(payments),
      riskLevel: calculateRiskLevel(defaultRate, timelyRepaymentRate, averageDaysLate),
      improvement: calculateImprovementTrend(loans, payments)
    }
  };
};

const calculateAutomaticCreditScore = async (clientId, loans, payments) => {
  let score = 100; // Start with perfect score

  // Factor 1: Payment History (40%)
  const paymentHistoryScore = calculatePaymentHistoryScore(payments);
  score = score * 0.6 + paymentHistoryScore * 0.4;

  // Factor 2: Loan Defaults (25%)
  const defaultScore = calculateDefaultScore(loans);
  score = score * 0.75 + defaultScore * 0.25;

  // Factor 3: Credit Utilization (15%)
  const utilizationScore = calculateUtilizationScore(loans);
  score = score * 0.85 + utilizationScore * 0.15;

  // Factor 4: Credit History Length (10%)
  const historyLengthScore = calculateHistoryLengthScore(loans);
  score = score * 0.9 + historyLengthScore * 0.1;

  // Factor 5: Recent Activity (10%)
  const recentActivityScore = calculateRecentActivityScore(loans, payments);
  score = score * 0.9 + recentActivityScore * 0.1;

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
};

const calculatePaymentHistoryScore = (payments) => {
  if (payments.length === 0) return 100;

  const completedPayments = payments.filter(p => p.status === 'completed');
  if (completedPayments.length === 0) return 100;

  const onTimeRate = completedPayments.filter(p => p.isOnTime).length / completedPayments.length;
  const latePayments = completedPayments.filter(p => !p.isOnTime);

  let score = onTimeRate * 100;

  // Penalize for severe lateness
  const severeLate = latePayments.filter(p => p.lateDays > 30).length;
  score -= severeLate * 10;

  // Penalize for moderate lateness
  const moderateLate = latePayments.filter(p => p.lateDays > 7 && p.lateDays <= 30).length;
  score -= moderateLate * 5;

  return Math.max(0, score);
};

const calculateDefaultScore = (loans) => {
  if (loans.length === 0) return 100;

  const defaultRate = loans.filter(l => l.status === 'defaulted').length / loans.length;
  return Math.max(0, 100 - (defaultRate * 100));
};

const calculateUtilizationScore = (loans) => {
  const activeLoans = loans.filter(l => ['active', 'at-risk', 'on-track'].includes(l.status));
  if (activeLoans.length === 0) return 100;

  // Simulate credit utilization (in real scenario, you'd have credit limits)
  const totalActiveAmount = activeLoans.reduce((sum, loan) => sum + (loan.totalAmount || 0), 0);

  // Assuming average credit limit based on client history
  const estimatedLimit = Math.max(50000, totalActiveAmount * 2);
  const utilization = totalActiveAmount / estimatedLimit;

  return utilization <= 0.3 ? 100 :
    utilization <= 0.5 ? 80 :
      utilization <= 0.7 ? 60 :
        utilization <= 0.9 ? 40 : 20;
};

const calculateHistoryLengthScore = (loans) => {
  if (loans.length === 0) return 50;

  const firstLoan = loans.reduce((oldest, loan) => {
    return new Date(loan.createdAt) < new Date(oldest.createdAt) ? loan : oldest;
  });

  const monthsSinceFirstLoan = (new Date() - new Date(firstLoan.createdAt)) / (30 * 24 * 60 * 60 * 1000);

  return Math.min(100, 50 + (monthsSinceFirstLoan * 2));
};

const calculateRecentActivityScore = (loans, payments) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const recentLoans = loans.filter(loan => new Date(loan.createdAt) > sixMonthsAgo);
  const recentPayments = payments.filter(p => new Date(p.paymentDate) > sixMonthsAgo);

  if (recentLoans.length === 0 && recentPayments.length === 0) return 70;

  const recentOnTimePayments = recentPayments.filter(p => p.isOnTime && p.status === 'completed').length;
  const recentPaymentRate = recentPayments.length > 0 ? recentOnTimePayments / recentPayments.length : 1;

  return recentPaymentRate * 100;
};

const calculatePaymentConsistency = (payments) => {
  if (payments.length < 3) return 'Excellent';

  const intervals = [];
  const sortedPayments = payments
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

  for (let i = 1; i < sortedPayments.length; i++) {
    const diff = (new Date(sortedPayments[i].paymentDate) - new Date(sortedPayments[i - 1].paymentDate)) / (24 * 60 * 60 * 1000);
    intervals.push(diff);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  const consistencyRatio = stdDev / avgInterval;

  return consistencyRatio < 0.1 ? 'Excellent' :
    consistencyRatio < 0.2 ? 'Good' :
      consistencyRatio < 0.3 ? 'Fair' : 'Poor';
};

const calculateRiskLevel = (defaultRate, timelyRepaymentRate, averageDaysLate) => {
  if (defaultRate > 20 || timelyRepaymentRate < 60) return 'High';
  if (defaultRate > 10 || timelyRepaymentRate < 80 || averageDaysLate > 14) return 'Medium';
  if (defaultRate > 5 || timelyRepaymentRate < 90 || averageDaysLate > 7) return 'Low';
  return 'Very Low';
};

const calculateImprovementTrend = (loans, payments) => {
  if (loans.length < 2) return 'Stable';

  const sortedLoans = loans.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const half = Math.ceil(sortedLoans.length / 2);
  const firstHalf = sortedLoans.slice(0, half);
  const secondHalf = sortedLoans.slice(half);

  const firstHalfDefaults = firstHalf.filter(l => l.status === 'defaulted').length;
  const secondHalfDefaults = secondHalf.filter(l => l.status === 'defaulted').length;

  const firstHalfDefaultRate = firstHalf.length > 0 ? firstHalfDefaults / firstHalf.length : 0;
  const secondHalfDefaultRate = secondHalf.length > 0 ? secondHalfDefaults / secondHalf.length : 0;

  if (secondHalfDefaultRate < firstHalfDefaultRate * 0.7) return 'Improving';
  if (secondHalfDefaultRate > firstHalfDefaultRate * 1.3) return 'Declining';
  return 'Stable';
};
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      phoneNumber,
      nationalId,
      address,
      emergencyContact,
      isEligible,
      blacklistReason
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if phone number is being changed and if new phone already exists
    if (phoneNumber && phoneNumber !== client.phoneNumber) {
      const clientWithPhoneExists = await Client.findOne({
        phoneNumber: phoneNumber,
        _id: { $ne: id }
      });

      if (clientWithPhoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Client with this phone number already exists'
        });
      }

      // Validate phone number format
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    // Check if national ID is being changed and if new national ID already exists
    if (nationalId && nationalId !== client.nationalId) {
      const clientWithNationalIdExists = await Client.findOne({
        nationalId: nationalId,
        _id: { $ne: id }
      });

      if (clientWithNationalIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Client with this national ID already exists'
        });
      }

      // Validate national ID format
      if (nationalId.length < 5 || nationalId.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'National ID must be between 5 and 20 characters'
        });
      }
    }

    // Update fields
    if (firstName) client.firstName = firstName;
    if (middleName !== undefined) client.middleName = middleName;
    if (lastName) client.lastName = lastName;
    if (phoneNumber) client.phoneNumber = phoneNumber;
    if (nationalId) client.nationalId = nationalId;
    if (address) client.address = address;
    if (emergencyContact) client.emergencyContact = emergencyContact;

    // Eligibility and blacklisting
    if (isEligible !== undefined) {
      client.isEligible = isEligible;
      if (isEligible) {
        client.blacklistReason = '';
      } else if (blacklistReason) {
        client.blacklistReason = blacklistReason;
      }
    }

    if (blacklistReason !== undefined && !client.isEligible) {
      client.blacklistReason = blacklistReason;
    }

    const updatedClient = await client.save();
    const populatedClient = await Client.findById(updatedClient._id)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: populatedClient
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating client',
      error: error.message
    });
  }
};
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if client has active loans
    const Loan = await import('../models/Loan.js').then(mod => mod.default);
    const activeLoans = await Loan.countDocuments({
      client: id,
      status: { $in: ['active', 'at-risk', 'ahead', 'on-track', 'pending'] }
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client with active loans'
      });
    }

    await Client.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting client',
      error: error.message
    });
  }
};
export const toggleClientEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { blacklistReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    client.isEligible = !client.isEligible;

    if (!client.isEligible && blacklistReason) {
      client.blacklistReason = blacklistReason;
    } else if (client.isEligible) {
      client.blacklistReason = '';
    }

    const updatedClient = await client.save();
    const populatedClient = await Client.findById(updatedClient._id)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: `Client ${updatedClient.isEligible ? 'activated' : 'blacklisted'} successfully`,
      data: populatedClient
    });
  } catch (error) {
    console.error('Toggle client eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling client eligibility',
      error: error.message
    });
  }
};
export const updateCreditScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { creditScore, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    if (creditScore === undefined || creditScore < 0 || creditScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Credit score must be between 0 and 100'
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const previousScore = client.creditScore;
    client.creditScore = creditScore;

    const updatedClient = await client.save();
    const populatedClient = await Client.findById(updatedClient._id)
      .populate('createdBy', 'firstName lastName email');

    // Log credit score change (you might want to create a separate audit log)
    console.log(`Credit score updated for client ${id}: ${previousScore} -> ${creditScore}. Reason: ${reason || 'Manual adjustment'}`);

    res.json({
      success: true,
      message: `Credit score updated from ${previousScore} to ${creditScore}`,
      data: populatedClient
    });
  } catch (error) {
    console.error('Update credit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating credit score',
      error: error.message
    });
  }
};
export const getEligibleClientsForLoan = async (req, res) => {
  try {
    const { search, county, minCreditScore = 50 } = req.query;

    let query = {
      isEligible: true,
      creditScore: { $gte: parseInt(minCreditScore) }
    };

    // Search by name, phone, or national ID
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { middleName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by county
    if (county) {
      query['address.county'] = { $regex: county, $options: 'i' };
    }

    const clients = await Client.find(query)
      .select('firstName middleName lastName phoneNumber nationalId address creditScore currentActiveLoans totalLoansTaken totalLoansRepaid totalDefaults')
      .sort({ creditScore: -1, lastName: 1 })
      .limit(50) // Limit results for dropdown
      .lean();

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get eligible clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching eligible clients',
      error: error.message
    });
  }
};
export const getClientStats = async (req, res) => {
  try {
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);

    // Get total clients count
    const totalClients = await Client.countDocuments();
    const eligibleClients = await Client.countDocuments({ isEligible: true });
    const blacklistedClients = await Client.countDocuments({ isEligible: false });

    // Get clients by credit score ranges
    const creditScoreRanges = await Client.aggregate([
      {
        $group: {
          _id: null,
          excellent: {
            $sum: { $cond: [{ $gte: ['$creditScore', 80] }, 1, 0] }
          },
          good: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$creditScore', 60] },
                    { $lt: ['$creditScore', 80] }
                  ]
                }, 1, 0]
            }
          },
          fair: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$creditScore', 40] },
                    { $lt: ['$creditScore', 60] }
                  ]
                }, 1, 0]
            }
          },
          poor: {
            $sum: { $cond: [{ $lt: ['$creditScore', 40] }, 1, 0] }
          }
        }
      }
    ]);

    // Get clients by county
    const clientsByCounty = await Client.aggregate([
      {
        $group: {
          _id: '$address.county',
          count: { $sum: 1 },
          eligible: {
            $sum: { $cond: ['$isEligible', 1, 0] }
          },
          averageCreditScore: { $avg: '$creditScore' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get clients with loan statistics
    const clientsWithLoanStats = await Client.aggregate([
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'client',
          as: 'loans'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          nationalId: 1,
          creditScore: 1,
          isEligible: 1,
          totalLoans: { $size: '$loans' },
          activeLoans: {
            $size: {
              $filter: {
                input: '$loans',
                as: 'loan',
                cond: { $in: ['$$loan.status', ['active', 'at-risk', 'ahead', 'on-track']] }
              }
            }
          },
          completedLoans: {
            $size: {
              $filter: {
                input: '$loans',
                as: 'loan',
                cond: { $eq: ['$$loan.status', 'completed'] }
              }
            }
          },
          defaultedLoans: {
            $size: {
              $filter: {
                input: '$loans',
                as: 'loan',
                cond: { $eq: ['$$loan.status', 'defaulted'] }
              }
            }
          },
          totalBorrowed: { $sum: '$loans.loanAmount' },
          totalRepaid: { $sum: '$loans.amountPaid' }
        }
      },
      {
        $sort: { totalBorrowed: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const creditStats = creditScoreRanges[0] || {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalClients,
          eligibleClients,
          blacklistedClients,
          eligibilityRate: totalClients > 0 ? (eligibleClients / totalClients * 100).toFixed(2) : 0
        },
        creditScoreRanges: creditStats,
        byCounty: clientsByCounty,
        topClients: clientsWithLoanStats
      }
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client statistics',
      error: error.message
    });
  }
};

export const getClientLoanHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loans = await Loan.find({ client: id })
      .populate('item', 'name brand model')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('assignedEmployee', 'firstName lastName')
      .select('loanNumber loanType item loanAmount totalAmount amountPaid remainingBalance status startDate dueDate createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        client: {
          firstName: client.firstName,
          lastName: client.lastName,
          phoneNumber: client.phoneNumber,
          nationalId: client.nationalId,
          creditScore: client.creditScore,
          isEligible: client.isEligible
        },
        loans
      }
    });
  } catch (error) {
    console.error('Get client loan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client loan history',
      error: error.message
    });
  }
};
export const checkClientLoanEligibility = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID'
      });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const Loan = await import('../model/loan.model.js').then(mod => mod.default);

    // Check for active loans
    const activeLoans = await Loan.countDocuments({
      client: id,
      status: { $in: ['active', 'at-risk', 'ahead', 'on-track', 'pending'] }
    });

    // Check for recent defaults
    const recentDefaults = await Loan.countDocuments({
      client: id,
      status: 'defaulted',
      dueDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    });

    const canTakeLoan = client.isEligible &&
      activeLoans === 0 &&
      recentDefaults === 0 &&
      client.creditScore >= 50;

    const reasons = [];
    if (!client.isEligible) reasons.push('Client is blacklisted');
    if (activeLoans > 0) reasons.push('Client has active loans');
    if (recentDefaults > 0) reasons.push('Client has recent defaults');
    if (client.creditScore < 50) reasons.push('Credit score is too low');

    res.json({
      success: true,
      data: {
        canTakeLoan,
        reasons: canTakeLoan ? [] : reasons,
        details: {
          isEligible: client.isEligible,
          activeLoans,
          recentDefaults,
          creditScore: client.creditScore,
          minRequiredScore: 50
        }
      }
    });
  } catch (error) {
    console.error('Check client loan eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking loan eligibility',
      error: error.message
    });
  }
};
export const searchClient = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const client = await Client.findOne({
      $or: [
        { phoneNumber: term },
        { nationalId: term }
      ]
    })
      .select('-createdBy -updatedAt -__v')
      .populate('address')
      .populate('emergencyContact');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Search client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching client',
      error: error.message
    });
  }
};
