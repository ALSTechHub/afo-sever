import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const emergencyContactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
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
  }
});

const addressSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true
  },
  county: {
    type: String,
    required: true
  },
  subLocation: {
    type: String,
    required: true
  },
  street: {
    type: String
  }
});

const nextOfKinSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }
});

const employmentContractSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['permanent', 'contract'],
    required: true
  },
  duration: {
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      required: function () {
        return this.type === 'contract';
      }
    },
    value: {
      type: Number,
      required: function () {
        return this.type === 'contract';
      }
    }
  }
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  nationalId: {
    type: Number,
    required: true
  },
  kraPin: {
    type: String,
    required: true
  },
  citizenship: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  address: {
    type: addressSchema,
    required: true
  },
  emergencyContact: {
    type: emergencyContactSchema,
    required: true
  },
  nextOfKin: {
    type: nextOfKinSchema,
    required: true
  },
  employmentType: {
    type: employmentContractSchema,
    required: true
  },
   jobType: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  profilePic: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
}, {
  timestamps: true
});

userSchema.index({ role: 1 });
userSchema.index({ jobType: 1 });
userSchema.index({ 'address.county': 1 });
userSchema.index({ kraPin: 1 });
userSchema.index({ citizenship: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;