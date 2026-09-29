import express from "express";
import * as AuthHandler from "../controller/authHandler.js";

const router = express.Router();

// Register
router.post("/signup", AuthHandler.signup);

// Login
router.post("/login", AuthHandler.login);

export default router;
