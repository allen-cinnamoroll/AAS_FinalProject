import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import database from "./src/database/database.js";
import dotenv from "dotenv";
import instructorRoutes from './src/routes/instructor.js';
import adminRoutes from './src/routes/admin.js';
import fs from 'fs';
import path from 'path';
import studentRoutes from './src/routes/student.js';
import courseRoutes from './src/routes/course.js';
import assignedCourseRoutes from './src/routes/assignedCourse.js';
import enrollmentRoutes from './src/routes/enrollment.js';
import authRoutes from './src/routes/auth.js';
import { fileURLToPath } from 'url';
import verificationRoutes from './src/routes/verificationRoutes.js';
import sectionRoutes from './src/routes/section.js';
import attendanceRoutes from './src/routes/attendance.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

database.on("error", console.error.bind(console, "MongoDB connection error:"));

// API routes
app.use('/api/instructors', instructorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assigned-courses', assignedCourseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/attendance', attendanceRoutes);

const server = http.createServer(app);
//server port
const PORT = process.env.PORT || 8000;

// Listen on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});