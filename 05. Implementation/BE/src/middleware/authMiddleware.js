import jwt from "jsonwebtoken";
import AdminModel from "../models/AdminModel.js";
import InstructorModel from "../models/Instructor.js";
import StudentModel from "../models/StudentModel.js";
import dotenv from "dotenv";

dotenv.config();

// JWT authentication middleware
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access token required" });
  }

  try {
    // Extract token if it's in the format "Bearer [token]"
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    console.log('Authenticating with token:', tokenValue.substring(0, 20) + '...');
    
    const decoded = jwt.verify(tokenValue, process.env.ACCESS_TOKEN_SECRET);
    console.log('Decoded token:', decoded);
    
    // Find the user based on their role and ID
    let user = null;
    switch (decoded.role) {
      case "0": // Admin
        user = await AdminModel.findById(decoded.userId);
        break;
      case "1": // Instructor
        user = await InstructorModel.findById(decoded.userId);
        break;
      case "2": // Student
        user = await StudentModel.findById(decoded.userId);
        break;
      default:
        return res.status(403).json({
          success: false,
          message: "Invalid user role"
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Add the user's ID to both user and userData for compatibility
    if (decoded && !decoded._id && decoded.userId) {
      decoded._id = decoded.userId;
    }
    
    // Ensure the user object has _id set
    if (user && !user._id && user.id) {
      user._id = user.id;
    }
    
    console.log('Authenticated user:', {
      id: user._id || user.id,
      role: decoded.role,
      userType: decoded.userType
    });

    // Attach both the decoded token and user data
    req.user = decoded;
    req.userData = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(403).json({ 
      success: false, 
      message: "Invalid or expired token",
      error: err.message 
    });
  }
};

// Role validation middleware
export const authorizeRole = (...requiredRoles) => {
  const roleMapping = {
    student: "2",
    instructor: "1",
    admin: "0"
  };

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }

      // Translate the required roles to their database values
      const allowedRoles = requiredRoles.map(role => roleMapping[role]);
      
      // Determine which model to use based on the user's role
      let user = null;
      switch (req.user.role) {
        case "0": // Admin
          user = await AdminModel.findById(req.user.userId);
          break;
        case "1": // Instructor
          user = await InstructorModel.findById(req.user.userId);
          break;
        case "2": // Student
          user = await StudentModel.findById(req.user.userId);
          break;
        default:
          return res.status(403).json({
            success: false,
            message: "Invalid user role"
          });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Check if the user's role is in the list of allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions"
        });
      }

      // Attach the user object to the request for use in route handlers
      req.userData = user;
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during authorization"
      });
    }
  };
};

export default authenticate;
