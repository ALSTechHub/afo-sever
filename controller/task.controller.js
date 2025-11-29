import mongoose from 'mongoose';
import Task from '../model/task.model.js';
const updateOverdueTasks = async () => {
  const now = new Date();
  await Task.updateMany(
    {
      status: { $in: ['pending', 'in-progress'] },
      dueDate: { $lt: now }
    },
    {
      status: 'overdue'
    }
  );
};
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      loan,
      taskType,
      priority,
      dueDate,
      location,
      clientContact,
      notes
    } = req.body;

    // Validate assigned employee exists
    const User = await import('../model/user.model.js').then(mod => mod.default);
    const assignedEmployee = await User.findById(assignedTo);
    if (!assignedEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Assigned employee not found'
      });
    }

    // Validate loan exists
    const Loan = await import('../model/loan.model.js').then(mod => mod.default);
    const loanData = await Loan.findById(loan)
      .populate('client', 'firstName lastName phoneNumber')
      .populate('assignedEmployee', 'firstName lastName');

    if (!loanData) {
      return res.status(400).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Validate due date is in the future
    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in the future'
      });
    }

    // Auto-populate some fields based on task type and loan
    let autoTitle = title;
    let autoDescription = description;
    let autoLocation = location;
    let autoClientContact = clientContact;

    if (!autoTitle) {
      const clientName = `${loanData.client.firstName} ${loanData.client.lastName}`;
      autoTitle = `${taskType.replace('-', ' ')} - ${clientName}`;
    }

    if (!autoDescription) {
      switch (taskType) {
        case 'disbursement':
          autoDescription = `Disburse ${loanData.loanType === 'money' ? 'loan amount' : 'item'} to client`;
          break;
        case 'collection':
          autoDescription = `Collect payment for loan ${loanData.loanNumber}`;
          break;
        case 'client-registration':
          autoDescription = 'Register new client and complete documentation';
          break;
        case 'follow-up':
          autoDescription = 'Follow up with client regarding loan status';
          break;
        case 'inspection':
          autoDescription = 'Conduct site inspection or item verification';
          break;
      }
    }

    if (!autoLocation && loanData.client.address) {
      autoLocation = `${loanData.client.address.location}, ${loanData.client.address.county}`;
    }

    if (!autoClientContact) {
      autoClientContact = loanData.client.phoneNumber;
    }

    const task = await Task.create({
      title: autoTitle,
      description: autoDescription,
      assignedTo,
      assignedBy: req.user._id,
      loan,
      taskType,
      priority: priority || 'medium',
      dueDate: dueDateObj,
      location: autoLocation,
      clientContact: autoClientContact,
      notes,
      status: 'pending'
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType totalAmount');

    // NOTIFICATION: Task Assigned - Send to Assigned Employee
    try {
      const { createNotification } = await import('./notification.controller.js');
      
      // Format due date for the notification message
      const formattedDueDate = dueDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      await createNotification({
        title: '📝 New Task Assigned',
        message: `You have been assigned: "${task.title}" - Due: ${formattedDueDate}`,
        type: 'task_assigned',
        recipient: task.assignedTo, 
        sender: req.user._id, 
        relatedEntity: {
          entityType: 'task',
          entityId: task._id
        },
        priority: priority || 'high',
        channelId: 'default'
      });
      
      console.log(`📨 Task assignment notification sent to employee ${task.assignedTo}`);
    } catch (notificationError) {
      console.error('❌ Error sending task notification:', notificationError);
      // Don't fail task creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating task',
      error: error.message
    });
  }
};
export const getTasks = async (req, res) => {
  try {
    await updateOverdueTasks();

    const {
      page = 1,
      limit = 10,
      search,
      status,
      taskType,
      priority,
      assignedTo,
      assignedBy,
      loan,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    let query = {};

    // If user is not admin, only show their assigned tasks or tasks they created
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      if (Array.isArray(status)) {
        query.status = { $in: status };
      } else {
        query.status = status;
      }
    }

    // Filter by task type
    if (taskType) {
      query.taskType = taskType;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by assigned to
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      query.assignedTo = assignedTo;
    }

    // Filter by assigned by
    if (assignedBy && mongoose.Types.ObjectId.isValid(assignedBy)) {
      query.assignedBy = assignedBy;
    }

    // Filter by loan
    if (loan && mongoose.Types.ObjectId.isValid(loan)) {
      query.loan = loan;
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get tasks with pagination
    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType client totalAmount')
      .populate({
        path: 'loan',
        populate: {
          path: 'client',
          select: 'firstName lastName phoneNumber'
        }
      })
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks',
      error: error.message
    });
  }
};
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    let query = { _id: id };
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    const task = await Task.findOne(query)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType totalAmount remainingBalance status')
      .populate({
        path: 'loan',
        populate: {
          path: 'client',
          select: 'firstName middleName lastName phoneNumber address'
        }
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task',
      error: error.message
    });
  }
};
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      location,
      clientContact,
      notes
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    let query = { _id: id };

    // If user is not admin, restrict access to their tasks only
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }

    const task = await Task.findOne(query);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }

    // Validate assigned employee if being changed
    if (assignedTo && assignedTo !== task.assignedTo.toString()) {
      const User = await import('../models/User.js').then(mod => mod.default);
      const assignedEmployee = await User.findById(assignedTo);
      if (!assignedEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Assigned employee not found'
        });
      }
    }

    // Validate due date if being changed
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (dueDateObj <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Due date must be in the future'
        });
      }
    }

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (location !== undefined) task.location = location;
    if (clientContact !== undefined) task.clientContact = clientContact;
    if (notes !== undefined) task.notes = notes;

    // If task was overdue and due date is updated to future, reset status to pending
    if (task.status === 'overdue' && dueDate && new Date(dueDate) > new Date()) {
      task.status = 'pending';
    }

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType totalAmount');

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: populatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task',
      error: error.message
    });
  }
};
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, outcome, amountCollected, nextFollowUp, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task status'
      });
    }

    let query = { _id: id };

    // If user is not admin, restrict access to their tasks only
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }

    const task = await Task.findOne(query);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access denied'
      });
    }

    // Status transition validation
    if (status === 'completed' && !task.assignedTo.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Only the assigned employee can complete this task'
      });
    }

    task.status = status;

    if (status === 'completed') {
      task.completedAt = new Date();
      if (outcome) task.outcome = outcome;
      if (amountCollected !== undefined) task.amountCollected = amountCollected;
      if (nextFollowUp) task.nextFollowUp = new Date(nextFollowUp);
    }

    if (notes) {
      task.notes = notes;
    }

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType totalAmount');

    // If task is completed and it's a collection task, create a payment record
    if (status === 'completed' && task.taskType === 'collection' && task.amountCollected > 0) {
      try {
        const Payment = await import('../models/Payment.js').then(mod => mod.default);
        const Loan = await import('../models/Loan.js').then(mod => mod.default);

        const loan = await Loan.findById(task.loan)
          .populate('client', 'firstName lastName');

        if (loan) {
          await Payment.create({
            loan: task.loan,
            client: loan.client._id,
            amount: task.amountCollected,
            paymentMethod: 'cash',
            receivedBy: req.user._id,
            paymentDate: new Date(),
            dueDate: task.dueDate,
            notes: `Collection task: ${task.title} - ${task.outcome || 'Completed'}`
          });
        }
      } catch (paymentError) {
        console.error('Error creating payment from collection task:', paymentError);
        // Don't fail the task update if payment creation fails
      }
    }

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: populatedTask
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task status',
      error: error.message
    });
  }
};
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID'
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task',
      error: error.message
    });
  }
};
export const getTaskStats = async (req, res) => {
  try {
    await updateOverdueTasks();

    let query = {};

    // If user is not admin, only show their tasks
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    // Get tasks count by status
    const statusStats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get tasks by type
    const typeStats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$taskType',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get tasks by priority
    const priorityStats = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get upcoming tasks (due in next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTasks = await Task.countDocuments({
      ...query,
      status: { $in: ['pending', 'in-progress'] },
      dueDate: { $lte: nextWeek }
    });

    // Get total collections amount from completed collection tasks
    const collectionStats = await Task.aggregate([
      {
        $match: {
          ...query,
          taskType: 'collection',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCollections: { $sum: 1 },
          totalAmount: { $sum: '$amountCollected' },
          averageAmount: { $avg: '$amountCollected' }
        }
      }
    ]);

    const collections = collectionStats[0] || {
      totalCollections: 0,
      totalAmount: 0,
      averageAmount: 0
    };

    res.json({
      success: true,
      data: {
        byStatus: statusStats,
        byType: typeStats,
        byPriority: priorityStats,
        upcomingTasks,
        collections
      }
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task statistics',
      error: error.message
    });
  }
};
export const getTasksByEmployee = async (req, res) => {
  try {
    await updateOverdueTasks(); // Update overdue tasks first

    const { employeeId } = req.params;
    const { status, taskType, page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    // Check if user has permission to view these tasks
    if (req.user.role !== 'admin' && req.user._id.toString() !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own tasks.'
      });
    }

    let query = { assignedTo: employeeId };

    if (status) {
      query.status = status;
    }

    if (taskType) {
      query.taskType = taskType;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find(query)
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType totalAmount')
      .populate({
        path: 'loan',
        populate: {
          path: 'client',
          select: 'firstName lastName phoneNumber'
        }
      })
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Task.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    // Get employee performance stats
    const performanceStats = await Task.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(employeeId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCollections: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$taskType', 'collection'] },
                    { $eq: ['$status', 'completed'] }
                  ]
                },
                '$amountCollected',
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        performance: performanceStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get tasks by employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee tasks',
      error: error.message
    });
  }
};
export const getOverdueTasks = async (req, res) => {
  try {
    await updateOverdueTasks(); // Update overdue tasks first

    const { page = 1, limit = 10 } = req.query;

    let query = { status: 'overdue' };

    // If user is not admin, only show their overdue tasks
    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .populate('loan', 'loanNumber loanType totalAmount')
      .populate({
        path: 'loan',
        populate: {
          path: 'client',
          select: 'firstName lastName phoneNumber'
        }
      })
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Task.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue tasks',
      error: error.message
    });
  }
};
export const getTasksByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID'
      });
    }

    let query = { loan: loanId };

    // If user is not admin, restrict access to their tasks only
    if (req.user.role !== 'admin') {
      query.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email phoneNumber')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Task.countDocuments(query);
    const pages = Math.ceil(total / limitNum);

    // Get loan details
    const Loan = await import('../model/.model.js').then(mod => mod.default);
    const loan = await Loan.findById(loanId)
      .populate('client', 'firstName middleName lastName')
      .select('loanNumber loanType totalAmount status');

    res.json({
      success: true,
      data: {
        loan,
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages
        }
      }
    });
  } catch (error) {
    console.error('Get tasks by loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan tasks',
      error: error.message
    });
  }
};
export const getTasksByEmployees = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const tasks = await Task.find({ assignedTo: employeeId })
      .populate('loan', 'loanNumber totalAmount')
      .populate('assignedBy', 'firstName lastName')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks by employee:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }

};
