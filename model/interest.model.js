import mongoose from 'mongoose';

const interestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  itemType: {
    type: String,
    enum: ['money', 'item'],
    required: true
  },
  paymentFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'one-time'],
    required: true
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0
  },
  minimumAmount: {
    type: Number,
    min: 0
  },
  maximumAmount: {
    type: Number,
    min: 0
  },
  minimumDuration: {
    type: Number,
    min: 1
  },
  maximumDuration: {
    type: Number,
    min: 1
  },
  durationUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    default: 'days'
  },
  penaltyRate: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

interestSchema.index({ category: 1, paymentFrequency: 1 });
interestSchema.index({ itemType: 1, isActive: 1 });
interestSchema.index({ paymentFrequency: 1 });

const Interest = mongoose.model('Interest', interestSchema);
export default Interest;