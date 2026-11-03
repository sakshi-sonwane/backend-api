class ApiError extends Error {
  constructor(status, code, message = "Something went wrong", details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export default ApiError;
