import express from 'express';
import { login, verifyOTP, logout } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/logout', authenticate, logout); // Add authenticate middleware

export default router;