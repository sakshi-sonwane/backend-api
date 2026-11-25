import argon2 from "argon2";
import ApiError from "../../utils/api-error.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { refreshSession } from "../../models/refreshSession.models.js";
import { Project } from "../../models/project.models.js";
import { ProjectMember } from "../../models/projectMember.models.js";
import mongoose from "mongoose";
import { Activity } from "../../models/activityLog.models.js";
import { User } from "../../models/user.models.js";

export const registerUser = async ({ name, email, password }) => {
  const userPwd = await argon2.hash(password);

  try {
    const user = await User.create({
      userName: name,
      userEmail: email,
      password: userPwd,
    });

    return {
      id: user.uuId,
      name: user.userName,
      email: user.userEmail,
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "DUPLICATE_KEY", "email already registered");
    }
    throw error;
  }
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ userEmail: email }).select("+password");

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const validPwd = await argon2.verify(user.password, password);

  if (!validPwd) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const accessToken = jwt.sign(
    {
      sub: user.uuId,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    },
  );

  const refreshToken = await createRefreshToken(user.uuId);

  return {
    accessToken,
    user: { id: user.uuId, name: user.userName, email: user.userEmail },
    refreshToken,
  };
};

//token hash bnaya
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// console.log(hashToken("abc"));

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30;

//ref token fun bnaya
const createRefreshToken = async (userId) => {
  const randomToken = crypto.randomBytes(48).toString("hex");

  const hash = hashToken(randomToken);

  await refreshSession.create({
    userId,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
  });

  return randomToken;
};

//yha plainToken ka mtlb refresh Token hi rhega
export const logoutUser = async (plainToken) => {
  //req.body se token chiye
  if (!plainToken) {
    throw new ApiError(400, "TOKEN_REQUIRED", "Refresh token required");
  }

  const hashedToken = hashToken(plainToken);

  const session = await refreshSession.findOneAndUpdate(
    { tokenHash: hashedToken, revokedAt: null },
    { revokedAt: new Date() },
  );

  if (!session) {
    throw new ApiError(
      401,
      "UNAUTHORIZED_TOKEN",
      "token may be expired or changed",
    );
  }
};

export const refreshAccessToken = async (plainToken) => {
  if (!plainToken) {
    throw new ApiError(400, "TOKEN_REQUIRED", "Refresh token required");
  }

  const hashedToken = hashToken(plainToken);

  const session = await refreshSession.findOneAndUpdate(
    { tokenHash: hashedToken, revokedAt: null, expiresAt: { $gt: new Date() } },
    { revokedAt: new Date() },
    { new: true },
  );

  if (!session) {
    throw new ApiError(401, "UNAUTHORIZED_TOKEN", "Invalid refresh token");
  }

  const newRefreshToken = await createRefreshToken(session.userId);
  const newAccessToken = jwt.sign(
    {
      sub: session.userId,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
    },
  );

  return { refreshToken: newRefreshToken, accessToken: newAccessToken };
};

export const sessionsList = async (userId) => {
  if (!userId) {
    throw new ApiError(400, "INVALID_USER", "new user or user logged out");
  }

  const sessions = await refreshSession
    .find({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
    .select("refId createdAt expiresAt -_id");

  return sessions;
};

export const revokeSession = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    throw new ApiError(400, "INVALID_REQUEST", "userId and sessionId required");
  }

  const session = await refreshSession.findOneAndUpdate(
    { refId: sessionId, userId, revokedAt: null },
    { revokedAt: new Date() },
    { new: true },
  );

  if (!session) {
    throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
  }
};

export const createProject = async (
  userId,
  { projectName, projectDescription },
) => {
  if (!userId) {
    throw new ApiError(401, "UNAUTHENTICATED", "User not found");
  }

  const session = await mongoose.startSession();

  try {
    let createdProject;
    await session.withTransaction(async () => {
      [createdProject] = await Project.create(
        [
          {
            projectName,
            projectDescription,
            ownerId: userId,
          },
        ],
        { session },
      );

      await ProjectMember.create(
        [
          {
            projectId: createdProject.projectId,
            userId,
            role: "OWNER",
          },
        ],
        { session },
      );
    });

    return createdProject;
  } finally {
    await session.endSession();
  }
};

