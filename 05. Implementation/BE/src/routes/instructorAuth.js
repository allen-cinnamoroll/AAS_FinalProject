import express from 'express';
import { loginInstructor, verifyInstructorOTP } from '../controllers/instructorAuthController.js';

const router = express.Router();

router.post('/login', loginInstructor);
router.post('/verify-otp', verifyInstructorOTP);

export default router;