import jwt from 'jsonwebtoken';
import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import StudentModel from '../models/StudentModel.js';

export const loginStudent = async (req, res) => {
    const { gmail, password } = req.body;  // Changed from studentId to password

    try {
        // Find student by gmail
        const student = await StudentModel.findOne({ gmail });
        
        if (!student) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or password"
            });
        }

        // Verify password (initially their studentId)
        if (student.password || student.studentId !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or password"
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Save OTP to student document
        student.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        };
        await student.save();

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

export const verifyStudentOTP = async (req, res) => {
    const { gmail, otp } = req.body;

    try {
        const student = await StudentModel.findOne({ gmail });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Verify OTP
        if (!student.otp?.code || 
            student.otp.code !== otp || 
            new Date() > student.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Clear OTP
        student.otp = null;
        
        // Update last login
        student.lastLogin = new Date();
        await student.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                studentId: student._id,
                gmail: student.gmail,
                role: student.role
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '1d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                studentId: student.studentId,
                name: student.fullName,
                gmail: student.gmail,
                role: student.role,
                yearLevel: student.yearLevel
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};