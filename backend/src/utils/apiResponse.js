// Consistent success envelope: { success: true, message?, data }
export const sendSuccess = (res, { statusCode = 200, message, data = null } = {}) => {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  return res.status(statusCode).json(body);
};
