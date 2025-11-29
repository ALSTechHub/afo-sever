import express from 'express';
import { adminRoute, protectRoute } from '../middleware/authMiddleWare.js';
import { bulkDeleteEmployees, createEmployee, deleteEmployee, getEmployeeById, getEmployees, getEmployeeStats, toggleEmployeeActiveStatus, updateEmployee } from '../controller/user.controller.js';
const router = express.Router();
router.use(protectRoute);
router.use(adminRoute);
router
  .route('/')
  .post(createEmployee)
  .get(getEmployees);

router.post('/bulk-delete', bulkDeleteEmployees);
router.get('/stats', getEmployeeStats);
router.patch('/:id/toggle-active', toggleEmployeeActiveStatus);
router
  .route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(deleteEmployee);

export default router;