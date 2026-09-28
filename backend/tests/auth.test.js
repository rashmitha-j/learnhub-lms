import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {
  api,
  bearer,
  createAdmin,
  PASSWORD,
  registerUser,
  setupDatabase,
  teardownDatabase,
} from './helpers.js';

before(setupDatabase);
after(teardownDatabase);

describe('GET /api/health', () => {
  it('reports the API and database as healthy', async () => {
    const res = await api.get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.database, 'connected');
  });
});

describe('POST /api/auth/register', () => {
  it('registers a student without exposing the password', async () => {
    const res = await api.post('/api/auth/register').send({
      name: 'Stu Dent',
      email: '  Student.One@Example.TEST ',
      password: PASSWORD,
      role: 'student',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'student');
    assert.equal(res.body.data.user.email, 'student.one@example.test');
    assert.equal(res.body.data.user.password, undefined);
    assert.ok(res.body.data.token);
  });

  it('registers an instructor', async () => {
    const { user } = await registerUser('instructor');
    assert.equal(user.role, 'instructor');
  });

  it('defaults to the student role', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'No Role', email: 'norole@example.test', password: PASSWORD });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'student');
  });

  it('blocks admin self-registration with 403', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'Sneaky', email: 'sneaky@example.test', password: PASSWORD, role: 'admin' });
    assert.equal(res.status, 403);
  });

  it('rejects unknown roles, weak passwords and invalid emails with field details', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'short', role: 'superuser' });
    assert.equal(res.status, 400);
    const fields = res.body.details.map((d) => d.field);
    for (const field of ['name', 'email', 'password', 'role']) assert.ok(fields.includes(field), field);
  });

  it('rejects a duplicate email regardless of case', async () => {
    const res = await api
      .post('/api/auth/register')
      .send({ name: 'Dupe', email: 'STUDENT.ONE@example.test', password: PASSWORD });
    assert.equal(res.status, 409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await api
      .post('/api/auth/login')
      .send({ email: 'student.one@example.test', password: PASSWORD });
    assert.equal(res.status, 200);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.password, undefined);
  });

  it('uses the same generic error for wrong password and unknown email', async () => {
    const wrongPassword = await api
      .post('/api/auth/login')
      .send({ email: 'student.one@example.test', password: 'Wrongpass123' });
    const unknownEmail = await api
      .post('/api/auth/login')
      .send({ email: 'nobody@example.test', password: PASSWORD });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
  });

  it('rejects object payloads (NoSQL injection attempt)', async () => {
    const res = await api.post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    assert.equal(res.status, 400);
  });
});

describe('GET /api/auth/me and token handling', () => {
  it('returns the current user', async () => {
    const { token, user } = await registerUser('student');
    const res = await api.get('/api/auth/me').set(bearer(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user._id, user._id);
    assert.equal(res.body.data.user.password, undefined);
  });

  it('returns 401 without a token', async () => {
    const res = await api.get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('returns 401 for an invalid or forged token', async () => {
    const garbage = await api.get('/api/auth/me').set(bearer('not.a.token'));
    const forged = jwt.sign({ sub: '0123456789abcdef01234567', role: 'admin' }, 'wrong-secret');
    const forgedRes = await api.get('/api/auth/me').set(bearer(forged));
    assert.equal(garbage.status, 401);
    assert.equal(forgedRes.status, 401);
  });

  it('uses the role from the database, not the token', async () => {
    const { token } = await registerUser('student');
    const payload = jwt.decode(token);
    // A token signed with the real secret but claiming admin still gets the DB role
    const tampered = jwt.sign({ sub: payload.sub, role: 'admin' }, process.env.JWT_SECRET);
    const res = await api.get('/api/admin/stats').set(bearer(tampered));
    assert.equal(res.status, 403);
  });
});

describe('Role restrictions', () => {
  it('returns 403 when a student calls instructor or admin routes', async () => {
    const { token } = await registerUser('student');
    assert.equal((await api.get('/api/instructor/dashboard').set(bearer(token))).status, 403);
    assert.equal((await api.get('/api/admin/users').set(bearer(token))).status, 403);
    assert.equal((await api.post('/api/courses').set(bearer(token)).send({})).status, 403);
  });

  it('returns 403 when an instructor calls admin or student-only routes', async () => {
    const { token } = await registerUser('instructor');
    assert.equal((await api.get('/api/admin/stats').set(bearer(token))).status, 403);
    assert.equal((await api.get('/api/enrollments/me').set(bearer(token))).status, 403);
  });

  it('allows admins to use admin routes without exposing passwords', async () => {
    const { token } = await createAdmin();
    const stats = await api.get('/api/admin/stats').set(bearer(token));
    const users = await api.get('/api/admin/users?role=student').set(bearer(token));
    assert.equal(stats.status, 200);
    assert.ok(stats.body.data.stats.users.student >= 1);
    assert.equal(users.status, 200);
    assert.ok(users.body.data.users.every((u) => u.password === undefined && u.role === 'student'));
  });
});

describe('Profile', () => {
  it('updates name and bio but never email or role', async () => {
    const { token, user } = await registerUser('student');
    const res = await api
      .put('/api/users/me')
      .set(bearer(token))
      .send({ name: 'Renamed User', bio: 'Hello', email: 'hacker@example.test', role: 'admin' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.name, 'Renamed User');
    assert.equal(res.body.data.user.bio, 'Hello');
    assert.equal(res.body.data.user.email, user.email);
    assert.equal(res.body.data.user.role, 'student');
  });

  it('changes the password only with the correct current password', async () => {
    const { token, user } = await registerUser('student');
    const wrong = await api
      .put('/api/users/me/password')
      .set(bearer(token))
      .send({ currentPassword: 'Nottheone123', newPassword: 'Newpass1234' });
    assert.equal(wrong.status, 400);

    const ok = await api
      .put('/api/users/me/password')
      .set(bearer(token))
      .send({ currentPassword: PASSWORD, newPassword: 'Newpass1234' });
    assert.equal(ok.status, 200);

    const login = await api.post('/api/auth/login').send({ email: user.email, password: 'Newpass1234' });
    assert.equal(login.status, 200);
  });
});
