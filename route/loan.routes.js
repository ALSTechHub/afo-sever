import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { createLoan, getClientActiveLoans, getClientsActiveLoans, getLoan, getLoans, getLoansByEmployee, getLoanStats, getOverdueLoans, payDeposit, recordDisbursement, updateLoanStatus } from '../controller/loan.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.patch('/:id/status', adminRoute, updateLoanStatus);
router.patch('/:id/disburse', adminRoute, recordDisbursement);
router.get('/stats/overview', adminRoute, getLoanStats);

// Employee and Admin routes
router.post('/', createLoan);
router.get('/', getLoans);
router.get('/overdue', getOverdueLoans);
router.get('/employee/:employeeId', getLoansByEmployee);
router.get('/client/:clientId/active', getClientActiveLoans);
router.get('/client/:clientId/active/repay', getClientsActiveLoans);
router.get('/:id', getLoan);
router.patch('/:id/pay-deposit', payDeposit);

export default router;