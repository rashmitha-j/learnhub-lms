import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Presentation } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import AuthLayout from './AuthLayout';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { homePathFor } from '../../utils/constants';

// Admin is intentionally not offered; the server also rejects it.
const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', description: 'Enroll in courses and track progress', icon: GraduationCap },
  { value: 'instructor', label: 'Instructor', description: 'Create and publish your own courses', icon: Presentation },
];

const validate = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Please enter a valid email';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain a letter and a number';
  }
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  return errors;
};

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate(homePathFor(user), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join LearnHub for free."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="form" onSubmit={onSubmit} noValidate>
        <Alert tone="error">{serverError}</Alert>

        <fieldset className="role-picker">
          <legend className="field-label">I want to join as</legend>
          <div className="role-options">
            {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
              <label key={value} className={`role-option ${form.role === value ? 'selected' : ''}`}>
                <input type="radio" name="role" value={value} checked={form.role === value} onChange={onChange} />
                <Icon size={22} aria-hidden="true" />
                <span className="role-option-label">{label}</span>
                <span className="role-option-desc">{description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input label="Full name" name="name" autoComplete="name" value={form.name} onChange={onChange} error={errors.name} maxLength={60} />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
        />
        <div className="form-row">
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number"
          />
          <Input
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={onChange}
            error={errors.confirmPassword}
          />
        </div>
        <Button type="submit" loading={submitting} block size="lg">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
