import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleware.js';
import { getAllTransactions } from '../controller/transaction.controller.js';

const router = express.Router();

router.get('/', protectRoute,adminRoute, getAllTransactions);

export default router;