import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const generateOTP = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
};

export const sendOTP = async (gmail, otp, credentials = {}) => {
    try {
        let credentialsHtml = '';
        if (credentials.userType === 'instructor') {
            credentialsHtml = `
                <div class="credentials-section">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">Instructor Information</h3>
                    <p><strong>Full Name:</strong> ${credentials.fullName}</p>
                    <p><strong>Program:</strong> ${credentials.program}</p>
                    <p><strong>Faculty:</strong> ${credentials.faculty}</p>
                    <p><strong>Role:</strong> Instructor</p>
                </div>
            `;
        } else if (credentials.userType === 'student') {
            credentialsHtml = `
                <div class="credentials-section">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">Student Information</h3>
                    <p><strong>Full Name:</strong> ${credentials.fullName}</p>
                    <p><strong>Program:</strong> ${credentials.program}</p>
                    <p><strong>Faculty:</strong> ${credentials.faculty}</p>
                    <p><strong>Year Level:</strong> ${credentials.yearLevel}</p>
                </div>
            `;
        } else if (credentials.userType === 'admin') {
            credentialsHtml = `
                <div class="credentials-section">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">Admin Information</h3>
                    <p><strong>Username:</strong> ${credentials.username}</p>
                    <p><strong>Gmail:</strong> ${credentials.gmail}</p>
                    <p><strong>Role:</strong> Administrator</p>
                </div>
            `;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: gmail,
            subject: 'OTP Verification - JAK Attendance System',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; padding: 20px 0; background-color: #ffffff; border-radius: 8px; margin-bottom: 20px;">
                        <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">JAK Attendance System</h1>
                        <p style="color: #7f8c8d; margin: 10px 0;">One-Time Password (OTP) Verification</p>
                    </div>

                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #2c3e50; margin: 0 0 15px 0; text-align: center;">Your OTP Code</h2>
                        <div style="background-color: #f1f2f6; padding: 15px; border-radius: 5px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #2c3e50; font-family: monospace;">
                            ${otp}
                        </div>
                        <p style="color: #e74c3c; font-size: 14px; text-align: center; margin-top: 10px;">
                            This code will expire in 10 minutes
                        </p>
                    </div>

                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
                        ${credentialsHtml}
                    </div>

                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 12px;">
                        <p>This is an automated message, please do not reply.</p>
                        <p>If you didn't request this OTP, please ignore this email.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};