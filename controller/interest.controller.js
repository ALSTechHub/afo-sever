import mongoose from 'mongoose';
import Interest from '../model/interest.model.js';
export const createInterest = async (req, res) => {
  try {
    const {
      name,
      category,
      itemType,
      paymentFrequency,
      interestRate,
      minimumAmount,
      maximumAmount,
      minimumDuration,
      maximumDuration,
      durationUnit,
      penaltyRate,
      description
    } = req.body;

    // Check if interest plan with same name and payment frequency already exists
    const interestExists = await Interest.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      paymentFrequency
    });

    if (interestExists) {
      return res.status(400).json({
        success: false,
        message: 'Interest plan with this name and payment frequency already exists'
      });
    }

    // Validate amount range
    if (minimumAmount && maximumAmount && minimumAmount > maximumAmount) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount cannot be greater than maximum amount'
      });
    }

    // Validate duration range
    if (minimumDuration && maximumDuration && minimumDuration > maximumDuration) {
      return res.status(400).json({
        success: false,
        message: 'Minimum duration cannot be greater than maximum duration'
      });
    }

    const interest = await Interest.create({
      name,
      category: category || null,
      itemType,
      paymentFrequency,
      interestRate,
      minimumAmount: minimumAmount || 0,
      maximumAmount: maximumAmount || null,
      minimumDuration: minimumDuration || 1,
      maximumDuration: maximumDuration || null,
      durationUnit: durationUnit || 'days',
      penaltyRate: penaltyRate || 0,
      description,
      createdBy: req.user._id
    });

    const populatedInterest = await Interest.findById(interest._id)
      .populate('category', 'name description')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Interest plan created successfully',
      data: populatedInterest
    });
  } catch (error) {
    console.error('Create interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating interest plan',
      error: error.message
    });
  }
};

export const getInterests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isActive, 
      itemType, 
      paymentFrequency,
      category 
    } = req.query;

    // Build query
    let query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by item type
    if (itemType) {
      query.itemType = itemType;
    }

    // Filter by payment frequency
    if (paymentFrequency) {
      query.paymentFrequency = paymentFrequency;
    }

    // Filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get interests with pagination
    const interests = await Interest.find(query)
      .populate('category', 'name description')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Interest.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: interests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interest plans',
      error: error.message
    });
  }
};
export const getInterest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interest plan ID'
      });
    }

    const interest = await Interest.findById(id)
      .populate('category', 'name description')
      .populate('createdBy', 'firstName lastName email');

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest plan not found'
      });
    }

    res.json({
      success: true,
      data: interest
    });
  } catch (error) {
    console.error('Get interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interest plan',
      error: error.message
    });
  }
};

