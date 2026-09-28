import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getErrorMessage } from '../../api/client';
import { quizService } from '../../services/quizService';

const MAX_OPTIONS = 6;
const newQuestion = () => ({ question: '', options: ['', ''], correctAnswer: 0 });

const validateQuiz = (form) => {
  const errors = {};
  if (form.title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  const score = Number(form.passingScore);
  if (!Number.isInteger(score) || score < 0 || score > 100) errors.passingScore = 'Enter 0-100';
  if (form.questions.length === 0) errors.questions = 'Add at least one question';

  form.questions.forEach((q, i) => {
    if (q.question.trim().length < 3) errors[`q${i}`] = 'Question must be at least 3 characters';
    else if (q.options.some((o) => !o.trim())) errors[`q${i}`] = 'Options cannot be empty';
  });
  return errors;
};

// Create or edit a quiz. When editing, the full quiz (with answers) is fetched for the owner.
export default function QuizEditorModal({ quizId, courseId, sections, defaultSection, onSaved, onClose }) {
  const [form, setForm] = useState(
    quizId
      ? null
      : { title: '', description: '', section: defaultSection || '', passingScore: 70, questions: [newQuestion()] }
  );
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!quizId) return;
    quizService
      .get(quizId)
      .then(({ quiz }) =>
        setForm({
          title: quiz.title,
          description: quiz.description || '',
          section: quiz.section || '',
          passingScore: quiz.passingScore,
          questions: quiz.questions.map((q) => ({
            question: q.question,
            options: [...q.options],
            correctAnswer: q.correctAnswer,
          })),
        })
      )
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [quizId]);

  const updateQuestion = (index, updater) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? updater(q) : q)),
    }));

  const removeOption = (qIndex, oIndex) =>
    updateQuestion(qIndex, (q) => {
      const options = q.options.filter((_, i) => i !== oIndex);
      let correctAnswer = q.correctAnswer;
      if (oIndex === correctAnswer) correctAnswer = 0;
      else if (oIndex < correctAnswer) correctAnswer -= 1;
      return { ...q, options, correctAnswer };
    });

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validateQuiz(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setServerError('Please fix the highlighted fields.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      section: form.section || null,
      passingScore: Number(form.passingScore),
      questions: form.questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctAnswer: q.correctAnswer,
      })),
    };

    setSaving(true);
    setServerError('');
    try {
      if (quizId) await quizService.update(quizId, payload);
      else await quizService.create(courseId, payload);
      onSaved();
    } catch (err) {
      setServerError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title={quizId ? 'Edit quiz' : 'Create quiz'}
      onClose={onClose}
      footer={
        form && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="quiz-form" loading={saving}>
              {quizId ? 'Save quiz' : 'Create quiz'}
            </Button>
          </>
        )
      }
    >
      {loadError ? (
        <Alert tone="error">{loadError}</Alert>
      ) : !form ? (
        <LoadingSpinner label="Loading quiz…" />
      ) : (
        <form id="quiz-form" className="form" onSubmit={submit} noValidate>
          <Alert tone="error">{serverError}</Alert>
          <Input
            label="Quiz title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={errors.title}
            maxLength={120}
          />
          <Input
            label="Description (optional)"
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={1000}
          />
          <div className="form-row">
            <Select
              label="Placement"
              value={form.section}
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
              options={sections.map((s) => ({ value: s._id, label: `Section: ${s.title}` }))}
              placeholder="Course-level quiz"
            />
            <Input
              label="Passing score (%)"
              type="number"
              min={0}
              max={100}
              value={form.passingScore}
              onChange={(e) => setForm((f) => ({ ...f, passingScore: e.target.value }))}
              error={errors.passingScore}
            />
          </div>

          <div className="question-editor-list">
            {form.questions.map((q, qIndex) => (
              <div key={qIndex} className={`question-editor ${errors[`q${qIndex}`] ? 'has-error' : ''}`}>
                <div className="question-editor-head">
                  <strong>Question {qIndex + 1}</strong>
                  <Button
                    size="sm"
                    variant="ghost-danger"
                    icon={Trash2}
                    disabled={form.questions.length === 1}
                    onClick={() => setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== qIndex) }))}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  label="Question"
                  multiline
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, (prev) => ({ ...prev, question: e.target.value }))}
                  maxLength={1000}
                />
                <fieldset className="option-editor">
                  <legend className="field-label">Options — select the correct answer</legend>
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="option-editor-row">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctAnswer === oIndex}
                        onChange={() => updateQuestion(qIndex, (prev) => ({ ...prev, correctAnswer: oIndex }))}
                        aria-label={`Mark option ${oIndex + 1} as correct`}
                      />
                      <input
                        className="field-control"
                        value={option}
                        placeholder={`Option ${oIndex + 1}`}
                        maxLength={300}
                        aria-label={`Question ${qIndex + 1} option ${oIndex + 1}`}
                        onChange={(e) =>
                          updateQuestion(qIndex, (prev) => ({
                            ...prev,
                            options: prev.options.map((o, i) => (i === oIndex ? e.target.value : o)),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeOption(qIndex, oIndex)}
                        disabled={q.options.length <= 2}
                        aria-label={`Remove option ${oIndex + 1}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {q.options.length < MAX_OPTIONS && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Plus}
                      onClick={() => updateQuestion(qIndex, (prev) => ({ ...prev, options: [...prev.options, ''] }))}
                    >
                      Add option
                    </Button>
                  )}
                </fieldset>
                {errors[`q${qIndex}`] && <p className="field-error">{errors[`q${qIndex}`]}</p>}
              </div>
            ))}
          </div>
          {errors.questions && <p className="field-error">{errors.questions}</p>}
          <Button
            variant="outline"
            icon={Plus}
            disabled={form.questions.length >= 50}
            onClick={() => setForm((f) => ({ ...f, questions: [...f.questions, newQuestion()] }))}
          >
            Add question
          </Button>
        </form>
      )}
    </Modal>
  );
}
