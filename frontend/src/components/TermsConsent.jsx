import { Link } from 'react-router-dom';

/**
 * Required "I agree to the Terms & Conditions" checkbox used on the
 * sign-in and sign-up screens. The link opens the full Terms page in a new
 * tab so the user doesn't lose their form state.
 */
export default function TermsConsent({ checked, onChange, id = 'terms-consent' }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        cursor: 'pointer',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--cat-terra)', marginTop: '0.1rem', flexShrink: 0 }}
      />
      <span>
        I have read and agree to the{' '}
        <Link
          to="/terms"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--cat-terra)', fontWeight: 700, textDecoration: 'underline' }}
        >
          Terms &amp; Conditions and Licensing Agreement
        </Link>
        .
      </span>
    </label>
  );
}
