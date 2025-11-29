import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { createPayment, getPayment, getPayments, getPaymentsByEmployee, getPaymentsByLoan, getPaymentStats, reversePayment } from '../controller/payment.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.patch('/:id/reverse', adminRoute, reversePayment);
router.get('/stats/overview', adminRoute, getPaymentStats);

// Employee and Admin routes
router.post('/', createPayment);
router.get('/', getPayments);
router.get('/employee/:employeeId', getPaymentsByEmployee);
router.get('/loan/:loanId', getPaymentsByLoan);
router.get('/:id', getPayment);

export default router;