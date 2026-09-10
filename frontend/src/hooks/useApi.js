import { useState, useEffect, useCallback } from 'react';

const useApi = (apiFn, params = null, deps = []) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const skip = !!params?.skip;

  const fetch = useCallback(async (overrideParams) => {
    if (skip && !overrideParams) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams ?? params);
      setData(res.data.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => {
    if (!skip) {
      fetch();
    } else {
      setLoading(false);
    }
  }, [fetch, skip]);

  return { data, loading, error, refetch: fetch };
};

export default useApi;

