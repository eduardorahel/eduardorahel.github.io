import { Router } from "express";

import { authenticate } from "../middlewares/auth.js";
import {
  dataHandler,
  erHandler,
  importHandler,
  listHandler,
  previewHandler,
  relationHandler,
  uploader,
} from "../controllers/datasetController.js";

const datasetsRouter = Router();

datasetsRouter.use(authenticate);

datasetsRouter.post("/preview", uploader.single("file"), previewHandler);

datasetsRouter.post("/import", importHandler);

datasetsRouter.get("/", listHandler);

datasetsRouter.get("/:id/data", dataHandler);

datasetsRouter.post("/relations", relationHandler);

datasetsRouter.get("/er", erHandler);

export { datasetsRouter };
