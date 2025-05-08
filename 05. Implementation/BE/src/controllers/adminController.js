import jwt from 'jsonwebtoken';
import AdminModel from '../models/AdminModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const ACCESS_KEY = process.env.ACCESS_TOKEN_SECRET;
const ACCESS_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '1d';
const REFRESH_KEY = process.env.REFRESH_TOKEN_SECRET;
const REFRESH_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

export const register = async (req, res) => {
    try {
        const { username, gmail, password } = req.body;

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

        // Create new admin
        const newAdmin = new AdminModel({
            username,
            gmail,
            password,
            role: "0"
        });

        await newAdmin.save();

        res.status(201).json({
            success: true,
            message: "Admin registered successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
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