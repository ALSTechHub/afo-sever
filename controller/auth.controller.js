import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/generateToken.js";
import User from "../model/user.model.js";
import crypto from 'crypto'
export const registerAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already registered' });
    }
    const { firstName, lastName, email, password, nationalId } = req.body;
    const admin = await User.create({
      firstName,
      lastName,
      nationalId,
      email,
      password,
      role: 'admin',
      phoneNumber: '0000000000',
      jobType: 'manager',
      gender: 'other',
      kraPin: 'A0000000X',
      citizenship: 'Kenyan',
      address: {
        location: 'Headquarters',
        county: 'Main',
        subLocation: 'Office',
        street: 'Admin Street'
      },
      emergencyContact: {
        firstName: 'Admin',
        lastName: 'Emergency',
        phoneNumber: '0000000000',
        relationship: 'other'
      },
      nextOfKin: {
        fullName: 'Admin Kin',
        phoneNumber: '0000000000',
        email: 'admin.kin@example.com'
      },
      employmentType: {
        type: 'permanent',
        duration: {
          unit: 'years',
          value: 1
        }
      },
      profilePic: '',
      isActive: true
    });
    if (admin) {
      generateToken(admin._id, res);
      res.status(201).json({
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        nationalId: admin.nationalId,
        email: admin.email,
        role: admin.role
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    console.error('Error in registerAdmin:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ 
          message: 'Account is deactivated. Please contact administrator.' 
        });
      }
      if (await user.matchPassword(password)) {
        generateToken(user._id, res);
        user.lastLogin = new Date();
        await user.save();
        res.json({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          nationalId: user.nationalId,
          role: user.role,
          jobType: user.jobType,
          isActive: user.isActive
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error in loginUser:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const logoutUser = (req, res) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logoutUser:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
 
    res.status(200).json({
      ...user.toObject(),
      token: req.cookies.jwt
    });
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    console.log('Token created and saved:', {
      token: user.passwordResetToken,
      expires: user.passwordResetExpires
    });

    const checkUser = await User.findOne({ email }).select('passwordResetToken passwordResetExpires');
    console.log('DB check:', checkUser);

    const resetURL = `http://localhost:5174/reset-password/${resetToken}`;
    console.log('🔗 Reset URL:', resetURL);

    try {
      /* await sendPasswordResetEmail(user, resetURL); */
      console.log('Email sending completed');

      res.status(200).json({
        status: 'success',
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    } catch (err) {
      console.error(' Error sending email:', err);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        message: 'There was an error sending the email. Try again later!'
      });
    }
  } catch (error) {
    console.error(' Error in forgotPassword:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({
        message: 'Token is invalid or has expired'
      });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();
    generateToken(user._id, res);
    /* await sendPasswordResetSuccessEmail(user); */
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully!',
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        jobType: user.jobType
      }
    });

  } catch (error) {
    console.error('Error in resetPassword:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
}; 
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ message: 'Your current password is wrong' });
    }
    user.password = req.body.newPassword;
    await user.save();
    generateToken(user._id, res);

    const updatedUser = await User.findById(user._id).select('-password');
    
    res.status(200).json(updatedUser); 
  } catch (error) {
    console.error('Error in updatePassword:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      if (req.file) {
        if (user.profilePic) {
          const publicId = user.profilePic.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'profile_pics',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' }
          ]
        });
        
        user.profilePic = result.secure_url;
      }

      const updatedUser = await user.save();
      const userResponse = await User.findById(updatedUser._id).select('-password');
      res.json(userResponse); 
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in updateUserProfile:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user && user.profilePic) {
      // Delete image from Cloudinary
      const publicId = user.profilePic.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
      
      // Remove profile picture from user
      user.profilePic = '';
      await user.save();
      
      res.status(200).json({ 
        message: 'Profile picture deleted successfully',
        profilePic: ''
      });
    } else {
      res.status(404).json({ message: 'No profile picture to delete' });
    }
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};