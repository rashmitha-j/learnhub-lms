// Promotes an existing user to admin: `npm run make-admin -- user@example.com`
// Admin accounts can never be created through the public registration API.
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

const run = async () => {
  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { new: true });

  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exitCode = 1;
  } else {
    console.log(`${user.email} is now an admin.`);
  }
  await disconnectDB();
};

run().catch(async (err) => {
  console.error('Failed to promote user:', err.message);
  await disconnectDB();
  process.exit(1);
});
