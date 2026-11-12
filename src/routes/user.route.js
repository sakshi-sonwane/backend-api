import { registerSchema, loginSchema } from "../schema/user.Schema.js";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  register,
  login,
  currentUser,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.route("/register").post(validate({ body: registerSchema }), register);

router.route("/login").post(validate({ body: loginSchema }), login);

router.route("/me").get(authenticate, currentUser);

export default router;
