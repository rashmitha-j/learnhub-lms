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
} from './helpers.js';

let instructor;
let otherInstructor;
let student;
let otherStudent;
let admin;
let course; // { courseId, sectionId, lessonIds }

before(async () => {
  await setupDatabase();
  instructor = await registerUser('instructor');
  otherInstructor = await registerUser('instructor');
  student = await registerUser('student');
  otherStudent = await registerUser('student');
  admin = await createAdmin();
  course = await createCourseWithLessons(instructor.token, { lessons: 3 });
});
after(teardownDatabase);

describe('Enrollment', () => {
  it('enrolls a student in a published course', async () => {
    const res = await api.post(`/api/courses/${course.courseId}/enroll`).set(bearer(student.token));
    assert.equal(res.status, 201);
    assert.equal(res.body.data.enrollment.progress, 0);
  });

  it('blocks duplicate enrollment with 409', async () => {
    const res = await api.post(`/api/courses/${course.courseId}/enroll`).set(bearer(student.token));
    assert.equal(res.status, 409);
  });

  it('only lets students enroll', async () => {
    const res = await api.post(`/api/courses/${course.courseId}/enroll`).set(bearer(instructor.token));
    assert.equal(res.status, 403);
  });

  it('does not allow enrolling in a draft course', async () => {
    const draft = await createCourseWithLessons(instructor.token, { publish: false, course: { title: 'Draft Only Course' } });
    const res = await api.post(`/api/courses/${draft.courseId}/enroll`).set(bearer(student.token));
    assert.equal(res.status, 404);
  });

  it('gives enrolled students full course content including video URLs', async () => {
    const res = await api.get(`/api/courses/${course.courseId}/content`).set(bearer(student.token));
    assert.equal(res.status, 200);
    assert.equal(res.body.data.curriculum.totalLessons, 3);
    assert.ok(res.body.data.curriculum.sections[0].lessons[0].videoUrl);

    const lesson = await api.get(`/api/lessons/${course.lessonIds[0]}`).set(bearer(student.token));
    assert.equal(lesson.status, 200);
  });

  it('keeps other students out of the content', async () => {
    const res = await api.get(`/api/courses/${course.courseId}/content`).set(bearer(otherStudent.token));
    assert.equal(res.status, 403);
  });

  it('shows the enrollment in the course details and in My Courses', async () => {
    const details = await api.get(`/api/courses/${course.courseId}`).set(bearer(student.token));
    assert.ok(details.body.data.enrollment);

    const mine = await api.get('/api/enrollments/me').set(bearer(student.token));
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.enrollments.length, 1);
    assert.equal(mine.body.data.enrollments[0].totalLessons, 3);
    assert.ok(mine.body.data.enrollments[0].course.title);
  });

  it('returns 404 for a course the student is not enrolled in', async () => {
    const res = await api.get(`/api/enrollments/${course.courseId}`).set(bearer(otherStudent.token));
    assert.equal(res.status, 404);
  });

  it('lets only the owner or an admin see enrolled students', async () => {
    const owner = await api.get(`/api/courses/${course.courseId}/students`).set(bearer(instructor.token));
    assert.equal(owner.status, 200);
    assert.equal(owner.body.data.enrollments.length, 1);
    assert.equal(owner.body.data.enrollments[0].student.email, student.user.email);

    const other = await api.get(`/api/courses/${course.courseId}/students`).set(bearer(otherInstructor.token));
    assert.equal(other.status, 403);

    const asAdmin = await api.get(`/api/courses/${course.courseId}/students`).set(bearer(admin.token));
    assert.equal(asAdmin.status, 200);
    const adminList = await api.get('/api/admin/enrollments').set(bearer(admin.token));
    assert.equal(adminList.body.data.pagination.total, 1);
  });
});

