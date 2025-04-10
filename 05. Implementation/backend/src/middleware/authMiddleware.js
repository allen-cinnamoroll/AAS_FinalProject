import jwt from "jsonwebtoken";
import  UserModel  from "../models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

// JWT authentication middleware
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  // console.log(req.headers)
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // Attach user information to the request object
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message });
  }
};

// Role validation middleware
export const authorizeRole = (...requiredRoles) => {
  const roleMapping = {
    instructor: "1",
    admin: "0",
  };

  return async (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const user = await UserModel.findById(req.user.userId);
    
    // Translate the required roles to their database values
    const allowedRoles = requiredRoles.map((user) => roleMapping[user]);
  
    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions",
      });
    }

    next();
  };
};

export default authenticate;
