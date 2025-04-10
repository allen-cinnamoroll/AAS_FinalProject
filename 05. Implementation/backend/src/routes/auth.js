import express from "express";
import { registrationValidationRules, validate } from "../middleware/validator.js";
import { login, register, refreshAccessToken } from "../controllers/authController.js";

const authRouter = express.Router();

// Login route with JSON parsing middleware
authRouter.post("/login", express.json(), login);

// Register route with validation middleware
authRouter.post("/register", 
    express.json(), 
    registrationValidationRules(), 
    validate,
    register
);

// Refresh token route
authRouter.post("/refresh-token", refreshAccessToken);

export default authRouter;