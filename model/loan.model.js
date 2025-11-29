import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  loanNumber: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  loanType: {
    type: String,
    enum: ['money', 'item'],
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  loanAmount: {
    type: Number,
    min: 0
  },
  itemPrice: {
    type: Number,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  depositPaid: {
    type: Boolean,
    default: false
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  interestPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interest',
    required: true
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0
  },
  paymentFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'one-time'],
    required: true
  },
  installmentAmount: {
    type: Number,
    required: true,
    min: 0
  },
  loanDuration: {
    type: Number,
    required: true,
    min: 1
  },
  durationUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  expectedCompletionDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'active', 'completed', 'defaulted', 'rejected', 'at-risk', 'ahead', 'on-track'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    /* required: true */
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  disbursementDetails: {
    method: {
      type: String,
      enum: ['cash', 'mpesa', 'bank'],
      /* required: true */
    },
    transactionId: {
      type: String,
      trim: true
    },
    disbursedAt: {
      type: Date
    },
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  missedPayments: {
    count: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastMissedDate: {
      type: Date
    }
  },
  paymentHistory: [{
    date: Date,
    amount: Number,
    paidBy: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

loanSchema.index({ client: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ assignedEmployee: 1 });
loanSchema.index({ dueDate: 1 });
loanSchema.index({ createdBy: 1 });

// Pre-save middleware to calculate remaining balance
loanSchema.pre('save', function(next) {
  this.remainingBalance = this.totalAmount - this.amountPaid;
  next();
});

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;