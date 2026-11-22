import ApiError from "../utils/api-error.js";

export const notFound = (req, _res, next) => {
  next(
    new ApiError(
      404,
      "ROUTE_NOT_FOUND",
      `Route ${req.method} ${req.originalUrl} not found`,
    ),
  );
};
