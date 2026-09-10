import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Building2, Feather, PawPrint, HandHeart, ClipboardList, Inbox, LogOut } from 'lucide-react';
import { sheltersApi } from '@/api/sheltersApi';
import { adoptionApi } from '@/api/adoptionApi';
import useApi from '@/hooks/useApi';
import PageHeader from '@/components/patterns/PageHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ACTIVE_APP_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'APPROVED'];

const REASON_INFO = {
  ADOPTED: { icon: Heart, label: 'Adopted' },
  TRANSFERRED: { icon: Building2, label: 'Transferred' },
  DECEASED: { icon: Feather, label: 'Deceased' },
  ESCAPED: { icon: PawPrint, label: 'Escaped' },
  RETURNED_TO_OWNER: { icon: HandHeart, label: 'Returned to owner' },
  OTHER: { icon: ClipboardList, label: 'Other' },
};

export default function DischargePage() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('ADOPTED');
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [feePaid, setFeePaid] = useState('');
  const [notes, setNotes] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shelterId, setShelterId] = useState(null);
  const [cats, setCats] = useState([]);

  useEffect(() => {
    sheltersApi.myDashboard().then((res) => setShelterId(res.data?.data?.shelter_id || null)).catch(() => {});
  }, []);

  useEffect(() => {
    if (shelterId) {
      sheltersApi.getCats(shelterId, { status: 'IN_SHELTER' }).then((res) => setCats(res.data?.data?.results || res.data?.data || [])).catch(() => {});
    }
  }, [shelterId]);

  const { data: appsData, loading: appsLoading } = useApi(() => adoptionApi.listApplications(), null, []);
  const applications = (Array.isArray(appsData) ? appsData : (appsData?.results || [])).filter((a) => ACTIVE_APP_STATUSES.includes(a.status));

  const set = (fn) => (e) => { fn(e.target.value); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (reason === 'ADOPTED' && !selectedApp) {
      setError("Select the adopter's request — a cat can only be discharged as adopted through an adoption request.");
      return;
    }
    if (reason !== 'ADOPTED' && !selectedCat) { setError('Please select a cat to discharge.'); return; }
    if (reason !== 'ADOPTED' && recipientPhone && !isValidPkMobile(recipientPhone)) {
      setError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX) or leave the recipient phone blank.');
      return;
    }
    setSaving(true);
    try {
      const payload = { reason, discharge_notes: notes };
      if (reason === 'ADOPTED') {
        payload.application = selectedApp;
        if (feePaid) payload.adoption_fee_paid = feePaid;
      } else {
        payload.cat_id = selectedCat;
        payload.recipient_name = recipientName;
        payload.recipient_phone = recipientPhone;
      }
      await sheltersApi.createDischarge('me', payload);
      navigate('/shelter/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to record discharge.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <PageHeader title="Cat discharge" description="Record a cat leaving the shelter" backTo="/shelter/dashboard" backLabel="Dashboard" />

      <Card className="mb-5">
        <CardHeader><CardTitle>Reason for discharge</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2.5">
            {Object.entries(REASON_INFO).map(([value, info]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setReason(value); setError(''); }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs font-semibold transition-colors',
                  reason === value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-surface-muted text-muted-foreground',
                )}
              >
                <info.icon className="size-5" />
                {info.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {reason === 'ADOPTED' && (
          <Card>
            <CardHeader><CardTitle>Adoption request</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border border-info/20 bg-info/10 p-3 text-sm text-info">
                A cat can only be discharged as adopted through a registered adopter's request. Pick the request below — confirming finalizes the adoption and hands the cat to that adopter.
              </div>

              {appsLoading && <LoadingSpinner text="Loading adoption requests…" />}

              {!appsLoading && applications.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Inbox className="size-10 text-muted-foreground" />
                  <p className="font-semibold text-foreground">No adoption requests yet.</p>
                  <p className="max-w-[340px] text-sm text-muted-foreground">
                    A registered adopter must apply for a cat before you can discharge it as adopted. Their requests appear here automatically.
                  </p>
                  <Button variant="secondary" size="sm" asChild><Link to="/shelter/applications">View adoption applications</Link></Button>
                </div>
              )}

              {!appsLoading && applications.length > 0 && (
                <div className="flex flex-col gap-3.5">
                  <div>
                    <Label htmlFor="dis-app">Select the adopter's request *</Label>
                    <NativeSelect id="dis-app" value={selectedApp} onChange={set(setSelectedApp)} className="mt-1.5">
                      <option value="">Choose a cat and adopter…</option>
                      {applications.map((a) => (
                        <option key={a.id} value={a.id}>{a.cat_name || 'Cat'} → {a.applicant_name || a.applicant_email} ({a.status.replace(/_/g, ' ').toLowerCase()})</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div>
                    <Label htmlFor="dis-fee">Adoption fee paid (optional)</Label>
                    <Input id="dis-fee" type="number" min="0" step="0.01" value={feePaid} onChange={set(setFeePaid)} placeholder="0" className="mt-1.5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {reason !== 'ADOPTED' && (
          <Card>
            <CardHeader><CardTitle>Cat & details</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div>
                <Label htmlFor="dis-cat">Cat (in shelter) *</Label>
                <NativeSelect id="dis-cat" value={selectedCat} onChange={set(setSelectedCat)} className="mt-1.5">
                  <option value="">Select a cat…</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}{c.breed_label ? ` — ${c.breed_label}` : ''}</option>)}
                </NativeSelect>
                {cats.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No cats are currently in your shelter.</p>}
              </div>

              {['TRANSFERRED', 'RETURNED_TO_OWNER'].includes(reason) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dis-rname">{reason === 'TRANSFERRED' ? 'Destination / recipient' : 'Owner name'}</Label>
                    <Input id="dis-rname" value={recipientName} onChange={set(setRecipientName)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="mt-1.5"><PhoneInput value={recipientPhone} onChange={(v) => { setRecipientPhone(v); setError(''); }} /></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={set(setNotes)} rows={3} placeholder="Any notes about this discharge…" />
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving || (reason === 'ADOPTED' && applications.length === 0)} className="h-11 w-full">
          {reason === 'ADOPTED' ? <Heart className="size-4" /> : <LogOut className="size-4" />}
          {saving ? 'Recording…' : reason === 'ADOPTED' ? 'Finalize adoption & discharge' : 'Record discharge'}
        </Button>
      </form>
    </div>
  );
}
