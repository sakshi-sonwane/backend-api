import argon2 from "argon2";
import { User } from "../../models/user.models.js";
import ApiError from "../../utils/api-error.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { refreshSession } from "../../models/refreshSession.models.js";
import { Project } from "../../models/project.models.js";
import { ProjectMember } from "../../models/projectMember.models.js";
import mongoose from "mongoose";
import { Activity } from "../../models/activityLog.models.js";

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
        {projectId},
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
