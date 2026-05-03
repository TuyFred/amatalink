import express from 'express';
import { register, login, verifyEmail, getCurrentUser, resendVerificationCode, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', register);

// Login
router.post('/login', login);

// Verify email
router.post('/verify-email', verifyEmail);

// Resend verification code
router.post('/resend-code', resendVerificationCode);

// Forgot password - Request reset
router.post('/forgot-password', forgotPassword);

// Reset password - Finalize
router.post('/reset-password', resetPassword);

// Get current user
router.get('/me', authenticateToken, getCurrentUser);

export default router;
