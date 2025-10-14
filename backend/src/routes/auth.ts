import { Router } from "express";

import { loginHandler, registerHandler } from "../controllers/authController.js";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);

export { authRouter };