describe('Progress tracking', () => {
  const complete = (lessonId, token = student.token, courseId = course.courseId) =>
    api.post(`/api/enrollments/${courseId}/lessons/${lessonId}/complete`).set(bearer(token));

  it('marks a lesson complete and calculates progress on the server', async () => {
    const res = await complete(course.lessonIds[0]);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.enrollment.progress, 33);
    assert.equal(res.body.data.enrollment.completedCount, 1);
    assert.equal(res.body.data.enrollment.totalLessons, 3);
    assert.equal(res.body.data.enrollment.lastLesson, course.lessonIds[0]);
  });

  it('does not double-count a completed lesson', async () => {
    const res = await complete(course.lessonIds[0]);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.alreadyCompleted, true);
    assert.equal(res.body.data.enrollment.completedCount, 1);
    assert.equal(res.body.data.enrollment.progress, 33);
  });

  it('ignores client-supplied progress values', async () => {
    const res = await api
      .post(`/api/enrollments/${course.courseId}/lessons/${course.lessonIds[1]}/complete`)
      .set(bearer(student.token))
      .send({ progress: 100, completed: true });
    assert.equal(res.body.data.enrollment.progress, 66);
    assert.equal(res.body.data.enrollment.completed, false);
  });

  it('rejects lessons from another course', async () => {
    const other = await createCourseWithLessons(otherInstructor.token, { lessons: 1, course: { title: 'Another Course Here' } });
    const res = await complete(other.lessonIds[0]);
    assert.equal(res.status, 404);
  });

  it('rejects completion when not enrolled', async () => {
    const res = await complete(course.lessonIds[0], otherStudent.token);
    assert.equal(res.status, 403);
  });

  it('marks the course completed with a timestamp when all lessons are done', async () => {
    const res = await complete(course.lessonIds[2]);
    assert.equal(res.body.data.enrollment.progress, 100);
    assert.equal(res.body.data.enrollment.completed, true);
    assert.ok(res.body.data.enrollment.completedAt);
  });

  it('recalculates progress when the instructor adds a lesson', async () => {
    await api
      .post(`/api/sections/${course.sectionId}/lessons`)
      .set(bearer(instructor.token))
      .send({ title: 'Bonus lesson', videoUrl: 'https://example.com/video' });

    const res = await api.get(`/api/enrollments/${course.courseId}`).set(bearer(student.token));
    assert.equal(res.body.data.enrollment.totalLessons, 4);
    assert.equal(res.body.data.enrollment.progress, 75);
    assert.equal(res.body.data.enrollment.completed, false);
    assert.equal(res.body.data.enrollment.completedAt, null);
  });

  it('recalculates progress when a completed lesson is deleted', async () => {
    const content = await api.get(`/api/courses/${course.courseId}/content`).set(bearer(instructor.token));
    const bonus = content.body.data.curriculum.sections[0].lessons.find((l) => l.title === 'Bonus lesson');
    await api.delete(`/api/lessons/${course.lessonIds[2]}`).set(bearer(instructor.token));

    const res = await api.get(`/api/enrollments/${course.courseId}`).set(bearer(student.token));
    // 2 of 3 remaining lessons complete (lesson 3 removed, bonus not done)
    assert.equal(res.body.data.enrollment.totalLessons, 3);
    assert.equal(res.body.data.enrollment.completedCount, 2);
    assert.equal(res.body.data.enrollment.progress, 66);

    const done = await complete(bonus._id);
    assert.equal(done.body.data.enrollment.completed, true);
  });
});

