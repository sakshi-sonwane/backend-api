import { loginUser, registerUser } from "../modules/auth/auth.service.js";

export const register = async (req, res) => {
  const user = await registerUser(req.body);
  res.status(201).json({
    data: user,
  });
};

export const login = async (req, res) => {
  const result = await loginUser(req.body);
  res.status(200).json({
    data: result,
  });
};

export const currentUser = async (req, res) => {
  res.status(200).json({ data: req.user });
};
