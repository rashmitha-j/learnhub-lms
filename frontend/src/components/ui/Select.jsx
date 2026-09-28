import { useId } from 'react';

// `options` may be strings or { value, label } objects.
export default function Select({ label, error, id, options = [], placeholder, className = '', ...props }) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={`field ${error ? 'field-invalid' : ''} ${className}`}>
      {label && (
        <label htmlFor={selectId} className="field-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="field-control"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const { value, label: text } = typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
