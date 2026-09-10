import { Link } from 'react-router-dom';

// Temporary social links — these just open the platforms' sites in a new tab.
// Swap the href values for the real profile URLs when available.
const SOCIALS = [
  { label: 'Facebook',  glyph: 'f',  href: 'https://www.facebook.com',  bg: '#1877F2' },
  { label: 'Instagram', glyph: '📷', href: 'https://www.instagram.com', bg: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' },
  { label: 'X',         glyph: '𝕏',  href: 'https://twitter.com',        bg: '#111111' },
  { label: 'YouTube',   glyph: '▶',  href: 'https://www.youtube.com',    bg: '#FF0000' },
];

// TODO: replace these placeholder contact details with the real ones.
const CONTACT = {
  email: 'hello@catconnect.org',
  phone: '+92 300 1234567',
  address: 'Cat Welfare Network, Islamabad, Pakistan',
};

function FooterLink({ to, href, children }) {
  const style = {
    color: 'rgba(255,255,255,0.72)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
  };
  const onOver = (e) => { e.currentTarget.style.color = '#fff'; };
  const onOut = (e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; };

  if (to) {
    return <Link to={to} style={style} onMouseOver={onOver} onMouseOut={onOut}>{children}</Link>;
  }
  const isWeb = href?.startsWith('http');
  return (
    <a
      href={href}
      {...(isWeb ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      style={style}
      onMouseOver={onOver}
      onMouseOut={onOut}
    >
      {children}
    </a>
  );
}

const headingStyle = {
  fontSize: '0.78rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  color: '#fff',
  margin: '0 0 1rem',
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'linear-gradient(135deg, var(--cat-espresso), var(--cat-brown))', color: 'rgba(255,255,255,0.78)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '2.5rem' }}>
          {/* Brand + about + social */}
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.9rem' }}>
              <div style={{
                width: '42px', height: '42px', background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
              }}>🐾</div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>CatConnect</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>PawTrack OS</div>
              </div>
            </div>

            <p style={{ margin: '0 0 0.75rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', fontFamily: 'Playfair Display, serif', fontSize: '0.95rem' }}>
              "Every cat deserves a loving home."
            </p>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', lineHeight: 1.7 }}>
              CatConnect is a cat-welfare platform connecting shelters, vets, volunteers, and adopters to rescue, care
              for, and rehome cats in need.
            </p>

            {/* Social */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  aria-label={s.label}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', background: s.bg, color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)', transition: 'transform 0.15s',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  {s.glyph}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 style={headingStyle}>Contact</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <FooterLink href={`mailto:${CONTACT.email}`}>✉️ {CONTACT.email}</FooterLink>
              <FooterLink href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>📞 {CONTACT.phone}</FooterLink>
              <div style={{ display: 'flex', gap: '0.45rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>
                <span>📍</span><span>{CONTACT.address}</span>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 style={headingStyle}>Legal</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <FooterLink to="/terms">Terms &amp; Conditions</FooterLink>
              <FooterLink to="/terms">Licensing Agreement</FooterLink>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
            © {year} CatConnect · PawTrack OS. All rights reserved.
          </span>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
            Made with 🐾 for cats in need
          </span>
        </div>
      </div>
    </footer>
  );
}
