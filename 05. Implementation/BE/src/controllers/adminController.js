import jwt from 'jsonwebtoken';
import AdminModel from '../models/AdminModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import StudentModel from '../models/StudentModel.js';
import InstructorModel from '../models/Instructor.js';
import { generateVerificationToken, sendVerificationEmail } from '../utils/emailUtil.js';

dotenv.config();
const ACCESS_KEY = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '1d';
const REFRESH_KEY = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

export const register = async (req, res) => {
    try {
        const { username, gmail, password } = req.body;

        // Validate required fields
        if (!username || !gmail || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check if admin already exists
        const adminExists = await AdminModel.findOne({
            $or: [{ username }, { gmail }]
        });

        if (adminExists) {
            return res.status(400).json({
                success: false,
                message: adminExists.username === username
                    ? "Username already taken"
                    : "Gmail already taken"
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create new admin
        const newAdmin = new AdminModel({
            username,
            gmail,
            password,
            role: "0",
            isEmailVerified: false,
            verificationToken
        });

        await newAdmin.save();

        // Send verification email
        await sendVerificationEmail(gmail, verificationToken, 'admin', {
            username,
            gmail
        });

        res.status(201).json({
            success: true,
            message: "Admin registered successfully. Please check your email for verification."
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Error registering admin"
        });
    }
};

export const login = async (req, res) => {
    const { gmail, password } = req.body;

    try {
        const user = await AdminModel.findOne({
            $or: [{ gmail }, { username: gmail }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Email or username is incorrect"
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect"
            });
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                gmail: user.gmail,
                isPasswordChange: user.isPasswordChange
            },
            ACCESS_KEY,
            { expiresIn: ACCESS_EXPIRATION }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user._id },
            REFRESH_KEY,
            { expiresIn: REFRESH_EXPIRATION }
        );

        // Store refresh token in HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const refreshAccessToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        const error = new Error("Refresh token required");
        error.status = 401;
        error.success = false;
        return next(error);
    }

    jwt.verify(refreshToken, REFRESH_KEY, async (err, user) => {
        if (err) {
            const error = new Error("Invalid refresh token");
            error.status = 403;
            error.success = false;
            return next(error);
        }

        try {
            const currentUser = await AdminModel.findById(user.userId);

            if (!currentUser) {
                const error = new Error("User not found");
                error.status = 404;
                error.success = false;
                return next(error);
            }

            const newAccessToken = jwt.sign(
                {
                    userId: currentUser._id,
                    username: currentUser.username,
                    role: currentUser.role,
                    gmail: currentUser.gmail,
                    isPasswordChange: currentUser.isPasswordChange
                },
                ACCESS_KEY,
                { expiresIn: ACCESS_EXPIRATION }
            );

            return res.json({
                success: true,
                message: "Access token generated successfully",
                role: currentUser.role,
                token: newAccessToken,
            });
        } catch (err) {
            const error = new Error("Failed to refresh access token");
            error.status = 403;
            error.success = false;
            return next(error);
        }
    });
};

export const registerStudent = async (req, res) => {
    try {
        const {
            fullName,
            gmail,
            password,
            program,
            faculty,
            yearLevel
        } = req.body;

        // Check if student already exists
        const existingStudent = await StudentModel.findOne({ gmail });
        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Student with this email already exists'
            });
        }

        // Create new student with email verified by default
        const student = new StudentModel({
            fullName,
            gmail,
            password,
            program,
            faculty,
            yearLevel,
            isVerified: true // Set as verified by default
        });

        await student.save();

        res.status(201).json({
            success: true,
            message: 'Student registered successfully'
        });
    } catch (error) {
        console.error('Error registering student:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering student'
        });
    }
};

export const registerInstructor = async (req, res) => {
    try {
        const {
            fullName,
            gmail,
            password,
            program,
            faculty
        } = req.body;

        // Check if instructor already exists
        const existingInstructor = await InstructorModel.findOne({ gmail });
        if (existingInstructor) {
            return res.status(400).json({
                success: false,
                message: 'Instructor with this email already exists'
            });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create new instructor
        const instructor = new InstructorModel({
            fullName,
            gmail,
            password, // Note: Make sure password is hashed in the model
            program,
            faculty,
            verificationToken,
            isVerified: false
        });

        await instructor.save();

        // Send verification email
        await sendVerificationEmail(gmail, verificationToken, 'instructor', {
            fullName,
            program,
            faculty
        });

        res.status(201).json({
            success: true,
            message: 'Instructor registered successfully. Verification email has been sent.'
        });
    } catch (error) {
        console.error('Error registering instructor:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering instructor'
        });
    }
};