import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  taskType: {
    type: String,
    enum: ['disbursement', 'collection', 'client-registration', 'follow-up', 'inspection'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  location: {
    type: String,
    trim: true
  },
  clientContact: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  outcome: {
    type: String,
    trim: true
  },
  amountCollected: {
    type: Number,
    default: 0
  },
  nextFollowUp: {
    type: Date
  }
}, {
  timestamps: true
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ taskType: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ loan: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;