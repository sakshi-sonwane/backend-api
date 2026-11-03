import ApiError from "../utils/api-error.js";

export const notFound = (req, _res, next) => {
  next(
    new ApiError(
      404,
      "not found",
      `Route ${req.method} ${req.originalUrl} not found`,
    ),
  );
};
