import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  api,
  bearer,
  createAdmin,
  createCourseWithLessons,
  registerUser,
  setupDatabase,
  teardownDatabase,
  validCourse,
} from './helpers.js';

let owner;
let otherInstructor;
let student;
let admin;

before(async () => {
  await setupDatabase();
  owner = await registerUser('instructor');
  otherInstructor = await registerUser('instructor');
  student = await registerUser('student');
  admin = await createAdmin();
});
after(teardownDatabase);

describe('Course CRUD and ownership', () => {
  let courseId;

  it('lets an instructor create a course, which starts as a draft', async () => {
    const res = await api.post('/api/courses').set(bearer(owner.token)).send(validCourse({ published: true }));
    assert.equal(res.status, 201);
    assert.equal(res.body.data.course.published, false);
    assert.equal(res.body.data.course.instructor, owner.user._id);
    courseId = res.body.data.course._id;
  });

  it('validates course fields', async () => {
    const res = await api
      .post('/api/courses')
      .set(bearer(owner.token))
      .send({ title: 'x', description: 'short', category: 'Cooking', level: 'Expert', thumbnail: 'ftp://x' });
    assert.equal(res.status, 400);
    const fields = res.body.details.map((d) => d.field);
    for (const f of ['title', 'description', 'category', 'level', 'thumbnail']) assert.ok(fields.includes(f), f);
  });

  it('requires authentication (401) and an instructor/admin role (403) to create', async () => {
    assert.equal((await api.post('/api/courses').send(validCourse())).status, 401);
    assert.equal((await api.post('/api/courses').set(bearer(student.token)).send(validCourse())).status, 403);
  });

  it('hides drafts from the public but shows them to the owner', async () => {
    assert.equal((await api.get(`/api/courses/${courseId}`)).status, 404);
    assert.equal((await api.get(`/api/courses/${courseId}`).set(bearer(student.token))).status, 404);

    const ownerView = await api.get(`/api/courses/${courseId}`).set(bearer(owner.token));
    assert.equal(ownerView.status, 200);
    assert.equal(ownerView.body.data.canManage, true);

    const list = await api.get('/api/courses');
    assert.ok(!list.body.data.courses.some((c) => c._id === courseId));
  });

  it('lets the owner update the course', async () => {
    const res = await api
      .put(`/api/courses/${courseId}`)
      .set(bearer(owner.token))
      .send({ title: 'Updated Course Title', level: 'Advanced' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.course.title, 'Updated Course Title');
    assert.equal(res.body.data.course.level, 'Advanced');
  });

  it('blocks another instructor from updating or deleting (403)', async () => {
    const put = await api.put(`/api/courses/${courseId}`).set(bearer(otherInstructor.token)).send({ title: 'Hijacked course' });
    const del = await api.delete(`/api/courses/${courseId}`).set(bearer(otherInstructor.token));
    assert.equal(put.status, 403);
    assert.equal(del.status, 403);
  });

  it('refuses to publish a course without lessons', async () => {
    const res = await api.put(`/api/courses/${courseId}`).set(bearer(owner.token)).send({ published: true });
    assert.equal(res.status, 400);
  });

  it('lets an admin manage any course', async () => {
    const res = await api.put(`/api/courses/${courseId}`).set(bearer(admin.token)).send({ category: 'Cloud' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.course.category, 'Cloud');
  });

  it('returns 400 for a malformed id and 404 for a missing course', async () => {
    assert.equal((await api.get('/api/courses/not-an-id')).status, 400);
    assert.equal((await api.get('/api/courses/0123456789abcdef01234567')).status, 404);
  });

  it('lets the owner delete the course', async () => {
    const res = await api.delete(`/api/courses/${courseId}`).set(bearer(owner.token));
    assert.equal(res.status, 200);
    assert.equal((await api.get(`/api/courses/${courseId}`).set(bearer(owner.token))).status, 404);
  });
});

describe('Sections and lessons', () => {
  let courseId;
  let sectionId;
  let lessonId;

  before(async () => {
    const res = await api.post('/api/courses').set(bearer(owner.token)).send(validCourse({ title: 'Curriculum Course' }));
    courseId = res.body.data.course._id;
  });

  it('creates sections with increasing order', async () => {
    const a = await api.post(`/api/courses/${courseId}/sections`).set(bearer(owner.token)).send({ title: 'Intro' });
    const b = await api.post(`/api/courses/${courseId}/sections`).set(bearer(owner.token)).send({ title: 'Advanced' });
    assert.equal(a.status, 201);
    assert.equal(a.body.data.section.order, 0);
    assert.equal(b.body.data.section.order, 1);
    sectionId = a.body.data.section._id;
  });

  it('blocks non-owners from creating, updating or deleting sections', async () => {
    const create = await api.post(`/api/courses/${courseId}/sections`).set(bearer(otherInstructor.token)).send({ title: 'Nope' });
    const update = await api.put(`/api/sections/${sectionId}`).set(bearer(otherInstructor.token)).send({ title: 'Nope' });
    const remove = await api.delete(`/api/sections/${sectionId}`).set(bearer(otherInstructor.token));
    const asStudent = await api.put(`/api/sections/${sectionId}`).set(bearer(student.token)).send({ title: 'Nope' });
    assert.deepEqual([create.status, update.status, remove.status, asStudent.status], [403, 403, 403, 403]);
  });

  it('updates a section title', async () => {
    const res = await api.put(`/api/sections/${sectionId}`).set(bearer(owner.token)).send({ title: 'Introduction' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.section.title, 'Introduction');
  });

  it('reorders sections and rejects incomplete lists', async () => {
    const content = await api.get(`/api/courses/${courseId}/content`).set(bearer(owner.token));
    const ids = content.body.data.curriculum.sections.map((s) => s._id);

    const bad = await api.patch(`/api/courses/${courseId}/sections/reorder`).set(bearer(owner.token)).send({ sectionIds: [ids[0]] });
    assert.equal(bad.status, 400);

    const res = await api
      .patch(`/api/courses/${courseId}/sections/reorder`)
      .set(bearer(owner.token))
      .send({ sectionIds: [...ids].reverse() });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.sections[0]._id, ids[1]);
  });

  it('creates, updates and reorders lessons', async () => {
    const create = await api
      .post(`/api/sections/${sectionId}/lessons`)
      .set(bearer(owner.token))
      .send({ title: 'First lesson', videoUrl: 'https://vimeo.com/123', duration: 12 });
    assert.equal(create.status, 201);
    assert.equal(create.body.data.lesson.course, courseId);
    lessonId = create.body.data.lesson._id;

    const second = await api
      .post(`/api/sections/${sectionId}/lessons`)
      .set(bearer(owner.token))
      .send({ title: 'Second lesson', videoUrl: 'https://vimeo.com/456' });
    assert.equal(second.body.data.lesson.order, 1);

    const update = await api.put(`/api/lessons/${lessonId}`).set(bearer(owner.token)).send({ title: 'Renamed lesson', duration: 15 });
    assert.equal(update.status, 200);
    assert.equal(update.body.data.lesson.duration, 15);

    const reorder = await api
      .patch(`/api/sections/${sectionId}/lessons/reorder`)
      .set(bearer(owner.token))
      .send({ lessonIds: [second.body.data.lesson._id, lessonId] });
    assert.equal(reorder.status, 200);
    assert.equal(reorder.body.data.lessons[0].title, 'Second lesson');
  });

  it('validates lessons', async () => {
    const res = await api
      .post(`/api/sections/${sectionId}/lessons`)
      .set(bearer(owner.token))
      .send({ title: 'x', videoUrl: 'javascript:alert(1)', duration: -5 });
    assert.equal(res.status, 400);
  });

  it('blocks non-owners from editing lessons', async () => {
    const update = await api.put(`/api/lessons/${lessonId}`).set(bearer(otherInstructor.token)).send({ title: 'Hijack' });
    const remove = await api.delete(`/api/lessons/${lessonId}`).set(bearer(otherInstructor.token));
    assert.equal(update.status, 403);
    assert.equal(remove.status, 403);
  });

  it('blocks unenrolled users from lesson content', async () => {
    const asStudent = await api.get(`/api/lessons/${lessonId}`).set(bearer(student.token));
    const content = await api.get(`/api/courses/${courseId}/content`).set(bearer(student.token));
    const anonymous = await api.get(`/api/lessons/${lessonId}`);
    assert.equal(asStudent.status, 403);
    assert.equal(content.status, 403);
    assert.equal(anonymous.status, 401);
  });

  it('deletes a lesson and a section', async () => {
    assert.equal((await api.delete(`/api/lessons/${lessonId}`).set(bearer(owner.token))).status, 200);
    assert.equal((await api.get(`/api/lessons/${lessonId}`).set(bearer(owner.token))).status, 404);
    assert.equal((await api.delete(`/api/sections/${sectionId}`).set(bearer(owner.token))).status, 200);

    const content = await api.get(`/api/courses/${courseId}/content`).set(bearer(owner.token));
    assert.equal(content.body.data.curriculum.sections.length, 1);
    assert.equal(content.body.data.curriculum.totalLessons, 0);
  });
});

describe('Public catalog: search, filters, pagination, details', () => {
  before(async () => {
    await createCourseWithLessons(owner.token, {
      course: { title: 'React Patterns Deep Dive', category: 'Web Development', level: 'Advanced' },
    });
    await createCourseWithLessons(owner.token, {
      course: { title: 'Pandas for Analysts', category: 'Data Science', level: 'Beginner' },
    });
    await createCourseWithLessons(otherInstructor.token, {
      course: { title: 'SQL Joins Explained', category: 'Database', level: 'Intermediate', description: 'Master relational joins with many practical examples.' },
    });
    await createCourseWithLessons(owner.token, { publish: false, course: { title: 'Secret Draft Course' } });
  });

  it('lists only published courses with stats and pagination', async () => {
    const res = await api.get('/api/courses');
    assert.equal(res.status, 200);
    const titles = res.body.data.courses.map((c) => c.title);
    assert.ok(!titles.includes('Secret Draft Course'));
    assert.equal(res.body.data.pagination.total, 3);
    const course = res.body.data.courses[0];
    assert.equal(course.lessonCount, 2);
    assert.equal(course.totalDuration, 20);
    assert.ok(course.instructor.name);
    assert.equal(course.instructor.email, undefined);
  });

  it('searches title and description case-insensitively', async () => {
    const byTitle = await api.get('/api/courses?search=react');
    const byDescription = await api.get('/api/courses?search=RELATIONAL');
    assert.deepEqual(byTitle.body.data.courses.map((c) => c.title), ['React Patterns Deep Dive']);
    assert.deepEqual(byDescription.body.data.courses.map((c) => c.title), ['SQL Joins Explained']);
  });

  it('treats regex characters in search literally', async () => {
    const res = await api.get('/api/courses?search=.*');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.courses.length, 0);
  });

  it('filters by category, level and instructor', async () => {
    const category = await api.get('/api/courses?category=Data%20Science');
    const level = await api.get('/api/courses?level=Intermediate');
    const instructor = await api.get(`/api/courses?instructor=${otherInstructor.user._id}`);
    assert.deepEqual(category.body.data.courses.map((c) => c.title), ['Pandas for Analysts']);
    assert.deepEqual(level.body.data.courses.map((c) => c.title), ['SQL Joins Explained']);
    assert.deepEqual(instructor.body.data.courses.map((c) => c.title), ['SQL Joins Explained']);
  });

  it('paginates results', async () => {
    const page1 = await api.get('/api/courses?limit=2&page=1&sort=title');
    const page2 = await api.get('/api/courses?limit=2&page=2&sort=title');
    assert.equal(page1.body.data.courses.length, 2);
    assert.equal(page2.body.data.courses.length, 1);
    assert.equal(page1.body.data.pagination.pages, 2);
    assert.equal(page1.body.data.courses[0].title, 'Pandas for Analysts');
  });

  it('rejects invalid filter values', async () => {
    assert.equal((await api.get('/api/courses?level=Expert')).status, 400);
    assert.equal((await api.get('/api/courses?limit=500')).status, 400);
  });

  it('returns course details with a curriculum preview but no video URLs', async () => {
    const list = await api.get('/api/courses?search=Pandas');
    const res = await api.get(`/api/courses/${list.body.data.courses[0]._id}`);
    assert.equal(res.status, 200);
    const lessons = res.body.data.curriculum.sections[0].lessons;
    assert.equal(lessons.length, 2);
    assert.ok(lessons.every((l) => l.title && l.videoUrl === undefined && l.description === undefined));
    assert.equal(res.body.data.canManage, false);
  });

  it('lists an instructor\'s own courses including drafts', async () => {
    const res = await api.get('/api/instructor/courses').set(bearer(owner.token));
    const titles = res.body.data.courses.map((c) => c.title);
    assert.ok(titles.includes('Secret Draft Course'));
    assert.ok(!titles.includes('SQL Joins Explained'));

    const drafts = await api.get('/api/instructor/courses?status=draft').set(bearer(owner.token));
    assert.ok(drafts.body.data.courses.every((c) => c.published === false));
  });
});