describe('Quizzes', () => {
  let quizId;
  let questions;

  const quizPayload = {
    title: 'Chapter One Quiz',
    passingScore: 50,
    questions: [
      { question: 'What is 2 + 2?', options: ['3', '4', '5'], correctAnswer: 1 },
      { question: 'Capital of France?', options: ['Paris', 'Rome'], correctAnswer: 0 },
      { question: 'Largest planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswer: 2 },
      { question: 'Which is a color?', options: ['Blue', 'Seven'], correctAnswer: 0 },
    ],
  };

  it('lets the owner create a quiz', async () => {
    const res = await api
      .post(`/api/courses/${course.courseId}/quizzes`)
      .set(bearer(instructor.token))
      .send({ ...quizPayload, section: course.sectionId });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.quiz.questions.length, 4);
    quizId = res.body.data.quiz._id;
  });

  it('validates quiz questions', async () => {
    const res = await api
      .post(`/api/courses/${course.courseId}/quizzes`)
      .set(bearer(instructor.token))
      .send({ title: 'Bad quiz', questions: [{ question: 'Only one option?', options: ['A'], correctAnswer: 3 }] });
    assert.equal(res.status, 400);
  });

  it('blocks non-owners from creating or editing quizzes', async () => {
    const create = await api
      .post(`/api/courses/${course.courseId}/quizzes`)
      .set(bearer(otherInstructor.token))
      .send(quizPayload);
    const update = await api.put(`/api/quizzes/${quizId}`).set(bearer(otherInstructor.token)).send({ title: 'Hijacked' });
    const asStudent = await api.put(`/api/quizzes/${quizId}`).set(bearer(student.token)).send({ title: 'Hijacked' });
    assert.deepEqual([create.status, update.status, asStudent.status], [403, 403, 403]);
  });

  it('never sends correct answers to students before submission', async () => {
    const res = await api.get(`/api/quizzes/${quizId}`).set(bearer(student.token));
    assert.equal(res.status, 200);
    questions = res.body.data.quiz.questions;
    assert.equal(questions.length, 4);
    assert.ok(!JSON.stringify(res.body).includes('correctAnswer'));

    // Course content lists quizzes as summaries only
    const content = await api.get(`/api/courses/${course.courseId}/content`).set(bearer(student.token));
    assert.ok(!JSON.stringify(content.body).includes('correctAnswer'));
    assert.equal(content.body.data.curriculum.sections[0].quizzes[0].questionCount, 4);
  });

  it('shows answers to the owner for editing', async () => {
    const res = await api.get(`/api/quizzes/${quizId}`).set(bearer(instructor.token));
    assert.equal(res.body.data.quiz.questions[0].correctAnswer, 1);
  });

  it('keeps unenrolled students out of the quiz', async () => {
    const view = await api.get(`/api/quizzes/${quizId}`).set(bearer(otherStudent.token));
    const submit = await api.post(`/api/quizzes/${quizId}/submit`).set(bearer(otherStudent.token)).send({ answers: [] });
    assert.equal(view.status, 403);
    assert.equal(submit.status, 403);
  });

  it('scores submissions on the server and ignores a client score', async () => {
    const answers = [
      { questionId: questions[0]._id, selectedOption: 1 }, // correct
      { questionId: questions[1]._id, selectedOption: 1 }, // wrong
      { questionId: questions[2]._id, selectedOption: 2 }, // correct
      // question 4 left unanswered
    ];
    const res = await api
      .post(`/api/quizzes/${quizId}/submit`)
      .set(bearer(student.token))
      .send({ answers, score: 100, passed: true });
    assert.equal(res.status, 201);
    const { attempt } = res.body.data;
    assert.equal(attempt.score, 50);
    assert.equal(attempt.correctCount, 2);
    assert.equal(attempt.totalQuestions, 4);
    assert.equal(attempt.passed, true);
    assert.equal(attempt.answers[3].selectedOption, null);
    assert.equal(attempt.answers[1].isCorrect, false);
  });

  it('treats out-of-range answers as incorrect', async () => {
    const answers = questions.map((q) => ({ questionId: q._id, selectedOption: 9 }));
    const res = await api.post(`/api/quizzes/${quizId}/submit`).set(bearer(student.token)).send({ answers });
    assert.equal(res.body.data.attempt.score, 0);
    assert.equal(res.body.data.attempt.passed, false);
  });

  it('only lets students submit', async () => {
    const res = await api.post(`/api/quizzes/${quizId}/submit`).set(bearer(instructor.token)).send({ answers: [] });
    assert.equal(res.status, 403);
  });

  it('shows students only their own results', async () => {
    await api.post(`/api/courses/${course.courseId}/enroll`).set(bearer(otherStudent.token));
    await api
      .post(`/api/quizzes/${quizId}/submit`)
      .set(bearer(otherStudent.token))
      .send({ answers: questions.map((q) => ({ questionId: q._id, selectedOption: 0 })) });

    const mine = await api.get(`/api/quizzes/${quizId}/results`).set(bearer(student.token));
    assert.equal(mine.status, 200);
    assert.equal(mine.body.data.attempts.length, 2);
    assert.ok(mine.body.data.attempts.every((a) => a.student._id === student.user._id));

    const recent = await api.get('/api/quiz-attempts/me').set(bearer(student.token));
    assert.equal(recent.body.data.attempts.length, 2);
    assert.ok(recent.body.data.attempts[0].quiz.title);
  });

  it('shows the owner every attempt, but not other instructors', async () => {
    const owner = await api.get(`/api/quizzes/${quizId}/results`).set(bearer(instructor.token));
    assert.equal(owner.body.data.attempts.length, 3);
    assert.equal(owner.body.data.canManage, true);

    const courseAttempts = await api.get(`/api/courses/${course.courseId}/quiz-attempts`).set(bearer(instructor.token));
    assert.equal(courseAttempts.body.data.attempts.length, 3);

    const other = await api.get(`/api/quizzes/${quizId}/results`).set(bearer(otherInstructor.token));
    assert.equal(other.status, 403);
  });

  it('updates questions and deletes the quiz with its attempts', async () => {
    const update = await api
      .put(`/api/quizzes/${quizId}`)
      .set(bearer(instructor.token))
      .send({ questions: [{ question: 'Replaced question?', options: ['Yes', 'No'], correctAnswer: 0 }] });
    assert.equal(update.status, 200);
    assert.equal(update.body.data.quiz.questions.length, 1);

    const del = await api.delete(`/api/quizzes/${quizId}`).set(bearer(instructor.token));
    assert.equal(del.status, 200);
    assert.equal((await api.get(`/api/quizzes/${quizId}`).set(bearer(instructor.token))).status, 404);
    const recent = await api.get('/api/quiz-attempts/me').set(bearer(student.token));
    assert.equal(recent.body.data.attempts.length, 0);
  });
});

describe('Dashboards', () => {
  it('returns instructor dashboard stats for own courses only', async () => {
    const res = await api.get('/api/instructor/dashboard').set(bearer(instructor.token));
    assert.equal(res.status, 200);
    const { stats } = res.body.data;
    assert.equal(stats.totalCourses, 2);
    assert.equal(stats.publishedCourses, 1);
    assert.equal(stats.draftCourses, 1);
    assert.equal(stats.totalStudents, 2);
    assert.equal(res.body.data.recentEnrollments.length, 2);
  });

  it('cascades course deletion to enrollments', async () => {
    const del = await api.delete(`/api/courses/${course.courseId}`).set(bearer(admin.token));
    assert.equal(del.status, 200);
    const mine = await api.get('/api/enrollments/me').set(bearer(student.token));
    assert.equal(mine.body.data.enrollments.length, 0);
  });
});
