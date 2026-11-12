import argon2 from "argon2";
import { User } from "../../models/user.models.js";
import ApiError from "../../utils/api-error.js";
import jwt from "jsonwebtoken";

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
    throw new ApiError(400, "INVALID_CREDENTIALS", "Invalid email or password");
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

  return {
    accessToken,
    user: { id: user.uuId, name: user.userName, email: user.userEmail },
  };
};
