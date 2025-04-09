import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import database from "./src/database/database.js";
import dotenv from "dotenv";

//Load environment variables from .env file
dotenv.config();

const app = express();

app.use(cors());

database.on("error", console.error.bind(console, "MongoDB connection error:"));

const server = http.createServer(app);
//server port
const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});