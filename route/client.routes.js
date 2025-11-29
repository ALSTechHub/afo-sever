import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { checkClientLoanEligibility, createClient, deleteClient, getClient, getClientLoanHistory, getClients, getClientStats, getEligibleClientsForLoan, searchClient, toggleClientEligibility, updateClient, updateCreditScore } from '../controller/client.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.delete('/:id', adminRoute, deleteClient);
router.patch('/:id/toggle-eligibility', adminRoute, toggleClientEligibility);
router.patch('/:id/credit-score', adminRoute, updateCreditScore);
router.get('/stats/overview', adminRoute, getClientStats);
router.get('/search', searchClient);
// Employee and Admin routes
router.post('/', createClient);
router.get('/', getClients);
router.get('/eligible/loan', getEligibleClientsForLoan);
router.get('/:id', getClient);
router.get('/:id/loan-history', getClientLoanHistory);
router.get('/:id/can-take-loan', checkClientLoanEligibility);
router.put('/:id', updateClient);

export default router;