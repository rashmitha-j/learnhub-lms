import { useId } from 'react';

// Labeled text input (or textarea with `multiline`) with error and hint text.
export default function Input({ label, error, hint, id, multiline = false, className = '', ...props }) {
  const autoId = useId();
  const inputId = id || autoId;
  const messageId = `${inputId}-message`;
  const Field = multiline ? 'textarea' : 'input';

  return (
    <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <Field
        id={inputId}
        className="field-control"
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        {...props}
      />
      {error ? (
        <p id={messageId} className="field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
