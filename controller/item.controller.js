import mongoose from 'mongoose';
import Item from '../model/item.model.js';

export const createItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      brand,
      model,
      specifications,
      actualPrice,
      currentStock,
      minimumStock,
      depositPercentage,
      interestPlan
    } = req.body;

    // Check if item with same name already exists
    const itemExists = await Item.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (itemExists) {
      return res.status(400).json({
        success: false,
        message: 'Item with this name already exists'
      });
    }

    // Validate category exists
    const Category = await import('../model/category.model.js').then(mod => mod.default);
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Validate interest plan exists and is active
    const Interest = await import('../model/interest.model.js').then(mod => mod.default);
    const interestPlanExists = await Interest.findById(interestPlan);
    if (!interestPlanExists) {
      return res.status(400).json({
        success: false,
        message: 'Interest plan not found'
      });
    }
    if (!interestPlanExists.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Interest plan is not active'
      });
    }

    // Create item
    const item = await Item.create({
      name,
      description,
      category,
      brand,
      model,
      specifications: specifications || {},
      actualPrice,
      currentStock: currentStock || 0,
      minimumStock: minimumStock || 0,
      depositPercentage,
      interestPlan,
      createdBy: req.user._id
    });

    // Add initial stock to history if stock is provided
    if (currentStock > 0) {
      item.stockHistory.push({
        previousStock: 0,
        newStock: currentStock,
        quantityAdded: currentStock,
        addedBy: req.user._id,
        reason: 'Initial stock',
        costPrice: actualPrice
      });
      await item.save();
    }

    const populatedItem = await Item.findById(item._id)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('createdBy', 'firstName lastName email')
      .populate('stockHistory.addedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: populatedItem
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating item',
      error: error.message
    });
  }
};
export const getItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isActive, 
      category,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};

    // Search by name, brand, or model
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    // Filter low stock items
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get items with pagination
    const items = await Item.find(query)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency penaltyRate')
      .populate('createdBy', 'firstName lastName email')
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Item.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching items',
      error: error.message
    });
  }
};
export const getItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    const item = await Item.findById(id)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency penaltyRate description')
      .populate('createdBy', 'firstName lastName email')
      .populate('stockHistory.addedBy', 'firstName lastName email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item',
      error: error.message
    });
  }
};
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      brand,
      model,
      specifications,
      actualPrice,
      minimumStock,
      depositPercentage,
      interestPlan,
      isActive
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== item.name) {
      const itemExists = await Item.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (itemExists) {
        return res.status(400).json({
          success: false,
          message: 'Item with this name already exists'
        });
      }
    }

    // Validate category if being changed
    if (category && category !== item.category.toString()) {
      const Category = await import('../models/Category.js').then(mod => mod.default);
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Validate interest plan if being changed
    if (interestPlan && interestPlan !== item.interestPlan.toString()) {
      const Interest = await import('../models/Interest.js').then(mod => mod.default);
      const interestPlanExists = await Interest.findById(interestPlan);
      if (!interestPlanExists) {
        return res.status(400).json({
          success: false,
          message: 'Interest plan not found'
        });
      }
      if (!interestPlanExists.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Interest plan is not active'
        });
      }
    }

    // Update fields
    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (category) item.category = category;
    if (brand !== undefined) item.brand = brand;
    if (model !== undefined) item.model = model;
    if (specifications !== undefined) item.specifications = specifications;
    if (actualPrice !== undefined) item.actualPrice = actualPrice;
    if (minimumStock !== undefined) item.minimumStock = minimumStock;
    if (depositPercentage !== undefined) item.depositPercentage = depositPercentage;
    if (interestPlan) item.interestPlan = interestPlan;
    if (isActive !== undefined) item.isActive = isActive;

    const updatedItem = await item.save();
    const populatedItem = await Item.findById(updatedItem._id)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('createdBy', 'firstName lastName email')
      .populate('stockHistory.addedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: populatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating item',
      error: error.message
    });
  }
};
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item has current stock
    if (item.currentStock > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with existing stock. Please clear stock first.'
      });
    }

    // Check if item is being used by any active loans
    const Loan = await import('../models/Loan.js').then(mod => mod.default);
    const activeLoans = await Loan.countDocuments({ 
      item: id,
      status: { $in: ['active', 'at-risk', 'ahead', 'on-track', 'pending'] }
    });

    if (activeLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item. It is being used by active loans.'
      });
    }

    await Item.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting item',
      error: error.message
    });
  }
};
export const addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, costPrice, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    if (!costPrice || costPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a positive number'
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const previousStock = item.currentStock;
    const newStock = previousStock + quantity;

    // Add to stock history
    item.stockHistory.push({
      previousStock,
      newStock,
      quantityAdded: quantity,
      addedBy: req.user._id,
      reason: reason || 'Stock replenishment',
      costPrice
    });

    // Update current stock
    item.currentStock = newStock;

    const updatedItem = await item.save();
    const populatedItem = await Item.findById(updatedItem._id)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('createdBy', 'firstName lastName email')
      .populate('stockHistory.addedBy', 'firstName lastName');

    res.json({
      success: true,
      message: `Stock added successfully. New stock: ${newStock}`,
      data: populatedItem
    });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding stock',
      error: error.message
    });
  }
};
export const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStock, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    if (newStock === undefined || newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'New stock must be a non-negative number'
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    const previousStock = item.currentStock;
    const quantityChanged = newStock - previousStock;

    // Add to stock history
    item.stockHistory.push({
      previousStock,
      newStock,
      quantityAdded: quantityChanged,
      addedBy: req.user._id,
      reason: reason || 'Stock adjustment',
      costPrice: item.actualPrice // Use actual price as default for adjustments
    });

    // Update current stock
    item.currentStock = newStock;

    const updatedItem = await item.save();
    const populatedItem = await Item.findById(updatedItem._id)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('createdBy', 'firstName lastName email')
      .populate('stockHistory.addedBy', 'firstName lastName');

    res.json({
      success: true,
      message: `Stock adjusted from ${previousStock} to ${newStock}`,
      data: populatedItem
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adjusting stock',
      error: error.message
    });
  }
};
export const toggleItemStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    item.isActive = !item.isActive;
    const updatedItem = await item.save();
    const populatedItem = await Item.findById(updatedItem._id)
      .populate('category', 'name description')
      .populate('interestPlan', 'name interestRate paymentFrequency')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: `Item ${updatedItem.isActive ? 'activated' : 'deactivated'} successfully`,
      data: populatedItem
    });
  } catch (error) {
    console.error('Toggle item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling item status',
      error: error.message
    });
  }
};
export const getAvailableItemsForLoan = async (req, res) => {
  try {
    const { category } = req.query;

    let query = { 
      isActive: true,
      currentStock: { $gt: 0 }
    };

    // Filter by category
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    const items = await Item.find(query)
      .populate('category', 'name')
      .populate('interestPlan', 'name interestRate paymentFrequency penaltyRate')
      .select('name brand model actualPrice currentStock depositPercentage interestPlan')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get available items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available items',
      error: error.message
    });
  }
};
export const getItemStats = async (req, res) => {
  try {
    const Loan = await import('../models/Loan.js').then(mod => mod.default);

    // Get total items count
    const totalItems = await Item.countDocuments();
    const activeItems = await Item.countDocuments({ isActive: true });
    const inactiveItems = await Item.countDocuments({ isActive: false });

    // Get low stock items
    const lowStockItems = await Item.countDocuments({
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
      isActive: true
    });

    // Get out of stock items
    const outOfStockItems = await Item.countDocuments({
      currentStock: 0,
      isActive: true
    });

    // Get total stock value
    const stockValueResult = await Item.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalStockValue: { $sum: { $multiply: ['$currentStock', '$actualPrice'] } },
          totalItemsCount: { $sum: 1 },
          totalStockQuantity: { $sum: '$currentStock' }
        }
      }
    ]);

    const stockValue = stockValueResult[0] || {
      totalStockValue: 0,
      totalItemsCount: 0,
      totalStockQuantity: 0
    };

    // Get items by category with stats
    const itemsByCategory = await Item.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'item',
          as: 'loans'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$category',
          categoryName: { $first: '$categoryInfo.name' },
          totalItems: { $sum: 1 },
          activeItems: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalStock: { $sum: '$currentStock' },
          stockValue: { $sum: { $multiply: ['$currentStock', '$actualPrice'] } },
          totalLoans: { $sum: { $size: '$loans' } },
          activeLoans: {
            $sum: {
              $size: {
                $filter: {
                  input: '$loans',
                  as: 'loan',
                  cond: { $in: ['$$loan.status', ['active', 'at-risk', 'ahead', 'on-track']] }
                }
              }
            }
          }
        }
      },
      {
        $sort: { stockValue: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalItems,
          activeItems,
          inactiveItems,
          lowStockItems,
          outOfStockItems,
          totalStockValue: stockValue.totalStockValue,
          totalStockQuantity: stockValue.totalStockQuantity
        },
        byCategory: itemsByCategory
      }
    });
  } catch (error) {
    console.error('Get item stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching item statistics',
      error: error.message
    });
  }
};
export const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    const item = await Item.findById(id)
      .populate('stockHistory.addedBy', 'firstName lastName email')
      .select('stockHistory name')
      .lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Paginate stock history
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const stockHistory = item.stockHistory
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limitNum);

    const total = item.stockHistory.length;
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        itemName: item.name,
        stockHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stock history',
      error: error.message
    });
  }
};