import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import database from "./src/database/database.js";
import dotenv from "dotenv";
import { seedAdmin } from './src/database/adminSeeder.js';
import instructorRoutes from './src/routes/instructor.js';
import authRouter from './src/routes/auth.js';

//Load environment variables from .env file
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Add this to parse URL-encoded bodies

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

database.on("error", console.error.bind(console, "MongoDB connection error:"));
database.once('open', async () => {
  console.log('Connected to database');
  await seedAdmin();
});

// API routes
app.use('/api/instructors', instructorRoutes);
app.use('/api/auth', authRouter);

const server = http.createServer(app);
//server port
const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});