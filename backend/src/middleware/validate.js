import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Runs after express-validator chains; forwards a 400 with field-level details.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest('Validation failed', details));
};

export default validate;
