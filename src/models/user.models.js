import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

const userSchema = new Schema(
  {
    uuId: {
      type: String,
      default: () => crypto.randomUUID(),
      unique: true,
      immutable: true,
    },
    userName: {
      type: String,
      required: [true, "username is required"],
      trim: true,
      maxlength: 100,
    },
    userEmail: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
