import StudentModel from '../models/StudentModel.js';
import InstructorModel from '../models/Instructor.js';

export const verifyEmail = async (req, res) => {
    try {
        const { token, type } = req.query;

        if (!token || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing verification token or user type'
            });
        }

        let user;
        if (type === 'student') {
            user = await StudentModel.findOne({ verificationToken: token });
        } else if (type === 'instructor') {
            user = await InstructorModel.findOne({ verificationToken: token });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = undefined; // Remove the token after verification
        await user.save();

        // Redirect to frontend success page
        res.redirect(`${process.env.FRONTEND_URL}/verification-success`);
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email'
        });
    }
}; 