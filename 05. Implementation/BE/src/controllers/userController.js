import jwt from 'jsonwebtoken';
import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import AdminModel from '../models/AdminModel.js';
import Instructor from '../models/Instructor.js';
import StudentModel from '../models/StudentModel.js';

const getPhilippineTime = () => {
  // Create a date object
  const now = new Date();
  // Add 8 hours (UTC+8) in milliseconds
  return new Date(now.getTime() + (8 * 60 * 60 * 1000));
};

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

        // Check if email is already verified
        if (user.isEmailVerified) {
            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user._id,
                    gmail: user.gmail,
                    role: user.role,
                    userType
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1d' }
            );

            // Update last login time
            user.lastLogin = getPhilippineTime();
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                data: {
                    id: user._id,
                    name: user.fullName || user.username,
                    gmail: user.gmail,
                    role: user.role,
                    userType,
                    isEmailVerified: true
                }
            });
        }

        // If email is not verified, proceed with OTP verification
        console.log('Email not verified, proceeding with OTP verification');
        
        // Prepare credentials based on user type
        let credentials = {
            userType,
            gmail: user.gmail
        };

        if (userType === 'instructor') {
            credentials = {
                ...credentials,
                fullName: user.fullName,
                program: user.program,
                faculty: user.faculty
            };
        } else if (userType === 'student') {
            credentials = {
                ...credentials,
                fullName: user.fullName,
                program: user.program,
                faculty: user.faculty,
                yearLevel: user.yearLevel
            };
        } else if (userType === 'admin') {
            credentials = {
                ...credentials,
                username: user.username,
                gmail: user.gmail
            };
        }

        console.log('Prepared credentials:', credentials);

        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP:', otp);
        
        // Save OTP
        user.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        await user.save();
        console.log('Saved OTP to user document');

        // Send OTP with credentials
        console.log('Attempting to send OTP email to:', gmail);
        const emailSent = await sendOTP(gmail, otp, credentials);
        console.log('Email sent status:', emailSent);
        
        if (!emailSent) {
            console.error('Failed to send OTP email');
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
        user.lastLogin = getPhilippineTime(); // now it's a STRING, not a Date// Update to Philippine time
        user.isEmailVerified = true;  // Set email as verified after successful OTP verification
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                _id: user._id, // Add _id as an alias for userId for compatibility
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

export const logout = async (req, res) => {
    try {
        const userId = req.user.userId; // Get user ID from the token
        const userType = req.user.userType; // Get user type from the token

        // Find user based on type and ID
        let user;
        
        if (userType === 'admin') {
            user = await AdminModel.findById(userId);
        } else if (userType === 'instructor') {
            user = await Instructor.findById(userId);
        } else if (userType === 'student') {
            user = await StudentModel.findById(userId);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update lastLogout time
        user.lastLogout = getPhilippineTime();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Successfully logged out"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
