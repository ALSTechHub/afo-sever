import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { getAllTransactions } from '../controller/transaction.controller.js';

const router = express.Router();

router.get('/', protectRoute,adminRoute, getAllTransactions);


export default router;
