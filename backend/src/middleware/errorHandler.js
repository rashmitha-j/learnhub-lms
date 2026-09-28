import env from '../config/env.js';

// Maps known error types to { statusCode, message, details }.
const normalizeError = (err) => {
  if (err.name === 'ApiError') {
    return { statusCode: err.statusCode, message: err.message, details: err.details };
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return { statusCode: 400, message: 'Validation failed', details };
  }

  if (err.name === 'CastError') {
    return { statusCode: 400, message: `Invalid ${err.path}: ${err.value}` };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return { statusCode: 409, message: `A record with this ${field} already exists` };
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return { statusCode: 401, message: 'Invalid or expired token' };
  }

  // Malformed JSON body from express.json()
  if (err.type === 'entity.parse.failed') {
    return { statusCode: 400, message: 'Malformed JSON in request body' };
  }

  return { statusCode: err.statusCode || 500, message: err.message || 'Internal server error' };
};

// Express identifies error handlers by their 4-argument signature
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const { statusCode, message, details } = normalizeError(err);

  if (statusCode >= 500) {
    console.error(err);
  }

  const body = {
    success: false,
    message: statusCode >= 500 && env.isProduction ? 'Internal server error' : message,
  };
  if (details) body.details = details;
  if (!env.isProduction && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

export default errorHandler;
