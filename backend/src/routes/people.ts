import { Router } from "express";
import { authenticate, requireRoles } from "../middlewares/auth.js";
import {
  createPersonHandler,
  deletePersonHandler,
  erasePersonHandler,
  listPeopleHandler,
  updatePersonHandler,
} from "../controllers/personController.js";

const peopleRouter = Router();

peopleRouter.use(authenticate);

peopleRouter.get("/", listPeopleHandler);
peopleRouter.post("/", requireRoles("ADMIN", "MANAGER"), createPersonHandler);
peopleRouter.put("/:id", requireRoles("ADMIN", "MANAGER"), updatePersonHandler);
peopleRouter.delete("/:id", requireRoles("ADMIN", "MANAGER"), deletePersonHandler);
peopleRouter.post("/:id/erase", requireRoles("ADMIN"), erasePersonHandler);

export { peopleRouter };
