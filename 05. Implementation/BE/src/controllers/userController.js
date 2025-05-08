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
    try {
        const { gmail, password } = req.body;

        // Check in Admin collection first
        let user = await AdminModel.findOne({ gmail });
        let userType = 'admin';

        // If not admin, check instructor
        if (!user) {
            user = await Instructor.findOne({ gmail });
            userType = 'instructor';
        }

        // If not instructor, check student
        if (!user) {
            user = await StudentModel.findOne({ gmail });
            userType = 'student';
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid gmail or password"
            });
        }

        // Verify password based on user type
        let isValidPassword = false;

        if (userType === 'admin') {
            isValidPassword = await user.comparePassword(password);
        } else if (userType === 'instructor') {
            isValidPassword = password === user.instructorId;
        } else {
            isValidPassword = password === user.studentId;
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
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        await user.save();

        // Send OTP
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
            userType
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verifyOTP = async (req, res) => {
    try {
        const { gmail, otp } = req.body;

        // Try to find user in each collection
        let user;
        let userType;
        let role;

        // Check Admin
        user = await AdminModel.findOne({ gmail });
        if (user) {
            userType = 'admin';
            role = '0';
        }

        // Check Instructor
        if (!user) {
            user = await Instructor.findOne({ gmail });
            if (user) {
                userType = 'instructor';
                role = '1';
            }
        }

        // Check Student
        if (!user) {
            user = await StudentModel.findOne({ gmail });
            if (user) {
                userType = 'student';
                role = '2';
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

        // Clear OTP, update login time and email verification
        user.otp = null;
        user.lastLogin = new Date();
        user.isEmailVerified = true;  // Set email as verified after successful OTP verification
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                gmail: user.gmail,
                role,
                userType
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                id: user._id,
                name: user.fullName,
                gmail: user.gmail,
                role,
                userType,
                isEmailVerified: true  // Include in response
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
