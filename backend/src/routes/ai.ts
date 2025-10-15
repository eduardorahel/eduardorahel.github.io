import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { aiQueryHandler } from "../controllers/aiController.js";

const aiRouter = Router();

aiRouter.use(authenticate);
aiRouter.post("/query", aiQueryHandler);

export { aiRouter };
