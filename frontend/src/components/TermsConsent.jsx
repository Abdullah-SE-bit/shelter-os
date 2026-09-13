import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * Required "I agree to the Terms & Conditions" checkbox used on the
 * sign-in and sign-up screens. The link opens the full Terms page in a new
 * tab so the user doesn't lose their form state.
 */
export default function TermsConsent({ checked, onChange, id = 'terms-consent' }) {
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <Label htmlFor={id} className="text-sm leading-relaxed font-normal text-muted-foreground">
        I have read and agree to the{' '}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
          Terms &amp; Conditions and Licensing Agreement.
        </Link>
      </Label>
    </div>
  );
}
