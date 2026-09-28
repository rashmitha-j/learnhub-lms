import './setup.js';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

export const api = supertest(app);
export const PASSWORD = 'Testpass123';

export const setupDatabase = async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((Model) => Model.syncIndexes()));
};

export const teardownDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
};

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

let counter = 0;

export const registerUser = async (role = 'student', overrides = {}) => {
  counter += 1;
  const res = await api.post('/api/auth/register').send({
    name: `${role} user ${counter}`,
    email: `${role}${counter}@example.test`,
    password: PASSWORD,
    role,
    ...overrides,
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data;
};

// Admins cannot register, so tests promote a registered user directly in the database.
export const createAdmin = async () => {
  const { user } = await registerUser('student');
  await User.updateOne({ _id: user._id }, { role: 'admin' });
  const res = await api.post('/api/auth/login').send({ email: user.email, password: PASSWORD });
  return res.body.data;
};

export const validCourse = (overrides = {}) => ({
  title: 'Intro to Testing APIs',
  description: 'A course about writing reliable automated API tests with Node.js.',
  category: 'Programming',
  level: 'Beginner',
  requirements: ['Basic JavaScript'],
  learningOutcomes: ['Write API tests'],
  ...overrides,
});

// Creates a course with one section and the given number of lessons, optionally published.
export const createCourseWithLessons = async (token, { lessons = 2, publish = true, course = {} } = {}) => {
  const courseRes = await api.post('/api/courses').set(bearer(token)).send(validCourse(course));
  const courseId = courseRes.body.data.course._id;

  const sectionRes = await api
    .post(`/api/courses/${courseId}/sections`)
    .set(bearer(token))
    .send({ title: 'Section One' });
  const sectionId = sectionRes.body.data.section._id;

  const lessonIds = [];
  for (let i = 0; i < lessons; i += 1) {
    const res = await api
      .post(`/api/sections/${sectionId}/lessons`)
      .set(bearer(token))
      .send({ title: `Lesson ${i + 1}`, videoUrl: 'https://www.youtube.com/watch?v=abc', duration: 10 });
    lessonIds.push(res.body.data.lesson._id);
  }

  if (publish) {
    await api.put(`/api/courses/${courseId}`).set(bearer(token)).send({ published: true });
  }

  return { courseId, sectionId, lessonIds };
};
