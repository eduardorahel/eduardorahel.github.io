import { Router } from "express";

import { authRouter } from "./auth.js";
import { datasetsRouter } from "./datasets.js";
import { peopleRouter } from "./people.js";
import { aiRouter } from "./ai.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/datasets", datasetsRouter);
router.use("/people", peopleRouter);
router.use("/ai", aiRouter);

export { router };
