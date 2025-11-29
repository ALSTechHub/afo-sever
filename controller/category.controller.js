import mongoose from 'mongoose';
import Category from '../model/category.model.js';
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if category already exists
    const categoryExists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create({
      name,
      description,
      createdBy: req.user._id
    });

    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating category',
      error: error.message
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

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

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get categories with pagination
    const categories = await Category.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Category.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories',
      error: error.message
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category',
      error: error.message
    });
  }
};
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== category.name) {
      const categoryExists = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    const updatedCategory = await category.save();
    const populatedCategory = await Category.findById(updatedCategory._id)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: populatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating category',
      error: error.message
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category is being used by any items
    const Item = await import('../models/Item.js').then(mod => mod.default);
    const itemsUsingCategory = await Item.countDocuments({ category: id });

    if (itemsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. It is being used by items.'
      });
    }
    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category',
      error: error.message
    });
  }
};

export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = !category.isActive;
    const updatedCategory = await category.save();
    const populatedCategory = await Category.findById(updatedCategory._id)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`,
      data: populatedCategory
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling category status',
      error: error.message
    });
  }
};
export const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get active categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active categories',
      error: error.message
    });
  }
};
export const getCategoryStats = async (req, res) => {
  try {
    const Item = await import('../models/Item.js').then(mod => mod.default);
    const Loan = await import('../models/Loan.js').then(mod => mod.default);

    // Get total categories count
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const inactiveCategories = await Category.countDocuments({ isActive: false });

    // Get categories with item counts
    const categoriesWithStats = await Category.aggregate([
      {
        $lookup: {
          from: 'items',
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'item.category',
          as: 'loans'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
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
          totalCategories,
          activeCategories,
          inactiveCategories
        },
        categories: categoriesWithStats
      }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category statistics',
      error: error.message
    });
  }
};