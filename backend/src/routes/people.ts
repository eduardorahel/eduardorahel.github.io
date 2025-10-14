import { Router } from "express";

import { authenticate, requireRoles } from "../middlewares/auth.js";
import {
  createPersonHandler,
  forgetPersonHandler,
  getPersonHandler,
  listPeopleHandler,
  updatePersonHandler,
} from "../controllers/personController.js";

const peopleRouter = Router();

peopleRouter.use(authenticate);

peopleRouter.get("/", listPeopleHandler);
peopleRouter.post("/", requireRoles("ADMIN", "MANAGER"), createPersonHandler);
peopleRouter.get("/:id", getPersonHandler);
peopleRouter.put("/:id", requireRoles("ADMIN", "MANAGER"), updatePersonHandler);
peopleRouter.delete("/:id", requireRoles("ADMIN", "MANAGER"), forgetPersonHandler);

export { peopleRouter };
