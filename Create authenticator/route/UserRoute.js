import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";

const router = express.Router();

// Get currently logged-in user
router.get("/profile", authenticateUser, (req, res) => {
  res.status(200).json({
    message: "User profile",
    user: req.user,
  });
});

// Check authentication
router.get("/verify", authenticateUser, (req, res) => {
  res.status(200).json({
    message: "Token is valid",
    user: req.user,
  });
});

export default router;
