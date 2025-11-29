import express from 'express';
import { checkAuth, deleteProfilePicture, forgotPassword, getUserProfile, loginUser, logoutUser, registerAdmin, resetPassword, updatePassword, updateUserProfile } from '../controller/auth.controller.js';
import { protectRoute } from '../middleware/authMiddleWare.js';
import upload from '../lib/multer.js';

const router = express.Router();
router.post('/login', loginUser);
router.post('/register-admin', registerAdmin);

router.post('/logout', logoutUser);
router.get("/check",protectRoute, checkAuth)
router
  .route('/profile')
  .get(protectRoute, getUserProfile)
  .put(protectRoute, upload.single('profilePic'), updateUserProfile);

router.patch('/update-password', protectRoute, updatePassword);
router.delete('/profile/picture', protectRoute, deleteProfilePicture);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

export default router;