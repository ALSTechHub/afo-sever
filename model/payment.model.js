import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'bank', 'savings'],
    required: true
  },
  transactionId: {
    type: String,
    trim: true,
    required: function() {
      return this.paymentMethod === 'mpesa' || this.paymentMethod === 'bank';
    }
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  isOnTime: {
    type: Boolean,
    default: true
  },
  lateDays: {
    type: Number,
    default: 0
  },
  penaltyAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed'
  },
  reversalReason: {
    type: String,
    trim: true
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reversedAt: {
    type: Date
  },
}, {
  timestamps: true
});

paymentSchema.index({ loan: 1 });
paymentSchema.index({ client: 1 });
paymentSchema.index({ receivedBy: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;