export const projectList = async (userId, { page, limit } = {}) => {
  if (!userId) {
    throw new ApiError(401, "UNAUTHENTICATED_USER", "User not authenticated");
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const skipValue = (safePage - 1) * safeLimit;

  const membership = await ProjectMember.find({ userId })
    .select("projectId role -_id")
    .lean();

  const projectIds = membership.map((m) => m.projectId);
  const roleByProject = new Map(membership.map((m) => [m.projectId, m.role]));

  const filter = { projectId: { $in: projectIds } };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .select("projectId projectName projectDescription ownerId createdAt -_id")
      .sort({ createdAt: -1 })
      .skip(skipValue)
      .limit(safeLimit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  const data = projects.map((p) => ({
    ...p,
    myRole: roleByProject.get(p.projectId),
  }));

  return {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getProjectById = async (userId, projectId) => {
  if (!userId) {
    throw new ApiError(401, "UNAUTHENTICATED_USER", "user not authenticated");
  }
  const membership = await ProjectMember.findOne({ userId, projectId })
    .select("role -_id")
    .lean();

  if (!membership) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");
  }

  const project = await Project.findOne({ projectId })
    .select("projectId projectName projectDescription ownerId createdAt -_id")
    .lean();

  if (!project) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "Project not found");
  }

  return { ...project, myRole: membership.role };
};

export const updateProjectById = async (projectId, userId, input) => {
  const membership = await ProjectMember.findOne({ projectId, userId });

  if (!membership) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }

  if (membership.role === "MEMBER") {
    throw new ApiError(
      403,
      "NOT_ALLOWED_TO_UPDATE_THE_PROJECT",
      "member not allowed to update the project",
    );
  }

  const session = await mongoose.startSession();

  try {
    let project;
    await session.withTransaction(async () => {
      project = await Project.findOneAndUpdate(
        { projectId },
        { $set: input },
        { new: true, runValidators: true, session },
      );

      if (!project)
        throw new ApiError(404, "PROJECT_NOT_FOUND", "project not found");

      await Activity.create(
        [
          {
            projectId,
            actorId: userId,
            action: "PROJECT_UPDATED",
            entityType: "PROJECT",
            entityId: projectId,
            metadata: { changedFields: Object.keys(input) },
          },
        ],
        { session },
      );
    });

    return project;
  } finally {
    await session.endSession();
  }
};

export const deleteProjectById = async (projectId, userId) => {
  const membership = await ProjectMember.findOne({ projectId, userId });

  if (!membership) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }

  if (membership.role !== "OWNER") {
    throw new ApiError(
      403,
      "NOT_ALLOWED_TO_DELETE_THE_PROJECT",
      "member & manager are not allowed to delete the project",
    );
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await ProjectMember.deleteMany({ projectId }, { session });
      await Activity.deleteMany({ projectId }, { session });

      const result = await Project.deleteOne({ projectId }, { session });

      if (result.deletedCount === 0) {
        throw new ApiError(404, "PROJECT_NOT_FOUND", "project not found");
      }
    });
  } finally {
    await session.endSession();
  }
};

export const addMemberstoProject = async (actorId, addUserEmail, projectId) => {
  if (!actorId || !projectId) {
    throw new ApiError(
      400,
      "INVALID_REQUEST",
      "actorId and projectId are required",
    );
  }

  if (typeof addUserEmail !== "string" || !addUserEmail.trim()) {
    throw new ApiError(400, "INVALID_EMAIL", "Valid email is required");
  }
  //person who adds member
  const actor = await ProjectMember.findOne({ projectId, userId: actorId });
  if (!actor) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }

  if (!["OWNER", "MANAGER"].includes(actor.role)) {
    throw new ApiError(
      403,
      "NOT_ALLOWED_TO_ADD_MEMBER",
      "Only project owners and managers can add members",
    );
  }

  // find the user(by Email) which the above person has to add
  const normalizedEmail = addUserEmail.trim().toLowerCase();

  const findUserToAdd = await User.findOne({
    userEmail: normalizedEmail,
  });

  if (!findUserToAdd) {
    throw new ApiError(404, "NOT_FOUND", "User to be add not found");
  }

  if (findUserToAdd.uuId === actorId) {
    throw new ApiError(400, "SELF_ADD_NOT_ALLOWED", "You cannot add yourself");
  }

  // transaction applied bcz of entry in the ProjectMember & Activity logs will be there
  const session = await mongoose.startSession();

  try {
    let memberAdded;
    await session.withTransaction(async () => {
      [memberAdded] = await ProjectMember.create(
        [{ projectId, userId: findUserToAdd.uuId, role: "MEMBER" }],
        { session },
      );

      await Activity.create(
        [
          {
            projectId,
            actorId,
            action: "MEMBER_ADDED",
            entityId: findUserToAdd.uuId,
            entityType: "MEMBER",
            metadata: { email: normalizedEmail, role: "MEMBER" },
          },
        ],
        { session },
      );
    });
    return {
      projectId,
      userId: findUserToAdd.uuId,
      name: findUserToAdd.userName,
      email: normalizedEmail,
      role: memberAdded.role,
      joinedAt: memberAdded.joinedAt,
    };
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "ALREADY_MEMBER", "user is already a member");
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

// callerId ka mtlb req.user.id h jo ki contoller me req.user.id hoga
export const listProjMembers = async (
  projectId,
  callerId,
  { page, limit } = {},
) => {
  // caller ki membership dhundho
  const membership = await ProjectMember.findOne({
    projectId,
    userId: callerId,
  });

  if (!membership) {
    throw new ApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }

  // const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  // const safePage = Math.max(Number(page) || 1, 1);
  const skipValue = (page - 1) * limit;

  const membersList = await ProjectMember.find({ projectId })
    .select("userId role joinedAt -_id")
    .lean()
    .skip(skipValue)
    .limit(limit)
    .sort({ joinedAt: 1, _id: 1 });

  const Ids = membersList.map((m) => m.userId);

  const users = await User.find({ uuId: { $in: Ids } })
    .select("uuId userName userEmail")
    .lean();

  const userMap = new Map(users.map((u) => [u.uuId, u]));

  const members = membersList.map((m) => {
    const u = userMap.get(m.userId);
    return {
      userId: m.userId,
      name: u?.userName,
      email: u?.userEmail,
      role: m.role,
      joinedAt: m.joinedAt,
    };
  });

  const total = await ProjectMember.countDocuments({ projectId });

  return { total, members };
};