export const updateInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      itemType,
      paymentFrequency,
      interestRate,
      minimumAmount,
      maximumAmount,
      minimumDuration,
      maximumDuration,
      durationUnit,
      penaltyRate,
      description,
      isActive
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interest plan ID'
      });
    }

    const interest = await Interest.findById(id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest plan not found'
      });
    }

    // Check if name and payment frequency combination already exists (if being changed)
    if ((name && name !== interest.name) || (paymentFrequency && paymentFrequency !== interest.paymentFrequency)) {
      const interestExists = await Interest.findOne({
        name: { $regex: new RegExp(`^${name || interest.name}$`, 'i') },
        paymentFrequency: paymentFrequency || interest.paymentFrequency,
        _id: { $ne: id }
      });

      if (interestExists) {
        return res.status(400).json({
          success: false,
          message: 'Interest plan with this name and payment frequency already exists'
        });
      }
    }

    // Validate amount range
    if (minimumAmount !== undefined && maximumAmount !== undefined && minimumAmount > maximumAmount) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount cannot be greater than maximum amount'
      });
    }

    // Validate duration range
    if (minimumDuration !== undefined && maximumDuration !== undefined && minimumDuration > maximumDuration) {
      return res.status(400).json({
        success: false,
        message: 'Minimum duration cannot be greater than maximum duration'
      });
    }

    // Update fields
    if (name) interest.name = name;
    if (category !== undefined) interest.category = category;
    if (itemType) interest.itemType = itemType;
    if (paymentFrequency) interest.paymentFrequency = paymentFrequency;
    if (interestRate !== undefined) interest.interestRate = interestRate;
    if (minimumAmount !== undefined) interest.minimumAmount = minimumAmount;
    if (maximumAmount !== undefined) interest.maximumAmount = maximumAmount;
    if (minimumDuration !== undefined) interest.minimumDuration = minimumDuration;
    if (maximumDuration !== undefined) interest.maximumDuration = maximumDuration;
    if (durationUnit) interest.durationUnit = durationUnit;
    if (penaltyRate !== undefined) interest.penaltyRate = penaltyRate;
    if (description !== undefined) interest.description = description;
    if (isActive !== undefined) interest.isActive = isActive;

    const updatedInterest = await interest.save();
    const populatedInterest = await Interest.findById(updatedInterest._id)
      .populate('category', 'name description')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Interest plan updated successfully',
      data: populatedInterest
    });
  } catch (error) {
    console.error('Update interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating interest plan',
      error: error.message
    });
  }
};
export const deleteInterest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interest plan ID'
      });
    }

    const interest = await Interest.findById(id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest plan not found'
      });
    }

    // Check if interest plan is being used by any items
    const Item = await import('../models/Item.js').then(mod => mod.default);
    const itemsUsingInterest = await Item.countDocuments({ interestPlan: id });

    if (itemsUsingInterest > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete interest plan. It is being used by items.'
      });
    }

    await Interest.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Interest plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting interest plan',
      error: error.message
    });
  }
};
export const toggleInterestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interest plan ID'
      });
    }

    const interest = await Interest.findById(id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest plan not found'
      });
    }

    interest.isActive = !interest.isActive;
    const updatedInterest = await interest.save();
    const populatedInterest = await Interest.findById(updatedInterest._id)
      .populate('category', 'name description')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: `Interest plan ${updatedInterest.isActive ? 'activated' : 'deactivated'} successfully`,
      data: populatedInterest
    });
  } catch (error) {
    console.error('Toggle interest status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling interest plan status',
      error: error.message
    });
  }
};
export const getActiveInterests = async (req, res) => {
  try {
    const { itemType, paymentFrequency, category } = req.query;

    let query = { isActive: true };

    // Filter by item type
    if (itemType) {
      query.itemType = itemType;
    }

    // Filter by payment frequency
    if (paymentFrequency) {
      query.paymentFrequency = paymentFrequency;
    }

    // Filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    const interests = await Interest.find(query)
      .populate('category', 'name')
      .select('name itemType paymentFrequency interestRate penaltyRate description')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: interests
    });
  } catch (error) {
    console.error('Get active interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active interest plans',
      error: error.message
    });
  }
};
export const calculateLoanDetails = async (req, res) => {
  try {
    const { interestPlanId, principalAmount, duration } = req.body;

    if (!mongoose.Types.ObjectId.isValid(interestPlanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interest plan ID'
      });
    }

    const interestPlan = await Interest.findById(interestPlanId);

    if (!interestPlan) {
      return res.status(404).json({
        success: false,
        message: 'Interest plan not found'
      });
    }

    if (!interestPlan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Interest plan is not active'
      });
    }

    // Validate amount against interest plan limits
    if (interestPlan.minimumAmount && principalAmount < interestPlan.minimumAmount) {
      return res.status(400).json({
        success: false,
        message: `Principal amount is below minimum allowed amount of ${interestPlan.minimumAmount}`
      });
    }

    if (interestPlan.maximumAmount && principalAmount > interestPlan.maximumAmount) {
      return res.status(400).json({
        success: false,
        message: `Principal amount exceeds maximum allowed amount of ${interestPlan.maximumAmount}`
      });
    }

    // Validate duration against interest plan limits
    if (interestPlan.minimumDuration && duration < interestPlan.minimumDuration) {
      return res.status(400).json({
        success: false,
        message: `Duration is below minimum allowed duration of ${interestPlan.minimumDuration} ${interestPlan.durationUnit}`
      });
    }

    if (interestPlan.maximumDuration && duration > interestPlan.maximumDuration) {
      return res.status(400).json({
        success: false,
        message: `Duration exceeds maximum allowed duration of ${interestPlan.maximumDuration} ${interestPlan.durationUnit}`
      });
    }

    // Calculate interest and total amount
    const interestAmount = (principalAmount * interestPlan.interestRate) / 100;
    const totalAmount = principalAmount + interestAmount;

    // Calculate installment amount based on payment frequency
    let installmentAmount = 0;
    switch (interestPlan.paymentFrequency) {
      case 'daily':
        installmentAmount = totalAmount / duration;
        break;
      case 'weekly':
        installmentAmount = totalAmount / Math.ceil(duration / 7);
        break;
      case 'monthly':
        installmentAmount = totalAmount / Math.ceil(duration / 30);
        break;
      case 'one-time':
        installmentAmount = totalAmount;
        break;
    }

    res.json({
      success: true,
      data: {
        principalAmount,
        interestRate: interestPlan.interestRate,
        interestAmount,
        totalAmount,
        installmentAmount: Math.ceil(installmentAmount),
        paymentFrequency: interestPlan.paymentFrequency,
        duration,
        durationUnit: interestPlan.durationUnit,
        penaltyRate: interestPlan.penaltyRate
      }
    });
  } catch (error) {
    console.error('Calculate loan details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating loan details',
      error: error.message
    });
  }
};
export const getInterestStats = async (req, res) => {
  try {
    const Item = await import('../models/Item.js').then(mod => mod.default);
    const Loan = await import('../models/Loan.js').then(mod => mod.default);

    // Get total interests count
    const totalInterests = await Interest.countDocuments();
    const activeInterests = await Interest.countDocuments({ isActive: true });
    const inactiveInterests = await Interest.countDocuments({ isActive: false });

    // Get counts by item type
    const moneyInterests = await Interest.countDocuments({ itemType: 'money' });
    const itemInterests = await Interest.countDocuments({ itemType: 'item' });

    // Get counts by payment frequency
    const paymentFrequencyStats = await Interest.aggregate([
      {
        $group: {
          _id: '$paymentFrequency',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Get interests with usage counts
    const interestsWithStats = await Interest.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'interestPlan',
          as: 'items'
        }
      },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'interestPlan',
          as: 'loans'
        }
      },
      {
        $project: {
          name: 1,
          itemType: 1,
          paymentFrequency: 1,
          interestRate: 1,
          isActive: 1,
          createdAt: 1,
          totalItems: { $size: '$items' },
          totalLoans: { $size: '$loans' },
          activeLoans: {
            $size: {
              $filter: {
                input: '$loans',
                as: 'loan',
                cond: { $in: ['$$loan.status', ['active', 'at-risk', 'ahead', 'on-track']] }
              }
            }
          }
        }
      },
      {
        $sort: { totalLoans: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalInterests,
          activeInterests,
          inactiveInterests,
          moneyInterests,
          itemInterests
        },
        paymentFrequency: paymentFrequencyStats,
        interests: interestsWithStats
      }
    });
  } catch (error) {
    console.error('Get interest stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interest statistics',
      error: error.message
    });
  }
};