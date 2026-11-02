import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

const activitySchema = new Schema(
  {
    activityId: {
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
    actorId: {
      type: String,
      required: true,
      immutable: true,
    },
    action: {
      type: String, // जैसे "task.created", "member.added"
      required: true,
      immutable: true,
      trim: true,
      maxlength: 50,
    },
    entityType: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      maxlength: 50,
    },
    entityId: {
      type: String,
      required: true,
      immutable: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

activitySchema.index({ projectId: 1, createdAt: -1 });

export const Activity = mongoose.model("Activity", activitySchema);
