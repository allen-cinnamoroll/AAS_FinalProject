import jwt from 'jsonwebtoken';
import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import AdminModel from '../models/AdminModel.js';
import Instructor from '../models/Instructor.js';
import StudentModel from '../models/StudentModel.js';

export const findUser = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await AdminModel.findById(userId).select("-password");
  
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
        success: true,
        data: user,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const login = async (req, res) => {
    const { gmail, password } = req.body;

    try {
        // Check in Admin collection
        let user = await AdminModel.findOne({ gmail });
        let role = "0";

        // If not admin, check in Instructor collection
        if (!user) {
            user = await Instructor.findOne({ gmail });
            role = "1";
        }

        // If not instructor, check in Student collection
        if (!user) {
            user = await StudentModel.findOne({ gmail });
            role = "2";
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or password"
            });
        }

        // Verify password based on role
        let isValidPassword = false;
        if (role === "0") {
            isValidPassword = await user.comparePassword(password);
        } else if (role === "1") {
            isValidPassword = user.instructorId === password;
        } else if (role === "2") {
            isValidPassword = user.studentId === password;
        }

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or password"
            });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Save OTP
        user.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        };
        await user.save();

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
            message: "OTP sent to your email",
            role: role // Include role in response
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verifyOTP = async (req, res) => {
    const { gmail, otp } = req.body;

    try {
        // Check each collection for the user
        let user;
        let role;
        let Model;

        // Try Admin
        user = await AdminModel.findOne({ gmail });
        if (user) {
            role = "0";
            Model = AdminModel;
        }

        // Try Instructor
        if (!user) {
            user = await Instructor.findOne({ gmail });
            if (user) {
                role = "1";
                Model = Instructor;
            }
        }

        // Try Student
        if (!user) {
            user = await StudentModel.findOne({ gmail });
            if (user) {
                role = "2";
                Model = StudentModel;
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify OTP
        if (!user.otp?.code || 
            user.otp.code !== otp || 
            new Date() > user.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        // Clear OTP
        user.otp = null;
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                gmail: user.gmail,
                role: role
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || '1d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                id: user._id,
                name: user.fullName,
                gmail: user.gmail,
                role: role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
