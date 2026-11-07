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
      unique: true,
      trim: true,
      lowercase: true,
    },
    userEmail: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    userPwd: {
      type: String,
      select: false,
      required: [true, "Password is required"],
      trim:true
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
