export default function EmptyState({ icon = '🐱', title, message, action, size = 'md' }) {
  const sizes = {
    sm: { iconSize: '2.5rem', titleSize: '1rem', msgSize: '0.85rem', padding: '2rem' },
    md: { iconSize: '4rem',   titleSize: '1.125rem', msgSize: '0.9rem', padding: '3rem' },
    lg: { iconSize: '5rem',   titleSize: '1.25rem', msgSize: '1rem', padding: '4rem' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: s.padding,
      gap: '1rem',
    }}>
      {/* Decorative circle */}
      <div style={{
        width: parseInt(s.iconSize) * 2.5 + 'px',
        height: parseInt(s.iconSize) * 2.5 + 'px',
        borderRadius: '50%',
        background: 'var(--cat-linen)',
        border: '2px dashed var(--cat-sand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: s.iconSize,
        animation: 'pawBounce 3s ease-in-out infinite',
      }}>
        {icon}
      </div>

      <div>
        <h3 style={{
          fontSize: s.titleSize,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 0.375rem',
        }}>
          {title}
        </h3>
        {message && (
          <p style={{
            fontSize: s.msgSize,
            color: 'var(--text-muted)',
            maxWidth: '380px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            {message}
          </p>
        )}
      </div>

      {action && <div style={{ marginTop: '0.25rem' }}>{action}</div>}

      {/* Decorative paw prints */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        opacity: 0.25,
        fontSize: '0.875rem',
        marginTop: '0.25rem',
      }}>
        🐾🐾🐾
      </div>
    </div>
  );
}
