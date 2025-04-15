import { Router } from 'express';
import { sendVerificationOTP, verifyEmail } from '../controllers/otpController.js';

const router = Router();

router.post('/send', sendVerificationOTP);
router.post('/verify', verifyEmail);

export default router;