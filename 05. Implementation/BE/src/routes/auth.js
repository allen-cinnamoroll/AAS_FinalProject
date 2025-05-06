import express from "express";
import { registrationValidationRules, validate } from "../middleware/validator.js";
import { login, register, refreshAccessToken } from "../controllers/authController.js";

const adminAuthRouter = express.Router();

// Login route with JSON parsing middleware
adminAuthRouter.post("/login", express.json(), login);

// Register route with validation middleware
adminAuthRouter.post("/register", 
    express.json(), 
    registrationValidationRules(), 
    validate,
    register
);

// Refresh token route
adminAuthRouter.post("/refresh-token", refreshAccessToken);

export default adminAuthRouter;