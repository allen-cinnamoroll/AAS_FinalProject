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
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateVerificationToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const sendVerificationEmail = async (email, verificationToken, userType, userData) => {
    try {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=${userType}`;
        
        let userInfoHtml = '';
        if (userType === 'instructor') {
            userInfoHtml = `
                <div class="credentials-section" style="text-align: center;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Instructor Information</h3>
                    <div style="display: inline-block; text-align: left; background-color: #f8f9fa; padding: 15px; border-radius: 5px; min-width: 250px;">
                        <p style="margin: 8px 0;"><strong>Full Name:</strong> ${userData.fullName}</p>
                        <p style="margin: 8px 0;"><strong>Program:</strong> ${userData.program}</p>
                        <p style="margin: 8px 0;"><strong>Faculty:</strong> ${userData.faculty}</p>
                        <p style="margin: 8px 0;"><strong>Role:</strong> Instructor</p>
                    </div>
                </div>
            `;
        } else if (userType === 'student') {
            userInfoHtml = `
                <div class="credentials-section" style="text-align: center;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Student Information</h3>
                    <div style="display: inline-block; text-align: left; background-color: #f8f9fa; padding: 15px; border-radius: 5px; min-width: 250px;">
                        <p style="margin: 8px 0;"><strong>Full Name:</strong> ${userData.fullName}</p>
                        <p style="margin: 8px 0;"><strong>Program:</strong> ${userData.program}</p>
                        <p style="margin: 8px 0;"><strong>Faculty:</strong> ${userData.faculty}</p>
                        <p style="margin: 8px 0;"><strong>Year Level:</strong> ${userData.yearLevel}</p>
                        <p style="margin: 8px 0;"><strong>Role:</strong> Student</p>
                    </div>
                </div>
            `;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Account - JAK Attendance System',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; padding: 20px 0; background-color: #ffffff; border-radius: 8px; margin-bottom: 20px;">
                        <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">JAK Attendance System</h1>
                        <p style="color: #7f8c8d; margin: 10px 0;">Account Verification Required</p>
                    </div>

                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #2c3e50; margin: 0 0 15px 0; text-align: center;">Welcome to JAK Attendance System!</h2>
                        <p style="color: #34495e; line-height: 1.6; text-align: center;">
                            Thank you for registering. Please verify your email address by clicking the button below:
                        </p>
                        <div style="text-align: center; margin: 25px 0;">
                            <a href="${verificationLink}" 
                               style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #7f8c8d; font-size: 14px; text-align: center;">
                            If the button above doesn't work, copy and paste this link into your browser:<br>
                            <span style="color: #3498db; word-break: break-all;">${verificationLink}</span>
                        </p>
                    </div>

                    ${userInfoHtml}

                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 12px;">
                        <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
                        <p style="margin: 5px 0;">If you didn't create this account, please ignore this email.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

export const sendOTP = async (gmail, otp, credentials = {}) => {
    try {
        let credentialsHtml = '';
        if (credentials.userType === 'instructor') {
            credentialsHtml = `
                <div class="credentials-section" style="text-align: center;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Instructor Information</h3>
                    <div style="display: inline-block; text-align: left; background-color: #f8f9fa; padding: 15px; border-radius: 5px; min-width: 250px;">
                        <p style="margin: 8px 0;"><strong>Full Name:</strong> ${credentials.fullName}</p>
                        <p style="margin: 8px 0;"><strong>Program:</strong> ${credentials.program}</p>
                        <p style="margin: 8px 0;"><strong>Faculty:</strong> ${credentials.faculty}</p>
                        <p style="margin: 8px 0;"><strong>Role:</strong> Instructor</p>
                    </div>
                </div>
            `;
        } else if (credentials.userType === 'student') {
            credentialsHtml = `
                <div class="credentials-section" style="text-align: center;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Student Information</h3>
                    <div style="display: inline-block; text-align: left; background-color: #f8f9fa; padding: 15px; border-radius: 5px; min-width: 250px;">
                        <p style="margin: 8px 0;"><strong>Full Name:</strong> ${credentials.fullName}</p>
                        <p style="margin: 8px 0;"><strong>Program:</strong> ${credentials.program}</p>
                        <p style="margin: 8px 0;"><strong>Faculty:</strong> ${credentials.faculty}</p>
                        <p style="margin: 8px 0;"><strong>Year Level:</strong> ${credentials.yearLevel}</p>
                        <p style="margin: 8px 0;"><strong>Role:</strong> Student</p>
                    </div>
                </div>
            `;
        } else if (credentials.userType === 'admin') {
            credentialsHtml = `
                <div class="credentials-section" style="text-align: center;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Admin Information</h3>
                    <div style="display: inline-block; text-align: left; background-color: #f8f9fa; padding: 15px; border-radius: 5px; min-width: 250px;">
                        <p style="margin: 8px 0;"><strong>Username:</strong> ${credentials.username}</p>
                        <p style="margin: 8px 0;"><strong>Gmail:</strong> ${credentials.gmail}</p>
                        <p style="margin: 8px 0;"><strong>Role:</strong> Administrator</p>
                    </div>
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
                        <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
                        <p style="margin: 5px 0;">If you didn't request this OTP, please ignore this email.</p>
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