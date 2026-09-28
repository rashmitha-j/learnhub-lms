// Development seed script: `npm run seed` (from backend/).
// WARNING: wipes all LMS collections in the configured database before inserting sample data.
// The credentials below are fake, development-only placeholders.
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { recalculateProgress } from '../services/progressService.js';

if (env.isProduction && !process.argv.includes('--force')) {
  console.error('Refusing to seed: NODE_ENV is production. This script is for development only.');
  process.exit(1);
}

// Fake, development-only password shared by all seeded accounts (override with SEED_PASSWORD)
const DEV_PASSWORD = process.env.SEED_PASSWORD || 'Password123';

const USERS = [
  { key: 'admin', name: 'Ada Admin', email: 'admin@learnhub.dev', role: 'admin' },
  {
    key: 'instructor',
    name: 'Ivy Instructor',
    email: 'instructor@learnhub.dev',
    role: 'instructor',
    bio: 'Full-stack engineer who loves teaching practical, project-based courses.',
  },
  {
    key: 'instructor2',
    name: 'Omar Okafor',
    email: 'instructor2@learnhub.dev',
    role: 'instructor',
    bio: 'Data scientist and SQL enthusiast.',
  },
  { key: 'student', name: 'Sam Student', email: 'student@learnhub.dev', role: 'student' },
  { key: 'student2', name: 'Priya Patel', email: 'student2@learnhub.dev', role: 'student' },
];

