import mongoose from 'mongoose';

const savingsSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  savingsNumber: {
    type: String,
    required: true,
    unique: true
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposits: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0,
    min: 0
  },
  interestRate: {
    type: Number,
    default: 0,
    min: 0
  },
  lastInterestCalculation: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const savingsTransactionSchema = new mongoose.Schema({
  savings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Savings',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['deposit', 'withdrawal', 'interest', 'loan-repayment'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'savings', 'system'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true,
    required: function() {
      return this.paymentMethod === 'mpesa';
    }
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  notes: {
    type: String,
    trim: true
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

savingsSchema.index({ client: 1 });
savingsSchema.index({ isActive: 1 });

savingsTransactionSchema.index({ savings: 1 });
savingsTransactionSchema.index({ client: 1 });
savingsTransactionSchema.index({ transactionType: 1 });
savingsTransactionSchema.index({ createdAt: 1 });

const Savings = mongoose.model('Savings', savingsSchema);
const SavingsTransaction = mongoose.model('SavingsTransaction', savingsTransactionSchema);

export { Savings, SavingsTransaction };