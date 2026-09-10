import { Link, useNavigate } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const EFFECTIVE_DATE = 'July 2026';

function Section({ n, title, children }) {
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <h2 style={{
        fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)',
        margin: '0 0 0.6rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem',
      }}>
        <span style={{ color: 'var(--cat-terra)', fontWeight: 900 }}>{n}.</span> {title}
      </h2>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.75 }}>
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  useDocumentTitle('Terms & Conditions');
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cat-cream)' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.5rem', background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--border-default)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px', background: 'linear-gradient(135deg, var(--cat-terra), var(--cat-rust))',
            borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
          }}>🐾</div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>CatConnect</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>PawTrack OS</div>
          </div>
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Create Account</Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
        {/* Hero */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(201,123,84,0.1)', border: '1px solid rgba(201,123,84,0.25)',
            borderRadius: '999px', padding: '0.375rem 1rem', marginBottom: '1rem',
          }}>
            <span>📜</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--cat-terra)' }}>Legal</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem', fontFamily: 'Playfair Display, serif' }}>
            Terms &amp; Conditions and Licensing Agreement
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Effective date: {EFFECTIVE_DATE} &middot; Please read these terms carefully before using CatConnect (PawTrack OS).
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface-raised)', border: '1px solid var(--border-default)',
          borderRadius: '18px', padding: '2rem 2.25rem', boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.75, marginTop: 0 }}>
            These Terms &amp; Conditions ("Terms") govern your access to and use of the CatConnect / PawTrack OS
            platform (the "Service"), a cat welfare, rescue, adoption and shelter-management system. By creating an
            account, signing in, or otherwise using the Service, you confirm that you have read, understood, and agree
            to be bound by these Terms and the Licensing Agreement below. If you do not agree, you may not use the Service.
          </p>

          <Section n="1" title="Acceptance of Terms">
            By checking the acceptance box during sign-up or sign-in, you enter into a binding agreement with the
            operators of CatConnect. If you are using the Service on behalf of an organization (such as a shelter or
            clinic), you represent that you are authorized to accept these Terms on its behalf.
          </Section>

          <Section n="2" title="Eligibility & Accounts">
            You must provide accurate, current, and complete information when registering and keep it up to date. You
            are responsible for safeguarding your credentials and for all activity under your account. Certain roles
            (Super Admin, Shelter Admin) are provisioned by administrators and are not available through self-registration.
            You must notify us promptly of any unauthorized use of your account.
          </Section>

          <Section n="3" title="Description of the Service">
            The Service provides tools for cat registration, medical and vaccination records, adoption applications,
            rescue coordination, lost &amp; found matching, volunteer and foster management, donations, inventory, and
            related analytics. Features vary by user role and may change over time as the Service evolves.
          </Section>

          <Section n="4" title="Acceptable Use">
            You agree not to: (a) submit false, misleading, or fraudulent information (including fake rescue, adoption,
            or lost/found reports); (b) misuse animal, donor, or personal data; (c) attempt to gain unauthorized access
            to any account, data, or system; (d) upload malicious code or disrupt the Service; or (e) use the Service
            for any unlawful purpose or in violation of the rights of others.
          </Section>

          <Section n="5" title="Animal Welfare, Adoption & Rescue Disclaimer">
            CatConnect is a coordination and record-keeping platform. It does not itself provide veterinary care,
            guarantee the health, temperament, or history of any animal, or guarantee the outcome of any adoption,
            rescue, foster, or discharge. Adoption approvals, discharges, and medical decisions are made by the
            relevant shelters, veterinarians, and users — not by the platform. Always seek qualified professional advice
            for the health and safety of animals in your care.
          </Section>

          <Section n="6" title="User Content & Data">
            You retain ownership of the content you submit (photos, descriptions, records). By submitting content, you
            grant the Service a non-exclusive, worldwide, royalty-free license to host, store, display, and process that
            content solely to operate and improve the Service. You are responsible for ensuring you have the rights to
            any content you upload and that it does not infringe the rights of others.
          </Section>

          <Section n="7" title="Privacy">
            We collect and process personal information (such as your name, email, date of birth, and contact details)
            to provide the Service, including authentication, email verification, and role-appropriate features. We do
            not sell your personal data. Account activity may be logged for security and auditing. Use of the Service
            constitutes consent to this processing.
          </Section>

          <Section n="8" title="Licensing Agreement">
            <p style={{ margin: '0 0 0.75rem' }}>
              Subject to your compliance with these Terms, you are granted a limited, non-exclusive, non-transferable,
              revocable license to access and use the Service for its intended cat-welfare purposes. This license does
              not permit you to copy, resell, sublicense, reverse-engineer, or create derivative works of the platform,
              except as allowed by applicable law.
            </p>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Third-party &amp; open-source components</p>
            <p style={{ margin: 0 }}>
              The Service is built with open-source software provided under their respective licenses, including React,
              Django, and Django REST Framework. Map features use Leaflet and map data &copy; OpenStreetMap contributors,
              provided under the Open Database License (ODbL). Those components remain the property of their respective
              owners and are used in accordance with their licenses.
            </p>
          </Section>

          <Section n="9" title="Intellectual Property">
            The CatConnect / PawTrack OS name, logo, design, and original software are the property of their owners and
            are protected by intellectual-property laws. Nothing in these Terms transfers ownership of the platform to you.
          </Section>

          <Section n="10" title="Termination">
            We may suspend or terminate your access to the Service if you violate these Terms or misuse the platform.
            You may stop using the Service at any time. Certain obligations (such as those relating to liability and
            intellectual property) survive termination.
          </Section>

          <Section n="11" title="Disclaimer & Limitation of Liability">
            The Service is provided "as is" and "as available" without warranties of any kind, whether express or
            implied. To the maximum extent permitted by law, the operators of CatConnect shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of, or inability to use, the Service.
          </Section>

          <Section n="12" title="Changes to These Terms">
            We may update these Terms from time to time. Material changes will be reflected by updating the effective
            date above. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
          </Section>

          <Section n="13" title="Contact">
            Questions about these Terms or the Licensing Agreement can be directed to the platform administrators through
            your shelter or organization contact, or via the support channel provided within the Service.
          </Section>

          <p style={{
            marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-default)',
            color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: 0,
          }}>
            By checking the acceptance box on the sign-up or sign-in screen, you acknowledge that you have read and
            agree to these Terms &amp; Conditions and the Licensing Agreement.
          </p>
        </div>

        {/* Back */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.75rem' }}>
          <button type="button" onClick={goBack} className="btn btn-secondary">← Go back</button>
        </div>
      </div>
    </div>
  );
}
