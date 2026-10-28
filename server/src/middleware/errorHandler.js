// Error with an HTTP status code and optional per-field details.
class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// Runs when no route matched. Must be mounted AFTER all routes.
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler. Express recognises it by its 4 arguments.
// Every error response has the shape:
// { success: false, message: "...", errors?: [{ field, message }] }
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  } else if (err.name === "ValidationError" && err.errors) {
    // Mongoose schema validation failure
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  // Log unexpected errors server-side, but never leak internals to the client.
  if (statusCode === 500) {
    console.error(err);
  }

  const body = { success: false, message };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }

  res.status(statusCode).json(body);
};

module.exports = { ApiError, notFound, errorHandler };