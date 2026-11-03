export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error({
      requestId: req.id,
      err,
    });
  }

  res.status(status).json({
    error: {
      code: err.code || "internal error",
      message: status >= 500 ? "internal server error" : err.message,
      details: err.details,
      requestId: req.id,
    },
  });
}
