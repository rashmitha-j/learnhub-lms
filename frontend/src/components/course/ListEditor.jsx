import { Plus, X } from 'lucide-react';
import Button from '../ui/Button';

// Editable list of short strings (requirements, learning outcomes).
export default function ListEditor({ label, items, onChange, placeholder, max = 20, error }) {
  const update = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <span className="field-label">{label}</span>
      <div className="list-editor">
        {items.map((item, index) => (
          <div key={index} className="list-editor-row">
            <input
              className="field-control"
              value={item}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              aria-label={`${label} ${index + 1}`}
            />
            <button type="button" className="icon-btn" onClick={() => remove(index)} aria-label={`Remove ${label} ${index + 1}`}>
              <X size={16} />
            </button>
          </div>
        ))}
        {items.length < max && (
          <Button variant="ghost" size="sm" icon={Plus} onClick={() => onChange([...items, ''])}>
            Add item
          </Button>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
