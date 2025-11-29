import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import cron from 'node-cron'; 
import userRoutes from './route/user.routes.js';
import authRoutes from './route/auth.routes.js';
import connectDB from './lib/database.js';
import { initSocket } from './lib/socket.js';
import categoriesRoutes from './route/category.routes.js'
import interestsRoutes from './route/interest.routes.js'
import itemsRoutes from './route/item.routes.js'
import loansRoutes from './route/loan.routes.js'
import clientsRoutes from './route/client.routes.js'
import paymentRoutes from './route/payment.routes.js'
import taskRoutes from './route/task.routes.js'
import fundRoutes from './route/companyFunds.routes.js'
import savingRoutes from './route/savings.routes.js'
import dashboardRoutes from './route/dashboard.route.js'
import transactionRoutes from './route/transaction.routes.js'
import employeeRoutes from './route/employee.routes.js'
import notificationRoutes from './route/notification.routes.js'
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();
await connectDB();

app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5174",
    "http://192.168.0.104:5174",
    "exp://10.66.50.163:8081",   
    "http://10.66.50.163:8081",  
    "*" 
  ],
  credentials: true
}));

app.use(cookieParser())

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/interests', interestsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/savings', savingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/employee-dashboard', employeeRoutes);
app.use('/api/notifications', notificationRoutes);
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

initSocket(server);