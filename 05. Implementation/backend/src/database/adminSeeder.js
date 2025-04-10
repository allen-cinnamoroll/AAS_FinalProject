import UserModel from '../models/UserModel.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await UserModel.findOne({ role: "0" });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin", 10);
            
            await UserModel.create({
                username: "admin",
                email: "admin@gmail.com",
                password: hashedPassword,
                role: "0" // admin role
            });
            
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};