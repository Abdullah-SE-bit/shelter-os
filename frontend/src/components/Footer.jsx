import Link from 'next/link';
import { HeartHandshake, Mail, Phone, MapPin, Globe2, Camera, Video } from 'lucide-react';

const SOCIALS = [
  { label: 'Facebook', Icon: Globe2, href: 'https://www.facebook.com' },
  { label: 'Instagram', Icon: Camera, href: 'https://www.instagram.com' },
  { label: 'YouTube', Icon: Video, href: 'https://www.youtube.com' },
];

// TODO: replace these placeholder contact details with the real ones.
const CONTACT = {
  email: 'hello@shelteros.org',
  phone: '+92 300 1234567',
  address: 'Animal Welfare Network, Islamabad, Pakistan',
};

function FooterLink({ href, external, children }) {
  const className = 'flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white';
  if (external) {
    return (
      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'linear-gradient(135deg, var(--brand-ink), color-mix(in srgb, var(--brand-ink) 70%, black))' }}>
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="max-w-[360px]">
            <div className="mb-3.5 flex items-center gap-2.5">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-amber))' }}
              >
                <HeartHandshake className="size-5 text-white" />
              </div>
              <div className="font-display text-lg font-bold text-white">Shelter OS</div>
            </div>

            <p className="mb-3 text-sm text-white/85 italic">"Every animal deserves a loving home."</p>
            <p className="mb-5 text-sm leading-relaxed text-white/70">
              Shelter OS is an animal-welfare platform connecting shelters, employees, and adopters to
              rescue, care for, and rehome animals in need.
            </p>

            <div className="flex gap-2.5">
              {SOCIALS.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold tracking-wide text-white uppercase">Contact</h3>
            <div className="flex flex-col gap-2.5">
              <FooterLink href={`mailto:${CONTACT.email}`} external>
                <Mail className="size-4 shrink-0" />
                {CONTACT.email}
              </FooterLink>
              <FooterLink href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} external>
                <Phone className="size-4 shrink-0" />
                {CONTACT.phone}
              </FooterLink>
              <span className="flex items-start gap-2 text-sm text-white/70">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {CONTACT.address}
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold tracking-wide text-white uppercase">Legal</h3>
            <div className="flex flex-col gap-2.5">
              <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
              <FooterLink href="/terms">Licensing Agreement</FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-5">
          <span className="text-[13px] text-white/60">© {year} Shelter OS. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-[13px] text-white/60">
            Made with <HeartHandshake className="size-3.5" /> for animals in need
          </span>
        </div>
      </div>
    </footer>
  );
}
