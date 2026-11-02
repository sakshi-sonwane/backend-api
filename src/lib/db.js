import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function dbConnect() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("mongoDb connected");
  } catch (error) {
    console.error("connection failed", error.message);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
