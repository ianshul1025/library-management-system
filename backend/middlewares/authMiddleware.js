import User from "../models/User.js";
import jwt from "jsonwebtoken";

// To authenticate JWT Token
export const authenticateToken = async (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers["authorization"];

        // Extract token from "Bearer <token>"
        const token = authHeader && authHeader.split(" ")[1];

        // Check if token is provided
        if (!token) {
            return res.status(401).json({
                message: "No token provided, authorization denied"
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user from decoded user ID
        const user = await User.findById(decoded.id).select("-password");

        // Check if user exists
        if (!user) {
            return res.status(401).json({
                message: "Token is not valid or user no longer exists"
            });
        }

        // Attach user information to request object
        req.user = user;

        // Continue to next middleware
        next();

    } catch (error) {
        console.error("JWT Auth error:", error);

        return res.status(401).json({
            message: "Token is not valid"
        });
    }
};


// Middleware to authorize specific roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {

        // Check if user exists and has an authorized role
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access Forbidden"
            });
        }

        // Continue to next middleware
        next();
    };
};