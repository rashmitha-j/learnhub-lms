import bcrypt from 'bcrypt';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ROLES } from '../utils/constants.js';
import { signToken } from '../utils/token.js';

// Compared against when the email is unknown, so both failure paths take similar time.
const DUMMY_HASH = bcrypt.hashSync('timing-safe-placeholder', 12);

const sendAuth = (res, user, statusCode, message) =>
  sendSuccess(res, { statusCode, message, data: { user, token: signToken(user) } });

export const register = async (req, res) => {
  const { name, email, password, role = ROLES.STUDENT } = req.body;

  if (role === ROLES.ADMIN) {
    throw ApiError.forbidden('Admin accounts cannot be created through registration');
  }

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  // Only whitelisted fields are used; the role is limited to student/instructor above
  const user = await User.create({ name, email, password, role });
  sendAuth(res, user, 201, 'Account created successfully');
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  const valid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // Same message for unknown email and wrong password
  if (!user || !valid) throw ApiError.unauthorized('Invalid email or password');

  sendAuth(res, user, 200, 'Logged in successfully');
};

export const getMe = (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
};
