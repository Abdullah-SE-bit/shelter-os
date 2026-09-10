import { useEffect } from 'react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false, confirmLabel = 'Confirm' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(61,43,31,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: danger ? 'var(--cat-red-light)' : 'var(--cat-linen)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          marginBottom: '1.25rem',
        }}>
          {danger ? '⚠️' : '🐾'}
        </div>

        <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
