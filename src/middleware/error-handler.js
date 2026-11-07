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
      message: status >= 500 ? "internal server error" : err.message,
      code: err.code || "internal error",
      details: err.details,
      requestId: req.id,
    },
  });
}
