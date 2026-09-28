// Must be imported before anything that loads src/config/env.js.
// Tests always use a dedicated test database, never the development one.
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/lms_test';
process.env.JWT_SECRET = 'test-only-jwt-secret-for-automated-tests';
process.env.JWT_EXPIRES_IN = '1h';

const dbName = new URL(process.env.MONGO_URI.replace(/^mongodb(\+srv)?:/, 'http:')).pathname.slice(1);
if (!dbName.includes('test')) {
  throw new Error(`Refusing to run tests against database "${dbName}" (name must contain "test")`);
}
