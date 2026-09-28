import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../api/client';

// Runs an async request when `deps` change and tracks { data, loading, error, status }.
// `reload()` refetches while keeping the current data on screen; `setData` allows local updates.
export default function useApi(request, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null, status: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null, status: null }));

    request()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null, status: null });
      })
      .catch((error) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error: getErrorMessage(error),
            status: error?.response?.status ?? null,
          });
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const setData = useCallback(
    (updater) =>
      setState((prev) => ({
        ...prev,
        data: typeof updater === 'function' ? updater(prev.data) : updater,
      })),
    []
  );

  return { ...state, reload, setData };
}
