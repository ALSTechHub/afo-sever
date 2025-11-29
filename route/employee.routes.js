import express from 'express';
import { getEmployeeDashboard, getEmployeePerformance } from '../controller/employee.controller.js';
import { protectRoute } from '../middleware/authMiddleWare.js';

const router = express.Router();

router.get('/dashboard', protectRoute, getEmployeeDashboard);
router.get('/performance', protectRoute, getEmployeePerformance);
export default router;