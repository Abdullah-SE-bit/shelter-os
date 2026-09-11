'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartHandshake, ScrollText, ChevronLeft } from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';

const EFFECTIVE_DATE = 'July 2026';

function Section({ n, title, children }) {
  return (
    <section className="mb-7">
      <h2 className="mb-2.5 flex items-baseline gap-2 text-[17px] font-bold text-foreground">
        <span className="font-extrabold text-primary">{n}.</span> {title}
      </h2>
      <div className="text-[15px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  useDocumentTitle('Terms & Conditions');
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-primary-foreground">
            <HeartHandshake className="size-[18px]" />
          </div>
          <div className="font-display text-[17px] font-bold text-foreground">Shelter OS</div>
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] px-6 pt-10 pb-16">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5">
            <ScrollText className="size-3.5 text-primary" />
            <span className="text-[13px] font-semibold text-primary">Legal</span>
          </div>
          <h1 className="font-display text-[32px] font-bold text-foreground">Terms &amp; Conditions and Licensing Agreement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Effective date: {EFFECTIVE_DATE} &middot; Please read these terms carefully before using Shelter OS.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-9 shadow-sm">
          <p className="mt-0 text-[15px] leading-relaxed text-muted-foreground">
            These Terms &amp; Conditions ("Terms") govern your access to and use of the Shelter OS platform (the
            "Service"), an animal welfare, rescue, adoption and shelter-management system. By creating an account,
            signing in, or otherwise using the Service, you confirm that you have read, understood, and agree to be
            bound by these Terms and the Licensing Agreement below. If you do not agree, you may not use the Service.
          </p>

          <Section n="1" title="Acceptance of Terms">
            By checking the acceptance box during sign-up or sign-in, you enter into a binding agreement with the
            operators of Shelter OS. If you are using the Service on behalf of an organization (such as a shelter or
            clinic), you represent that you are authorized to accept these Terms on its behalf.
          </Section>

          <Section n="2" title="Eligibility & Accounts">
            You must provide accurate, current, and complete information when registering and keep it up to date. You
            are responsible for safeguarding your credentials and for all activity under your account. Certain roles
            (Super Admin, Shelter Admin) are provisioned by administrators and are not available through
            self-registration. You must notify us promptly of any unauthorized use of your account.
          </Section>

          <Section n="3" title="Description of the Service">
            The Service provides tools for animal registration, medical and vaccination records, adoption
            applications, rescue coordination, lost &amp; found matching, volunteer and foster management, donations,
            inventory, and related analytics. Features vary by user role and may change over time as the Service
            evolves.
          </Section>

          <Section n="4" title="Acceptable Use">
            You agree not to: (a) submit false, misleading, or fraudulent information (including fake rescue,
            adoption, or lost/found reports); (b) misuse animal, donor, or personal data; (c) attempt to gain
            unauthorized access to any account, data, or system; (d) upload malicious code or disrupt the Service; or
            (e) use the Service for any unlawful purpose or in violation of the rights of others.
          </Section>

          <Section n="5" title="Animal Welfare, Adoption & Rescue Disclaimer">
            Shelter OS is a coordination and record-keeping platform. It does not itself provide veterinary care,
            guarantee the health, temperament, or history of any animal, or guarantee the outcome of any adoption,
            rescue, foster, or discharge. Adoption approvals, discharges, and medical decisions are made by the
            relevant shelters, veterinarians, and users — not by the platform. Always seek qualified professional
            advice for the health and safety of animals in your care.
          </Section>

          <Section n="6" title="User Content & Data">
            You retain ownership of the content you submit (photos, descriptions, records). By submitting content, you
            grant the Service a non-exclusive, worldwide, royalty-free license to host, store, display, and process
            that content solely to operate and improve the Service. You are responsible for ensuring you have the
            rights to any content you upload and that it does not infringe the rights of others.
          </Section>

          <Section n="7" title="Privacy">
            We collect and process personal information (such as your name, email, date of birth, and contact
            details) to provide the Service, including authentication, email verification, and role-appropriate
            features. We do not sell your personal data. Account activity may be logged for security and auditing.
            Use of the Service constitutes consent to this processing.
          </Section>

          <Section n="8" title="Licensing Agreement">
            <p className="mb-3">
              Subject to your compliance with these Terms, you are granted a limited, non-exclusive,
              non-transferable, revocable license to access and use the Service for its intended animal-welfare
              purposes. This license does not permit you to copy, resell, sublicense, reverse-engineer, or create
              derivative works of the platform, except as allowed by applicable law.
            </p>
            <p className="mb-2 font-semibold text-foreground">Third-party &amp; open-source components</p>
            <p className="mb-0">
              The Service is built with open-source software provided under their respective licenses, including
              React and Next.js. Map features use Leaflet and map data &copy; OpenStreetMap contributors, provided
              under the Open Database License (ODbL). Those components remain the property of their respective
              owners and are used in accordance with their licenses.
            </p>
          </Section>

          <Section n="9" title="Intellectual Property">
            The Shelter OS name, logo, design, and original software are the property of their owners and are
            protected by intellectual-property laws. Nothing in these Terms transfers ownership of the platform to
            you.
          </Section>

          <Section n="10" title="Termination">
            We may suspend or terminate your access to the Service if you violate these Terms or misuse the platform.
            You may stop using the Service at any time. Certain obligations (such as those relating to liability and
            intellectual property) survive termination.
          </Section>

          <Section n="11" title="Disclaimer & Limitation of Liability">
            The Service is provided "as is" and "as available" without warranties of any kind, whether express or
            implied. To the maximum extent permitted by law, the operators of Shelter OS shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of, or inability to use, the
            Service.
          </Section>

          <Section n="12" title="Changes to These Terms">
            We may update these Terms from time to time. Material changes will be reflected by updating the effective
            date above. Continued use of the Service after changes take effect constitutes acceptance of the revised
            Terms.
          </Section>

          <Section n="13" title="Contact">
            Questions about these Terms or the Licensing Agreement can be directed to the platform administrators
            through your shelter or organization contact, or via the support channel provided within the Service.
          </Section>

          <p className="mt-6 border-t border-border pt-5 text-[13px] leading-relaxed text-muted-foreground">
            By checking the acceptance box on the sign-up or sign-in screen, you acknowledge that you have read and
            agree to these Terms &amp; Conditions and the Licensing Agreement.
          </p>
        </div>

        <div className="mt-7 flex justify-center">
          <Button variant="secondary" onClick={goBack}>
            <ChevronLeft className="size-4" />
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}
