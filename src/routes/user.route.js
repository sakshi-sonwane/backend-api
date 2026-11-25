import { registerSchema, loginSchema } from "../schema/auth.Schema.js";

import {
  zodProjectSchema,
  projectIdParamSchema,
  listQuerySchema,
  updateProjectSchema,
} from "../schema/project.Schema.js";
import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  register,
  login,
  currentUser,
  logout,
  sessions,
  deleteSession,
  createProjectController,
  controllerProjectList,
  findProjectById,
  updateProjById,
  deleteprojById,
  addMember,
  contollerListProjectMembers,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { refresh } from "../controllers/auth.controller.js";
import { loginLimiter, authLimiter } from "../middleware/rateLimiter.js";
import { addMemberSchema } from "../schema/member.Schema.js";

const router = Router();

// auth routes

router
  .route("/register")
  .post(authLimiter, validate({ body: registerSchema }), register);

router
  .route("/login")
  .post(loginLimiter, validate({ body: loginSchema }), login);
router.route("/logout").post(logout);

router.route("/refresh").post(authLimiter, refresh);

router.route("/me").get(authenticate, currentUser);

router.route("/sessions").get(authenticate, sessions);

router.route("/sessions/:id").delete(authenticate, deleteSession);

// project routes
router
  .route("/")
  .post(
    authenticate,
    validate({ body: zodProjectSchema }),
    createProjectController,
  );

router
  .route("/list")
  .get(
    authenticate,
    validate({ query: listQuerySchema }),
    controllerProjectList,
  );

router
  .route("/:projectId")
  .get(
    authenticate,
    validate({ params: projectIdParamSchema }),
    findProjectById,
  );

router
  .route("/:projectId")
  .patch(
    authenticate,
    validate({ params: projectIdParamSchema, body: updateProjectSchema }),
    updateProjById,
  );

router
  .route("/delete/:projectId")
  .delete(
    authenticate,
    validate({ params: projectIdParamSchema }),
    deleteprojById,
  );

router
  .route("/add-member/:projectId")
  .post(
    authenticate,
    validate({ body: addMemberSchema, params: projectIdParamSchema }),
    addMember,
  );

router
  .route("/:projectId/members")
  .get(
    authenticate,
    validate({ params: projectIdParamSchema, query: listQuerySchema }),
    contollerListProjectMembers,
  );

export default router;
