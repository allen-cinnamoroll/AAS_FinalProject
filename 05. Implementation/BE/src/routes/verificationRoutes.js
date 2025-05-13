import express from 'express';
import { verifyEmail } from '../controllers/verificationController.js';

const router = express.Router();

// Route to verify email
router.get('/verify-email', verifyEmail);

export default router; 