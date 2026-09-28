import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Save } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ListEditor from '../../components/course/ListEditor';
import CourseSteps from '../../components/course/CourseSteps';
import CourseThumbnail from '../../components/course/CourseThumbnail';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { courseService } from '../../services/courseService';
import { CATEGORIES, LEVELS } from '../../utils/constants';

const EMPTY = {
  title: '',
  description: '',
  category: '',
  level: '',
  thumbnail: '',
  requirements: [''],
  learningOutcomes: [''],
};

const isUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const validate = (form) => {
  const errors = {};
  const title = form.title.trim();
  const description = form.description.trim();
  if (title.length < 5 || title.length > 120) errors.title = 'Title must be 5-120 characters';
  if (description.length < 20) errors.description = 'Description must be at least 20 characters';
  if (!form.category) errors.category = 'Please choose a category';
  if (!form.level) errors.level = 'Please choose a level';
  if (form.thumbnail.trim() && !isUrl(form.thumbnail.trim())) errors.thumbnail = 'Enter a valid http(s) URL';
  return errors;
};

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  category: form.category,
  level: form.level,
  thumbnail: form.thumbnail.trim(),
  requirements: form.requirements.map((s) => s.trim()).filter(Boolean),
  learningOutcomes: form.learningOutcomes.map((s) => s.trim()).filter(Boolean),
});

const toForm = (course) =>
  course
    ? {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        thumbnail: course.thumbnail || '',
        requirements: course.requirements.length ? course.requirements : [''],
        learningOutcomes: course.learningOutcomes.length ? course.learningOutcomes : [''],
      }
    : EMPTY;

// Loads the course when editing, then renders the form with it as initial state.
export default function CourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit course' : 'Create course');
  const existing = useApi(() => (isEdit ? courseService.get(id) : Promise.resolve(null)), [id]);

  if (!isEdit) return <CourseForm />;
  if (existing.loading && !existing.data) return <LoadingSpinner label="Loading course…" />;
  if (existing.error) {
    return (
      <ErrorMessage
        title={existing.status === 404 ? 'Course not found' : 'Could not load course'}
        message={existing.error}
        action={<Button to="/instructor/courses">Back to my courses</Button>}
      />
    );
  }
  if (!existing.data.canManage) {
    return <ErrorMessage title="You can only edit your own courses" action={<Button to="/instructor/courses">Back</Button>} />;
  }

  return <CourseForm key={id} id={id} course={existing.data.course} />;
}

function CourseForm({ id, course }) {
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(() => toForm(course));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (name) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage({ tone: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (isEdit) {
        await courseService.update(id, toPayload(form));
        setMessage({ tone: 'success', text: 'Course details saved.' });
      } else {
        const { course } = await courseService.create(toPayload(form));
        navigate(`/instructor/courses/${course._id}/curriculum`, { state: { created: true } });
        return;
      }
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    }
    setSaving(false);
  };

  return (
    <>
      <PageHeader
        eyebrow={isEdit ? 'Edit course' : 'New course'}
        title={isEdit ? form.title || 'Edit course' : 'Create a course'}
        subtitle="Start with the essentials. You’ll add sections, lessons and quizzes in the next step."
      />
      <CourseSteps current="details" courseId={id} />

      <form className="course-form" onSubmit={onSubmit} noValidate>
        <Alert tone={message?.tone} onClose={() => setMessage(null)}>
          {message?.text}
        </Alert>

        <section className="card form">
          <h2>Basic information</h2>
          <Input
            label="Course title"
            value={form.title}
            onChange={setField('title')}
            error={errors.title}
            maxLength={120}
            placeholder="e.g. Modern JavaScript from Scratch"
          />
          <Input
            label="Description"
            multiline
            rows={5}
            value={form.description}
            onChange={setField('description')}
            error={errors.description}
            maxLength={5000}
            hint="Explain what the course covers and who it’s for."
          />
          <div className="form-row">
            <Select
              label="Category"
              value={form.category}
              onChange={setField('category')}
              options={CATEGORIES}
              placeholder="Select a category"
              error={errors.category}
            />
            <Select
              label="Level"
              value={form.level}
              onChange={setField('level')}
              options={LEVELS}
              placeholder="Select a level"
              error={errors.level}
            />
          </div>
        </section>

        <section className="card form">
          <h2>Thumbnail</h2>
          <div className="thumb-field">
            <Input
              label="Image URL"
              value={form.thumbnail}
              onChange={setField('thumbnail')}
              error={errors.thumbnail}
              placeholder="https://…"
              hint="Paste a link to an image (16:9 works best). Leave empty for a default placeholder."
            />
            <CourseThumbnail key={form.thumbnail} src={isUrl(form.thumbnail) ? form.thumbnail : ''} className="thumb-preview" />
          </div>
        </section>

        <section className="card form">
          <h2>Learning outcomes & requirements</h2>
          <div className="form-row form-row-top">
            <ListEditor
              label="What students will learn"
              items={form.learningOutcomes}
              onChange={setField('learningOutcomes')}
              placeholder="e.g. Build a REST API with Express"
              error={errors.learningOutcomes}
            />
            <ListEditor
              label="Requirements"
              items={form.requirements}
              onChange={setField('requirements')}
              placeholder="e.g. Basic JavaScript knowledge"
              error={errors.requirements}
            />
          </div>
        </section>

        <div className="form-actions sticky-actions">
          <Button variant="ghost" to={isEdit ? `/instructor/courses/${id}/curriculum` : '/instructor/courses'}>
            Cancel
          </Button>
          {isEdit ? (
            <>
              <Button type="submit" loading={saving} icon={Save}>
                Save changes
              </Button>
              <Button to={`/instructor/courses/${id}/curriculum`} variant="outline">
                Curriculum <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </>
          ) : (
            <Button type="submit" loading={saving}>
              Save & continue to curriculum <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
