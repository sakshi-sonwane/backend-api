import { registerSchema } from "../schema/user.Schema.js";
import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router
  .route("/register")
  .post(validate({ body: registerSchema }), userController);

export default router;
