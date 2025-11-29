import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { createTask, deleteTask, getOverdueTasks, getTask, getTasks, getTasksByEmployee, getTasksByEmployees, getTasksByLoan, getTaskStats, updateTask, updateTaskStatus } from '../controller/task.controller.js';

const router = express.Router();

// Protected routes
router.use(protectRoute);

// Admin only routes
router.delete('/:id', adminRoute, deleteTask);

// Employee and Admin routes
router.post('/', createTask);
router.get('/', getTasks);
router.get('/stats/overview', getTaskStats);
router.get('/overdue', getOverdueTasks);
router.get('/employee/:employeeId', getTasksByEmployee);
router.get('/employee/:employeeId/all', getTasksByEmployees);
router.get('/loan/:loanId', getTasksByLoan);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);

export default router;