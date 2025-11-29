import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  county: {
    type: String,
    required: true
  },
  subLocation: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  street: {
    type: String
  }
});

const emergencyContactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    enum: ['parent', 'relative', 'sister', 'brother', 'guardian', 'spouse', 'other'],
    required: true
  },
  nationalId: {
    type: String,
    required: true
  },
  address: {
    type: addressSchema,
    required: true
  }
});

const clientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  nationalId: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: addressSchema,
    required: true
  },
  emergencyContact: {
    type: emergencyContactSchema,
    required: true
  },
  creditScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  totalLoansTaken: {
    type: Number,
    default: 0
  },
  totalLoansRepaid: {
    type: Number,
    default: 0
  },
  totalDefaults: {
    type: Number,
    default: 0
  },
  currentActiveLoans: {
    type: Number,
    default: 0
  },
  isEligible: {
    type: Boolean,
    default: true
  },
  blacklistReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastLoanDate: {
    type: Date
  }
}, {
  timestamps: true
});
clientSchema.index({ isEligible: 1 });
clientSchema.index({ creditScore: 1 });
clientSchema.index({ 'address.county': 1 });

const Client = mongoose.model('Client', clientSchema);
export default Client;