// Public sample videos (YouTube) — replace freely
const VIDEO = {
  html: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
  css: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
  js: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
  react: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
  node: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
  python: 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
  sql: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
  mongo: 'https://www.youtube.com/watch?v=ExcRbA7fy_A',
  ml: 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
  cloud: 'https://www.youtube.com/watch?v=M988_fsOSWo',
};

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=60`;

const COURSES = [
  {
    instructor: 'instructor',
    title: 'Modern JavaScript from Scratch',
    description:
      'Learn the JavaScript fundamentals every web developer needs: variables, functions, arrays, objects, the DOM and asynchronous code with promises and async/await.',
    category: 'Programming',
    level: 'Beginner',
    thumbnail: img('photo-1579468118864-1b9ea3c0db4a'),
    requirements: ['A computer with a modern browser', 'No prior programming experience needed'],
    learningOutcomes: [
      'Write clean, modern JavaScript',
      'Manipulate the DOM to build interactive pages',
      'Work with asynchronous code using async/await',
    ],
    published: true,
    sections: [
      {
        title: 'Getting Started',
        lessons: [
          { title: 'Welcome to the course', duration: 5, videoUrl: VIDEO.js, description: 'What you will build and how the course is structured.' },
          { title: 'Variables and data types', duration: 18, videoUrl: VIDEO.js, description: 'let, const, strings, numbers, booleans, null and undefined.' },
        ],
        quiz: {
          title: 'JavaScript Basics Check',
          questions: [
            { question: 'Which keyword declares a block-scoped variable that cannot be reassigned?', options: ['var', 'let', 'const', 'static'], correctAnswer: 2 },
            { question: 'What does typeof null return?', options: ['"null"', '"object"', '"undefined"', '"number"'], correctAnswer: 1 },
            { question: 'Which of these is NOT a primitive type?', options: ['string', 'boolean', 'array', 'number'], correctAnswer: 2 },
          ],
        },
      },
      {
        title: 'Functions and Async Code',
        lessons: [
          { title: 'Functions and arrow functions', duration: 22, videoUrl: VIDEO.js, description: 'Declarations, expressions, arrow functions and scope.' },
          { title: 'Promises and async/await', duration: 25, videoUrl: VIDEO.js, description: 'Handle asynchronous work cleanly.' },
        ],
      },
    ],
  },
  {
    instructor: 'instructor',
    title: 'React for Beginners: Build Real Apps',
    description:
      'A hands-on introduction to React. Learn components, props, state, hooks and routing while building a complete single-page application.',
    category: 'Web Development',
    level: 'Intermediate',
    thumbnail: img('photo-1633356122544-f134324a6cee'),
    requirements: ['Comfortable with JavaScript fundamentals', 'Basic HTML and CSS'],
    learningOutcomes: [
      'Build reusable React components',
      'Manage state with hooks',
      'Add client-side routing with React Router',
    ],
    published: true,
    sections: [
      {
        title: 'React Fundamentals',
        lessons: [
          { title: 'What is React?', duration: 10, videoUrl: VIDEO.react },
          { title: 'Components and props', duration: 20, videoUrl: VIDEO.react },
          { title: 'State with useState', duration: 24, videoUrl: VIDEO.react },
        ],
      },
      {
        title: 'Building an App',
        lessons: [
          { title: 'Side effects with useEffect', duration: 19, videoUrl: VIDEO.react },
          { title: 'Routing with React Router', duration: 21, videoUrl: VIDEO.react },
        ],
        quiz: {
          title: 'React Hooks Quiz',
          passingScore: 60,
          questions: [
            { question: 'Which hook adds local state to a function component?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correctAnswer: 1 },
            { question: 'When does an effect with an empty dependency array run?', options: ['On every render', 'Only after the first render', 'Never', 'Only on unmount'], correctAnswer: 1 },
          ],
        },
      },
    ],
  },
  {
    instructor: 'instructor',
    title: 'Node.js & Express REST APIs',
    description:
      'Design and build production-style REST APIs with Node.js, Express and MongoDB, including authentication, validation and error handling.',
    category: 'Web Development',
    level: 'Intermediate',
    thumbnail: img('photo-1555066931-4365d14bab8c'),
    requirements: ['JavaScript fundamentals', 'Basic understanding of HTTP'],
    learningOutcomes: ['Structure an Express application', 'Secure APIs with JWT', 'Model data with Mongoose'],
    published: true,
    sections: [
      {
        title: 'Express Basics',
        lessons: [
          { title: 'Setting up an Express server', duration: 15, videoUrl: VIDEO.node },
          { title: 'Routing and middleware', duration: 22, videoUrl: VIDEO.node },
        ],
      },
      {
        title: 'Working with MongoDB',
        lessons: [{ title: 'Mongoose models and schemas', duration: 26, videoUrl: VIDEO.mongo }],
      },
    ],
  },
  {
    instructor: 'instructor2',
    title: 'SQL and Database Design Essentials',
    description:
      'Learn relational database design and SQL queries: SELECT, JOIN, GROUP BY, indexes and normalization with practical examples.',
    category: 'Database',
    level: 'Beginner',
    thumbnail: img('photo-1544383835-bda2bc66a55d'),
    requirements: ['No prior database experience needed'],
    learningOutcomes: ['Write SQL queries confidently', 'Design normalized schemas', 'Understand indexes'],
    published: true,
    sections: [
      {
        title: 'SQL Foundations',
        lessons: [
          { title: 'Relational databases explained', duration: 12, videoUrl: VIDEO.sql },
          { title: 'SELECT, WHERE and ORDER BY', duration: 20, videoUrl: VIDEO.sql },
          { title: 'JOINs in practice', duration: 25, videoUrl: VIDEO.sql },
        ],
        quiz: {
          title: 'SQL Fundamentals Quiz',
          questions: [
            { question: 'Which clause filters rows before grouping?', options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'], correctAnswer: 1 },
            { question: 'Which JOIN returns only matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], correctAnswer: 2 },
          ],
        },
      },
    ],
  },
  {
    instructor: 'instructor2',
    title: 'Python for Data Science',
    description:
      'Use Python, pandas and visualization libraries to clean, analyze and present data. Ideal first course for aspiring data analysts.',
    category: 'Data Science',
    level: 'Beginner',
    thumbnail: img('photo-1551288049-bebda4e38f71'),
    requirements: ['Basic computer skills'],
    learningOutcomes: ['Write Python scripts', 'Analyze data with pandas', 'Create charts'],
    published: true,
    sections: [
      {
        title: 'Python Basics',
        lessons: [
          { title: 'Installing Python and Jupyter', duration: 10, videoUrl: VIDEO.python },
          { title: 'Python syntax crash course', duration: 30, videoUrl: VIDEO.python },
        ],
      },
    ],
  },
  {
    instructor: 'instructor2',
    title: 'Machine Learning Foundations',
    description:
      'Understand core machine learning concepts: supervised vs unsupervised learning, regression, classification and model evaluation.',
    category: 'AI/ML',
    level: 'Advanced',
    thumbnail: img('photo-1555255707-c07966088b7b'),
    requirements: ['Python basics', 'High-school level math'],
    learningOutcomes: ['Explain key ML concepts', 'Train simple models', 'Evaluate model performance'],
    published: true,
    sections: [
      {
        title: 'Core Concepts',
        lessons: [
          { title: 'What is machine learning?', duration: 14, videoUrl: VIDEO.ml },
          { title: 'Regression vs classification', duration: 22, videoUrl: VIDEO.ml },
        ],
      },
    ],
  },
  {
    instructor: 'instructor',
    title: 'Cloud Computing Fundamentals (Draft)',
    description:
      'An introduction to cloud computing concepts, service models and deploying your first application. This course is still being prepared.',
    category: 'Cloud',
    level: 'Beginner',
    thumbnail: img('photo-1451187580459-43490279c0fa'),
    requirements: ['Basic web development knowledge'],
    learningOutcomes: ['Understand IaaS, PaaS and SaaS', 'Deploy a simple web app'],
    published: false,
    sections: [
      {
        title: 'Cloud Basics',
        lessons: [{ title: 'What is the cloud?', duration: 12, videoUrl: VIDEO.cloud }],
      },
    ],
  },
];

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all(
    [User, Course, Section, Lesson, Enrollment, Quiz, QuizAttempt].map((Model) => Model.deleteMany({}))
  );

  // Ensure indexes (e.g. unique email, unique enrollment) exist after clearing
  await Promise.all([User, Enrollment].map((Model) => Model.syncIndexes()));

  const users = {};
  for (const { key, ...data } of USERS) {
    // Saved one by one so the password hashing hook runs
    users[key] = await User.create({ ...data, password: DEV_PASSWORD });
  }

  const courses = [];
  for (const { instructor, sections, ...courseData } of COURSES) {
    const course = await Course.create({
      ...courseData,
      instructor: users[instructor]._id,
      publishedAt: courseData.published ? new Date() : null,
    });
    const lessons = [];

    for (const [sectionIndex, sectionData] of sections.entries()) {
      const section = await Section.create({ course: course._id, title: sectionData.title, order: sectionIndex });
      const created = await Lesson.insertMany(
        sectionData.lessons.map((lesson, order) => ({ ...lesson, order, section: section._id, course: course._id }))
      );
      lessons.push(...created);

      if (sectionData.quiz) {
        await Quiz.create({ ...sectionData.quiz, course: course._id, section: section._id });
      }
    }
    courses.push({ course, lessons });
  }

  // Sample enrollments: student is partway through JS, finished SQL; student2 just started React
  const [js, react, , sql] = courses;
  await Enrollment.create([
    { student: users.student._id, course: js.course._id, completedLessons: js.lessons.slice(0, 2).map((l) => l._id), lastLesson: js.lessons[1]._id },
    { student: users.student._id, course: react.course._id },
    { student: users.student._id, course: sql.course._id, completedLessons: sql.lessons.map((l) => l._id), lastLesson: sql.lessons.at(-1)._id },
    { student: users.student2._id, course: react.course._id, completedLessons: [react.lessons[0]._id], lastLesson: react.lessons[0]._id },
  ]);
  await Promise.all(courses.map(({ course }) => recalculateProgress(course._id)));

  console.log('\nSeed complete.');
  console.log(`  Users: ${USERS.length}, courses: ${COURSES.length} (1 draft), enrollments: 4`);
  console.log('\nDevelopment-only accounts (see README for the shared dev password):');
  for (const { email, role } of USERS) console.log(`  ${role.padEnd(10)} ${email}`);

  await disconnectDB();
};

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await disconnectDB();
  process.exit(1);
});
