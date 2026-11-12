import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import ApiError from "../utils/api-error.js";

export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization; //auth field lo or haeder me ddali

  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
  } //check kiya ki header me value aayi ki ni or Bearer se start hota h ki ni

  const token = header.split(" ")[1]; //token ko todna pdta h bearer hatane k liye

  let payload;
  try {
    //jwt.verify- check krta h ki signature(token kisi ne badla to ni) or time expiry
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid or expired token");
  }

  const user = await User.findOne({ uuId: payload.sub }); //find kro user ko payload ki uuId se

  if (!user) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid or expired token");
  }

  req.user = { id: user.uuId, name: user.userName, email: user.userEmail };
  console.log(req.user);

  next();
};
