export default function PageHeader({ title, subtitle, action, backPath, onBack }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '1.75rem',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <div>
        {(backPath || onBack) && (
          <a
            href={backPath || '#'}
            onClick={onBack ? (e) => { e.preventDefault(); onBack(); } : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              marginBottom: '0.5rem',
              transition: 'color 0.2s',
            }}
          >
            ← Back
          </a>
        )}
        <h1 style={{
          margin: 0,
          fontSize: '1.625rem',
          fontWeight: 900,
          color: 'var(--text-primary)',
          lineHeight: 1.15,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            margin: '0.375rem 0 0',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>{action}</div>
      )}
    </div>
  );
}
