import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { calculateInterests, createSavingsAccount, getClientSavingsAccount, getSavingsAccount, getSavingsAccounts, getSavingsStats, getSavingsTransactions, makeDeposit, makeWithdrawal, updateSavingsAccount, useSavingsForLoanRepayment } from '../controller/savings.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.put('/:id', adminRoute, updateSavingsAccount);
router.post('/:id/calculate-interest', adminRoute, calculateInterests);
router.get('/stats/overview', adminRoute, getSavingsStats);

// Employee and Admin routes
router.post('/', createSavingsAccount);
router.get('/', getSavingsAccounts);
router.get('/client/:clientId', getClientSavingsAccount);
router.get('/:id', getSavingsAccount);
router.get('/:id/transactions', getSavingsTransactions);
router.post('/:id/deposit', makeDeposit);
router.post('/:id/withdraw', makeWithdrawal);
router.post('/:id/loan-repayment', useSavingsForLoanRepayment);

export default router;