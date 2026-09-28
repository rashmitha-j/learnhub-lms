import { useState } from 'react';
import { KeyRound, Mail, Save, Calendar } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import useAuth from '../../hooks/useAuth';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { userService } from '../../services/userService';
import { formatDate } from '../../utils/format';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setErrors({ name: 'Name must be at least 2 characters' });
      return;
    }
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const { user: updated } = await userService.updateProfile({ name: form.name.trim(), bio: form.bio.trim() });
      setUser(updated);
      setMessage({ tone: 'success', text: 'Profile updated.' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit} noValidate>
      <h2>Profile details</h2>
      <Alert tone={message?.tone}>{message?.text}</Alert>
      <Input
        label="Full name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        error={errors.name}
        maxLength={60}
      />
      <Input label="Email" value={user.email} disabled hint="Email changes require verification, which isn’t available yet." />
      <Input
        label="Bio"
        multiline
        rows={4}
        value={form.bio}
        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        error={errors.bio}
        maxLength={500}
        hint={`${form.bio.length}/500 · ${user.role === 'instructor' ? 'Shown on your course pages.' : 'Tell others a little about yourself.'}`}
      />
      <div className="form-actions">
        <Button type="submit" loading={saving} icon={Save}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const empty = { currentPassword: '', newPassword: '', confirmPassword: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = 'Current password is required';
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      nextErrors.newPassword = 'At least 8 characters, with a letter and a number';
    }
    if (form.newPassword !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setMessage(null);
    try {
      await userService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      setMessage({ tone: 'success', text: 'Password updated.' });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setMessage({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={onSubmit} noValidate>
      <h2>Change password</h2>
      <Alert tone={message?.tone}>{message?.text}</Alert>
      <Input
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={onChange}
        error={errors.currentPassword}
      />
      <div className="form-row">
        <Input
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={form.newPassword}
          onChange={onChange}
          error={errors.newPassword}
        />
        <Input
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={onChange}
          error={errors.confirmPassword}
        />
      </div>
      <div className="form-actions">
        <Button type="submit" variant="outline" loading={saving} icon={KeyRound}>
          Update password
        </Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  useDocumentTitle('Profile');
  const { user } = useAuth();

  return (
    <>
      <PageHeader title="Profile" subtitle="Manage your account information." />
      <div className="profile-grid">
        <aside className="card profile-card">
          <Avatar name={user.name} size={80} />
          <h2>{user.name}</h2>
          <StatusBadge status={user.role} />
          <ul className="profile-meta">
            <li>
              <Mail size={16} aria-hidden="true" /> {user.email}
            </li>
            <li>
              <Calendar size={16} aria-hidden="true" /> Member since {formatDate(user.createdAt)}
            </li>
          </ul>
        </aside>
        <div className="stack">
          <ProfileForm />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}
