import express from "express";

import {
    authenticateToken,
    authorizeRoles
} from "../middlewares/authMiddleware.js";

import {
    searchStudentsByRoll
} from "../controllers/studentController.js";

// Create a new Express router for student-related routes.
const studentRouter = express.Router();

// Search students by roll number.
//
// authenticateToken → verifies that the user is authenticated.
// authorizeRoles("admin") → allows only users with the "admin" role.
// searchStudentsByRoll → handles the actual search operation.
studentRouter.get(
    "/search-by-roll",
    authenticateToken,
    authorizeRoles("admin"),
    searchStudentsByRoll
);

// Export the student router so it can be connected
// to the main Express application.
export default studentRouter;