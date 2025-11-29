import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';

let io;
const connectedUsers = new Map(); 

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('No token provided for socket connection');
      return next(new Error('Authentication error: No token provided'));
    }

    const actualToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('User not found for socket connection');
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic
    };
    
    console.log(`✅ Socket authenticated for user: ${user._id}`);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5174","http://10.66.50.163:8081","exp://10.66.50.163:8081"],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'] 
  });
  
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);
    console.log('👤 Authenticated user ID:', socket.userId);

    // Add user to connected users
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userData: socket.userData,
      connectedAt: new Date()
    });

    // Join user to their personal room for notifications
    const userRoom = `user-${socket.userId}`;
    socket.join(userRoom);
    console.log(`📧 User joined notification room: ${userRoom}`);

    // Handle notification events
    socket.on('mark-notifications-read', async (data) => {
      try {
        // This will be handled by the notification controller
        socket.emit('notifications-marked-read', { success: true });
      } catch (error) {
        socket.emit('notifications-marked-read', { success: false, error: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('🔴 Client disconnected:', socket.id, 'Reason:', reason);
      
      // Remove user from connected users
      if (connectedUsers.has(socket.userId)) {
        connectedUsers.delete(socket.userId);
      }
    });

    // Handle ping to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const sendNotificationToUser = (userId, notificationData) => {
  const io = getIO();
  const userRoom = `user-${userId}`;
  
  io.to(userRoom).emit('new-notification', notificationData);
  console.log(`📨 Notification sent to user ${userId}:`, notificationData.title);
};

export const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};