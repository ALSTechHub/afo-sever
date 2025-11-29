import mongoose from 'mongoose';

const stockHistorySchema = new mongoose.Schema({
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  quantityAdded: {
    type: Number,
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  costPrice: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  specifications: {
    type: Map,
    of: String
  },
  actualPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  minimumStock: {
    type: Number,
    default: 0,
    min: 0
  },
  depositPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  interestPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interest',
    required: true
  },
  stockHistory: [stockHistorySchema],
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

itemSchema.index({ category: 1 });
itemSchema.index({ name: 1 });
itemSchema.index({ currentStock: 1 });
itemSchema.index({ isActive: 1 });

const Item = mongoose.model('Item', itemSchema);
export default Item;