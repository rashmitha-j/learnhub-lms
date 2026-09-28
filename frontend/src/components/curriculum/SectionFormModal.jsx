import { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { getErrorMessage } from '../../api/client';

export default function SectionFormModal({ section, onSubmit, onClose }) {
  const [title, setTitle] = useState(section?.title || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (title.trim().length < 2) {
      setError('Section title must be at least 2 characters');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({ title: title.trim() });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={section ? 'Rename section' : 'Add section'}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="section-form" loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id="section-form" className="form" onSubmit={submit} noValidate>
        <Alert tone="error">{error}</Alert>
        <Input label="Section title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus />
      </form>
    </Modal>
  );
}
