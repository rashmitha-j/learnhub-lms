import mongoose from 'mongoose';
import { sendSuccess } from '../utils/apiResponse.js';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export const getHealth = (req, res) => {
  const database = DB_STATES[mongoose.connection.readyState] || 'unknown';
  const healthy = database === 'connected';

  sendSuccess(res, {
    statusCode: healthy ? 200 : 503,
    message: 'LMS API is running',
    data: {
      status: healthy ? 'ok' : 'degraded',
      database,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};
