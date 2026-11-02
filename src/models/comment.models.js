import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

const commentSchema = new Schema(
  {
    commentId: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      immutable: true,
    },
    taskId: {
      type: String,
      required: true,
      immutable: true,
    },
    authorId: {
      type: String,
      required: true,
      immutable: true,
    },
    content: {
      type: String,
      trim: true,
      minlength: 1,
      maxlength: 1000,
      required: [true, "content is required"],
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ taskId: 1, createdAt: 1 });

export const Comment = mongoose.model("Comment", commentSchema);
