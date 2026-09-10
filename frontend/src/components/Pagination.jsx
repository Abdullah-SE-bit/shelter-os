export default function Pagination({ page, totalPages, total, pageSize, onPrev, onNext, onGoTo }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end   = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = {
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    border: '1.5px solid var(--border-default)',
    cursor: 'pointer',
    fontFamily: 'Nunito, sans-serif',
    fontWeight: 700,
    fontSize: '0.8125rem',
    transition: 'all 0.15s',
    lineHeight: 1,
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.375rem',
      marginTop: '2rem',
      flexWrap: 'wrap',
    }}>
      <button
        onClick={onPrev}
        disabled={page === 1}
        style={{
          ...btnBase,
          background: page === 1 ? 'var(--cat-linen)' : 'var(--surface-card)',
          color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
          opacity: page === 1 ? 0.5 : 1,
        }}
      >
        ←
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onGoTo?.(1)} style={{ ...btnBase, background: 'var(--surface-card)', color: 'var(--text-primary)' }}>1</button>
          {start > 2 && <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onGoTo?.(p)}
          style={{
            ...btnBase,
            background: p === page ? 'var(--cat-terra)' : 'var(--surface-card)',
            color: p === page ? 'white' : 'var(--text-primary)',
            borderColor: p === page ? 'var(--cat-terra)' : 'var(--border-default)',
            boxShadow: p === page ? '0 2px 8px rgba(201,123,84,0.3)' : 'none',
          }}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>}
          <button onClick={() => onGoTo?.(totalPages)} style={{ ...btnBase, background: 'var(--surface-card)', color: 'var(--text-primary)' }}>{totalPages}</button>
        </>
      )}

      <button
        onClick={onNext}
        disabled={page >= totalPages}
        style={{
          ...btnBase,
          background: page >= totalPages ? 'var(--cat-linen)' : 'var(--surface-card)',
          color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
          opacity: page >= totalPages ? 0.5 : 1,
        }}
      >
        →
      </button>

      {total !== undefined && (
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>
          {total} results
        </span>
      )}
    </div>
  );
}
