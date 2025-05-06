import { generateOTP, sendOTP } from '../utils/emailUtil.js';
import UserModel from '../models/AdminModel.js';

export const sendVerificationOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        
        // Save OTP to user document
        user.otp = {
            code: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        };
        await user.save();

        // Send OTP via email
        const emailSent = await sendOTP(email, otp);
        
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send OTP"
            });
        }

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.otp?.code) {
            return res.status(400).json({
                success: false,
                message: "No OTP found. Please request a new one"
            });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        user.isEmailVerified = true;
        user.otp = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};