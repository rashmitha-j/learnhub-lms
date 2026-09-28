import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { getEmbedUrl } from '../../utils/video';

const isHttpUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export default function LessonFormModal({ lesson, sectionTitle, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    videoUrl: lesson?.videoUrl || '',
    duration: lesson?.duration ?? '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (form.title.trim().length < 2) next.title = 'Title must be at least 2 characters';
    if (!isHttpUrl(form.videoUrl.trim())) next.videoUrl = 'Enter a valid http(s) video URL';
    const duration = form.duration === '' ? 0 : Number(form.duration);
    if (!Number.isInteger(duration) || duration < 0 || duration > 1440) next.duration = 'Enter whole minutes (0-1440)';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setServerError('');
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        videoUrl: form.videoUrl.trim(),
        duration,
      });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSaving(false);
    }
  };

  const embeddable = form.videoUrl && getEmbedUrl(form.videoUrl.trim());

  return (
    <Modal
      open
      title={lesson ? 'Edit lesson' : `Add lesson${sectionTitle ? ` to “${sectionTitle}”` : ''}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="lesson-form" loading={saving}>
            {lesson ? 'Save lesson' : 'Add lesson'}
          </Button>
        </>
      }
    >
      <form id="lesson-form" className="form" onSubmit={submit} noValidate>
        <Alert tone="error">{serverError}</Alert>
        <Input label="Lesson title" value={form.title} onChange={setField('title')} error={errors.title} maxLength={120} autoFocus />
        <Input
          label="Video URL"
          value={form.videoUrl}
          onChange={setField('videoUrl')}
          error={errors.videoUrl}
          placeholder="https://www.youtube.com/watch?v=…"
          hint={
            form.videoUrl && !errors.videoUrl
              ? embeddable
                ? 'YouTube/Vimeo link detected — it will play inside the lesson.'
                : 'This link will open in a new tab for students.'
              : 'YouTube and Vimeo links play inline; other links open externally.'
          }
        />
        <Input
          label="Duration (minutes)"
          type="number"
          min={0}
          max={1440}
          value={form.duration}
          onChange={setField('duration')}
          error={errors.duration}
        />
        <Input
          label="Description (optional)"
          multiline
          rows={4}
          value={form.description}
          onChange={setField('description')}
          error={errors.description}
          maxLength={5000}
        />
      </form>
    </Modal>
  );
}
