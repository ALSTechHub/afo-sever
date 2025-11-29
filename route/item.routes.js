import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { addStock, adjustStock, createItem, deleteItem, getAvailableItemsForLoan, getItem, getItems, getItemStats, getStockHistory, toggleItemStatus, updateItem } from '../controller/item.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.post('/', adminRoute, createItem);
router.put('/:id', adminRoute, updateItem);
router.delete('/:id', adminRoute, deleteItem);
router.patch('/:id/toggle-status', adminRoute, toggleItemStatus);
router.patch('/:id/add-stock', adminRoute, addStock);
router.patch('/:id/adjust-stock', adminRoute, adjustStock);
router.get('/stats/overview', adminRoute, getItemStats);
router.get('/:id/stock-history', adminRoute, getStockHistory);

// Employee and Admin routes
router.get('/', getItems);
router.get('/available/loan', getAvailableItemsForLoan);
router.get('/:id', getItem);

export default router;