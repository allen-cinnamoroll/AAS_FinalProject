import jwt from 'jsonwebtoken';
import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import Instructor from '../models/Instructor.js';

export const loginInstructor = async (req, res) => {
    const { gmail, instructorId } = req.body;

    try {
        // Find instructor by gmail
        const instructor = await Instructor.findOne({ gmail });
        
        if (!instructor) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or instructor ID"
            });
        }

        // Verify instructor ID
        if (instructor.instructorId !== instructorId) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or instructor ID"
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Save OTP to instructor document
        instructor.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        };
        await instructor.save();

        // Send OTP via email
        const emailSent = await sendOTP(gmail, otp);
        
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP"
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP sent to your email"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verifyInstructorOTP = async (req, res) => {
    const { gmail, otp } = req.body;

    try {
        const instructor = await Instructor.findOne({ gmail });

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor not found"
            });
        }

        // Verify OTP
        if (!instructor.otp?.code || 
            instructor.otp.code !== otp || 
            new Date() > instructor.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Clear OTP
        instructor.otp = null;
        
        // Update last login
        instructor.lastLogin = new Date();
        await instructor.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                instructorId: instructor._id,
                gmail: instructor.gmail,
                role: instructor.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '1d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                instructorId: instructor.instructorId,
                name: instructor.fullName,
                gmail: instructor.gmail,
                role: instructor.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};