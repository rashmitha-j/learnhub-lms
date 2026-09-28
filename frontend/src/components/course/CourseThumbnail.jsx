import { useState } from 'react';
import { BookOpen } from 'lucide-react';

// Course image with a branded placeholder when the URL is missing or fails to load.
export default function CourseThumbnail({ src, title, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`thumb thumb-placeholder ${className}`} aria-hidden="true">
        <BookOpen size={32} />
      </div>
    );
  }

  return (
    <img
      className={`thumb ${className}`}
      src={src}
      alt={title ? `${title} thumbnail` : ''}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
