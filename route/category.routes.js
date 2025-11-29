import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { createCategory, deleteCategory, getActiveCategories, getCategories, getCategory, getCategoryStats, toggleCategoryStatus, updateCategory } from '../controller/category.controller.js';


const router = express.Router();

// Public routes (none)

// Protected routes
router.use(protectRoute);

// Admin only routes
router.post('/', adminRoute, createCategory);
router.get('/stats/overview', adminRoute, getCategoryStats);
router.put('/:id', adminRoute, updateCategory);
router.delete('/:id', adminRoute, deleteCategory);
router.patch('/:id/toggle-status', adminRoute, toggleCategoryStatus);

// Employee and Admin routes
router.get('/', getCategories);
router.get('/active/list', getActiveCategories);
router.get('/:id', getCategory);

export default router;