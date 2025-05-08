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
        let credentialsText = '';
        if (credentials.userType === 'instructor') {
            credentialsText = `
                Your Account Information:
                Full Name: ${credentials.fullName}
                Program: ${credentials.program}
                Faculty: ${credentials.faculty}
                Role: Instructor`;
        } else if (credentials.userType === 'student') {
            credentialsText = `
                Your Account Information:
                Full Name: ${credentials.fullName}
                Program: ${credentials.program}
                Faculty: ${credentials.faculty}
                Year Level: ${credentials.yearLevel}`;
        } else if (credentials.userType === 'admin') {
            credentialsText = `
                Your Account Information:
                Username: ${credentials.username}
                Gmail: ${credentials.gmail}
                Role: Administrator`;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: gmail,
            subject: 'OTP Verification',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>OTP Verification</h2>
                    <p>Your OTP code is: <strong style="font-size: 24px;">${otp}</strong></p>
                    <p>This code will expire in 10 minutes.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                        ${credentialsText.split('\n').join('<br>')}
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