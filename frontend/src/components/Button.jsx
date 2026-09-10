export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  as: Tag = 'button',
  to,
  href,
  ...props
}) {
  const classes = `btn btn-${variant} btn-${size === 'md' ? '' : size}`.trim();

  const content = (
    <>
      {loading && (
        <span style={{
          display: 'inline-block',
          width: '14px',
          height: '14px',
          border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </>
  );

  const style = fullWidth ? { width: '100%' } : {};

  if (Tag === 'a' || href) {
    return (
      <a href={href || to} className={classes} style={style} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      style={style}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
}
