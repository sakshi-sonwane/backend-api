import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

const refreshSchema = new Schema(
  {
    refId: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      immutable: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type:Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

refreshSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const refreshSession = mongoose.model("refreshSession", refreshSchema);
