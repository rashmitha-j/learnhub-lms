import { useEffect, useState } from 'react';
import api from '../../api/client';

const LABELS = {
  loading: 'Checking API…',
  ok: 'API online',
  down: 'API unreachable',
};

// Small indicator that confirms the frontend can reach GET /api/health.
export default function ApiStatus() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    api
      .get('/health')
      .then(() => active && setStatus('ok'))
      .catch(() => active && setStatus('down'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <span className={`api-status api-status-${status}`} role="status">
      <span className="dot" aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
