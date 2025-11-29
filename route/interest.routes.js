import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { calculateLoanDetails, createInterest, deleteInterest, getActiveInterests, getInterest, getInterests, getInterestStats, toggleInterestStatus, updateInterest } from '../controller/interest.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.post('/', adminRoute, createInterest);
router.put('/:id', adminRoute, updateInterest);
router.delete('/:id', adminRoute, deleteInterest);
router.patch('/:id/toggle-status', adminRoute, toggleInterestStatus);
router.get('/stats/overview', adminRoute, getInterestStats);

// Employee and Admin routes
router.get('/', getInterests);
router.get('/active/list', getActiveInterests);
router.get('/:id', getInterest);
router.post('/calculate', calculateLoanDetails);

export default router;