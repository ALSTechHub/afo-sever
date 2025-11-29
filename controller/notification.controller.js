import { sendNotificationToUser } from "../lib/socket.js";
import Notification from "../model/notification.model.js";

// Create notification and send via socket
export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    
    // Populate sender info for the frontend
    await notification.populate('sender', 'firstName lastName profilePic role');
    
    // Send real-time notification if user is connected
    sendNotificationToUser(data.recipient, {
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      priority: notification.priority,
      sender: notification.sender,
      relatedEntity: notification.relatedEntity,
      createdAt: notification.createdAt,
      imageUrl: notification.imageUrl
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id; 
    
    console.log('🔍 Fetching notifications for user:', {
      userId: userId,
      userEmail: req.user.email,
      userName: `${req.user.firstName} ${req.user.lastName}`
    });
    
    const { page = 1, limit = 20 } = req.query;
    
    // Check total notifications in database
    const totalNotifications = await Notification.countDocuments({});
    console.log('📊 Total notifications in database:', totalNotifications);
    
    // Check notifications for this specific user
    const userNotificationsCount = await Notification.countDocuments({ recipient: userId });
    console.log('👤 Notifications for current user:', userNotificationsCount);
    
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'firstName lastName profilePic role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    console.log('📋 Notifications found for user:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('📝 First notification sample:', {
        id: notifications[0]._id,
        title: notifications[0].title,
        recipient: notifications[0].recipient,
        sender: notifications[0].sender,
        type: notifications[0].type
      });
    } else {
      console.log('❌ No notifications found for user:', userId);
      
      // Debug: Check what notifications exist in database
      const allNotifications = await Notification.find({}).limit(5);
      console.log('🔍 Sample of all notifications in DB:');
      allNotifications.forEach(notif => {
        console.log(`  - ID: ${notif._id}, Recipient: ${notif.recipient}, Title: ${notif.title}`);
      });
    }
    
    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};
// Mark notifications as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationIds } = req.body;
    
    let updateQuery = { recipient: userId };
    if (notificationIds && notificationIds.length > 0) {
      updateQuery._id = { $in: notificationIds };
    }
    
    await Notification.updateMany(
      updateQuery,
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        }
      }
    );
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.json({ 
      success: true, 
      unreadCount 
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};