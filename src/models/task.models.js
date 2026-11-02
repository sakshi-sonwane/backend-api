import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

export const TASK_STATUS = ["TODO", "IN_PROGRESS", "DONE"];
export const TASK_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const taskSchema = new Schema(
  {
    taskId: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      immutable: true,
    },
    projectId: {
      type: String,
      required: true,
      immutable: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      required: true,
      default: "TODO",
      enum: TASK_STATUS,
    },
    priority: {
      type: String,
      required: true,
      default: "MEDIUM",
      enum: TASK_PRIORITY,
    },
    createdById: {
      type: String, // logged-in user की userId, client से नहीं
      required: true,
      immutable: true,
    },
    assigneeId: {
      type: String,
      default: null,
    },
    dueAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, createdAt: -1 });

export const Task = mongoose.model("Task", taskSchema);
