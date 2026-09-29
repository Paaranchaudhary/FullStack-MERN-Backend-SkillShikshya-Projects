import express from "express";
import * as AuthHandler from "../controller/authHandler.js";

const router = express.Router();

router.post("/signup", AuthHandler.signup);

router.post("/login", AuthHandler.login);

export default router;
