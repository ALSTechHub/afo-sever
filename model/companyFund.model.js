import mongoose from 'mongoose';

const fundsTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['initial', 'replenishment', 'loan-disbursement', 'loan-repayment', 'expense', 'profit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  previousBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

const companyFundsSchema = new mongoose.Schema({
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDisbursed: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRecovered: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  transactionHistory: [fundsTransactionSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

companyFundsSchema.index({ currentBalance: 1 });

const CompanyFunds = mongoose.model('CompanyFunds', companyFundsSchema);
export default CompanyFunds;