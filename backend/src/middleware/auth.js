import mongoose from 'mongoose';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';

const extractToken = (req) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  return scheme === 'Bearer' && token ? token : null;
};

// Resolves the user from a token. The role always comes from the database, never from the token.
const resolveUser = async (token) => {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  return user;
};

// Requires a valid token.
export const protect = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  req.user = await resolveUser(token);
  next();
};

// Attaches the user when a valid token is present; otherwise continues anonymously.
export const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
};

// Restricts a route to the given roles. Must run after protect.
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required');
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
