export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: { outer: 32, border: 3, emoji: '1rem' },
    md: { outer: 56, border: 4, emoji: '1.5rem' },
    lg: { outer: 80, border: 5, emoji: '2rem' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: size === 'lg' ? '4rem' : '2rem',
      gap: '1rem',
    }}>
      <div style={{ position: 'relative', width: s.outer, height: s.outer }}>
        {/* Spinning ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${s.border}px solid var(--cat-linen)`,
          borderTopColor: 'var(--cat-terra)',
          borderRightColor: 'var(--cat-tan)',
          animation: 'spin 0.8s linear infinite',
        }} />
        {/* Cat paw center */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: s.emoji,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          🐾
        </div>
      </div>
      {text && (
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          fontWeight: 600,
          margin: 0,
        }}>
          {text}
        </p>
      )}
    </div>
  );
}
