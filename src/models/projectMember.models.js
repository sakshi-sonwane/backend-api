import mongoose, { Schema } from "mongoose";

export const PROJECT_ROLES = ["OWNER", "MANAGER", "MEMBER"];

const projMemberSchema = new Schema({
  projectId: {
    type: String,
    required: true,
    immutable: true,
  },

  userId: {
    type: String,
    required: true,
    index: true,
    immutable: true,
  },

  role: {
    type: String,
    required: true,
    default: "MEMBER",
    enum: PROJECT_ROLES,
  },

  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

projMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const ProjectMember = mongoose.model("ProjectMember", projMemberSchema);
