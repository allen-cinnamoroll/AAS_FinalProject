import express from 'express';
import { loginStudent, verifyStudentOTP } from '../controllers/studentAuthController.js';

const router = express.Router();

router.post('/login', loginStudent);
router.post('/verify-otp', verifyStudentOTP);

export default router;