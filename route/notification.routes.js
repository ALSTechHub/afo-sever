import express from 'express';
import { protectRoute } from '../middleware/authMiddleWare.js';
import { deleteNotification, getUnreadCount, getUserNotifications, markAsRead } from '../controller/notification.controller.js';
const router = express.Router();

router.use(protectRoute);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/mark-read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;