import express from 'express';
import { getBorrowerLeaderboard, getDashboardStats } from '../controller/dashboard.controller.js';
import { adminRoute, protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protectRoute, adminRoute,getDashboardStats);
router.get('/leaderboard', protectRoute, adminRoute,getBorrowerLeaderboard);

export default router;