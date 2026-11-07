import ApiError from "../utils/api-error.js";

export const validate = (schemas) => (req, res, next) => {
  const details = [];

  for (const part of ["body", "query", "params"]) {
    if (!schemas[part]) {
      continue;
    }

    const result = schemas[part].safeParse(req[part]);

    if (!result.success) {
      details.push(
        ...result.error.issues.map((i) => ({
          field: [part, ...i.path].join("."), //   kaunsi field galat hai
          message: i.message, //   kya galat hai
        })),
      );
      continue;
    }

    if (part === "query") {
      req.validatedQuery = result.data;
    } else {
      req[part] = result.data;
    }
  }

  if (details.length > 0) {
    return next(
      new ApiError(
        400,
        "VALIDATION_ERROR",
        "Request validation failed",
        details,
      ),
    );
  }
  next();
};
