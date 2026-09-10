import { useState } from 'react';

const usePagination = (pageSize = 20) => {
  const [page, setPage] = useState(1);

  const nextPage = () => setPage(p => p + 1);
  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const goTo     = (n) => setPage(n);
  const reset    = () => setPage(1);

  return { page, pageSize, nextPage, prevPage, goTo, reset };
};

export default usePagination;
