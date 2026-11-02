import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

const projectSchema = new Schema(
  {
    projectId: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      immutable: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    projectDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Project = mongoose.model("Project", projectSchema);
