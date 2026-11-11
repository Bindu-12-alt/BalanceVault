import { useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/format';

/**
 * Generic hook for async API calls with loading/error state.
 */
export const useApi = (apiFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, execute };
};

export default useApi;
