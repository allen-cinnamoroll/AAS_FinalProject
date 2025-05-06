import mongoose from 'mongoose';
import UserModel from './models/UserModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const initAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_LOCAL);
        console.log('Connected to MongoDB');

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('lagangga123', salt);

        // Find and update the existing admin user
        const updatedAdmin = await UserModel.findOneAndUpdate(
            { role: '0' },
            {
                username: 'allen',
                email: 'allenjeanlagangga0217@gmail.com',
                password: hashedPassword,
                isEmailVerified: true
            },
            { new: true }
        );

        if (updatedAdmin) {
            console.log('Admin user updated successfully:', updatedAdmin.email);
        } else {
            console.log('No admin user found to update');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
};

initAdmin(); 