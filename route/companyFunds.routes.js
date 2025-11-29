import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { getCompanyFundsBalance, getCompanyFundsOverview, getCompanyFundsStats, getCompanyFundsTransactions, initializeCompanyFunds, recordExpense, recordLoanDisbursement, recordLoanRepayment, recordProfit, replenishCompanyFunds } from '../controller/companyFund.controller.js';

const router = express.Router();

// Protected routes (Admin only)
router.use(protectRoute);
router.use(adminRoute);

// Company funds management routes
router.get('/', getCompanyFundsOverview);
router.get('/balance', getCompanyFundsBalance);
router.get('/transactions', getCompanyFundsTransactions);
router.get('/stats/overview', getCompanyFundsStats);
router.post('/initialize', initializeCompanyFunds);
router.post('/replenish', replenishCompanyFunds);
router.post('/loan-disbursement', recordLoanDisbursement);
router.post('/loan-repayment', recordLoanRepayment);
router.post('/expense', recordExpense);
router.post('/profit', recordProfit);

export default router;