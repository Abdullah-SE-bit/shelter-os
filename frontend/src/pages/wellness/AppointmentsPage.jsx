import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Stethoscope, Syringe, Scissors, ClipboardList, Siren, TriangleAlert, Check, X, Stethoscope as VetIcon, User, Cat } from 'lucide-react';
import { wellnessApi } from '@/api/wellnessApi';
import { catsApi } from '@/api/catsApi';
import { accountsApi } from '@/api/accountsApi';
import useApi from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const STATUS_TONE = { SCHEDULED: 'bg-info/10 text-info', CONFIRMED: 'bg-success/10 text-success', COMPLETED: 'bg-surface-muted text-muted-foreground', CANCELLED: 'bg-destructive/10 text-destructive', NO_SHOW: 'bg-warning/10 text-warning' };
const STATUS_BORDER = { SCHEDULED: 'border-l-info', CONFIRMED: 'border-l-success', COMPLETED: 'border-l-border', CANCELLED: 'border-l-destructive', NO_SHOW: 'border-l-warning' };
const TYPE_ICONS = { CHECKUP: Stethoscope, VACCINATION: Syringe, SURGERY: Scissors, FOLLOWUP: ClipboardList, EMERGENCY: Siren };

export default function AppointmentsPage() {
  const { user } = useAuth();
  const canBook = ['CAT_OWNER', 'SHELTER_ADMIN', 'VOLUNTEER', 'ADOPTER'].includes(user?.role);
  const isVet = user?.role === 'VET';

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [outcomeSummary, setOutcomeSummary] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: appointmentsData, loading, refetch } = useApi(() => wellnessApi.myAppointments());
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.results || []);

  const [bookForm, setBookForm] = useState({ cat: '', vet: '', appointment_type: 'CHECKUP', scheduled_at: '', notes: '' });

  const { data: catsData } = useApi(() => catsApi.list(), { skip: !canBook });
  const userCats = Array.isArray(catsData) ? catsData : (catsData?.results || []);

  const { data: vetsData } = useApi(() => accountsApi.list({ role: 'VET' }));
  const vets = Array.isArray(vetsData) ? vetsData : (vetsData?.results || []);

  const filteredAppointments = filterStatus === 'ALL' ? appointments : appointments.filter((a) => a.status === filterStatus);
  const upcomingAppointments = appointments.filter((a) => new Date(a.scheduled_at) >= new Date() && a.status !== 'CANCELLED' && a.status !== 'COMPLETED');

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await wellnessApi.createAppointment(bookForm);
      setBookModalOpen(false);
      setBookForm({ cat: '', vet: '', appointment_type: 'CHECKUP', scheduled_at: '', notes: '' });
      refetch();
    } catch (err) {
      console.error('Failed to book appointment:', err);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const handleConfirm = async () => {
    if (!selectedAppointment) return;
    try {
      await wellnessApi.confirm(selectedAppointment.id);
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
      refetch();
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;
    try {
      await wellnessApi.cancel(selectedAppointment.id, cancellationReason);
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      setCancellationReason('');
      refetch();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleComplete = async () => {
    if (!selectedAppointment) return;
    try {
      await wellnessApi.complete(selectedAppointment.id, { outcome_summary: outcomeSummary });
      setCompleteDialogOpen(false);
      setSelectedAppointment(null);
      setOutcomeSummary('');
      refetch();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  const AppointmentCard = ({ appointment }) => {
    const isPast = new Date(appointment.scheduled_at) < new Date();
    const isOpen = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';
    const canConfirm = isVet && appointment.status === 'SCHEDULED';
    const canComplete = isVet && isOpen;
    const canCancel = (isVet || canBook) && isOpen;
    const TypeIcon = TYPE_ICONS[appointment.appointment_type] || CalendarDays;

    return (
      <div className={cn('mb-3 rounded-xl border border-l-4 border-border bg-card p-5', STATUS_BORDER[appointment.status])}>
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted">
            <TypeIcon className="size-5 text-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-foreground">{appointment.appointment_type?.replace(/_/g, ' ')}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn('rounded-md px-2 py-0.5 text-xs font-bold', STATUS_TONE[appointment.status])}>{appointment.status}</span>
                  {isPast && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-warning"><TriangleAlert className="size-3.5" />Past due</span>
                  )}
                </div>
              </div>

              {isVet && (
                <div className="flex gap-2">
                  {canConfirm && <Button size="sm" onClick={() => { setSelectedAppointment(appointment); setConfirmDialogOpen(true); }}><Check className="size-3.5" />Confirm</Button>}
                  {canComplete && <Button size="sm" variant="secondary" onClick={() => { setSelectedAppointment(appointment); setCompleteDialogOpen(true); }}><Check className="size-3.5" />Complete</Button>}
                  {canCancel && <Button size="sm" variant="secondary" onClick={() => { setSelectedAppointment(appointment); setCancelDialogOpen(true); }}><X className="size-3.5" />Cancel</Button>}
                </div>
              )}
              {!isVet && canBook && canCancel && (
                <Button size="sm" variant="secondary" onClick={() => { setSelectedAppointment(appointment); setCancelDialogOpen(true); }}>Cancel</Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-0.5 text-xs text-muted-foreground">Scheduled</div>
                <div className="text-sm font-semibold text-foreground">{formatDateTime(appointment.scheduled_at)}</div>
              </div>
              {appointment.cat && (
                <div>
                  <div className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground"><Cat className="size-3" />Cat</div>
                  <div className="text-sm font-semibold text-foreground">{appointment.cat_name || 'Unnamed'}</div>
                </div>
              )}
              {isVet && appointment.owner && (
                <div>
                  <div className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground"><User className="size-3" />Booked by</div>
                  <div className="text-sm font-semibold text-foreground">{appointment.owner_name || appointment.owner_email || '—'}</div>
                </div>
              )}
              {!isVet && appointment.vet && (
                <div>
                  <div className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground"><VetIcon className="size-3" />Vet</div>
                  <div className="text-sm font-semibold text-foreground">{appointment.vet_name || '—'}</div>
                </div>
              )}
            </div>

            {isVet && appointment.cat && (
              <Button size="sm" variant="secondary" className="mt-3" asChild>
                <Link to={`/cats/${appointment.cat}/medical`}><Stethoscope className="size-3.5" />Open medical record</Link>
              </Button>
            )}

            {appointment.notes && (
              <div className="mt-3 rounded-lg bg-surface-muted px-3 py-2.5">
                <div className="mb-0.5 text-xs text-muted-foreground">Notes</div>
                <div className="text-sm text-foreground">{appointment.notes}</div>
              </div>
            )}
            {appointment.outcome_summary && (
              <div className="mt-3 rounded-lg bg-success/10 px-3 py-2.5">
                <div className="mb-0.5 text-xs text-muted-foreground">Outcome</div>
                <div className="text-sm text-foreground">{appointment.outcome_summary}</div>
              </div>
            )}
            {appointment.cancellation_reason && (
              <div className="mt-3 rounded-lg bg-destructive/10 px-3 py-2.5">
                <div className="mb-0.5 text-xs text-muted-foreground">Cancellation reason</div>
                <div className="text-sm text-foreground">{appointment.cancellation_reason}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--brand-rust)] to-[var(--brand-ink)] px-6 py-6 text-white sm:px-8">
        <CalendarDays className="pointer-events-none absolute right-4 -bottom-2 size-20 opacity-10" />
        <h1 className="font-display text-[26px] font-bold">Appointments</h1>
        <p className="mt-1 text-sm opacity-80">{isVet ? 'Manage your vet appointments' : 'Book and manage appointments with veterinarians'}</p>
        {canBook && <Button variant="secondary" className="mt-4" onClick={() => setBookModalOpen(true)}><CalendarDays className="size-4" />Book appointment</Button>}
      </div>

      {upcomingAppointments.length > 0 && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-success/25 bg-success/10 px-4 py-3">
          <CalendarDays className="size-5 text-success" />
          <span className="text-sm font-semibold text-foreground">You have {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={cn('shrink-0 rounded-lg border px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors', filterStatus === status ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}>
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading appointments…" />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments" message={filterStatus === 'ALL' ? "You don't have any appointments yet." : `No ${filterStatus.toLowerCase()} appointments.`}
          action={canBook && filterStatus === 'ALL' && <Button onClick={() => setBookModalOpen(true)}>Book your first appointment</Button>} />
      ) : (
        <div>{filteredAppointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}</div>
      )}

      <Modal open={bookModalOpen} onClose={() => setBookModalOpen(false)} title="Book appointment"
        footer={<><Button variant="secondary" onClick={() => setBookModalOpen(false)}>Cancel</Button><Button form="book-form" type="submit">Book appointment</Button></>}
      >
        <form id="book-form" onSubmit={handleBookAppointment} className="flex flex-col gap-4">
          <div>
            <Label>Select cat *</Label>
            <NativeSelect required value={bookForm.cat} onChange={(e) => setBookForm({ ...bookForm, cat: e.target.value })} className="mt-1.5">
              <option value="">Choose a cat…</option>
              {userCats.map((cat) => <option key={cat.id} value={cat.id}>{cat.name || 'Unnamed cat'}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label>Select vet *</Label>
            <NativeSelect required value={bookForm.vet} onChange={(e) => setBookForm({ ...bookForm, vet: e.target.value })} className="mt-1.5">
              <option value="">Choose a vet…</option>
              {vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.profile?.first_name && vet.profile?.last_name ? `Dr. ${vet.profile.first_name} ${vet.profile.last_name}` : vet.email}</option>)}
            </NativeSelect>
          </div>
          <div>
            <Label>Appointment type *</Label>
            <NativeSelect required value={bookForm.appointment_type} onChange={(e) => setBookForm({ ...bookForm, appointment_type: e.target.value })} className="mt-1.5">
              <option value="CHECKUP">Checkup</option>
              <option value="VACCINATION">Vaccination</option>
              <option value="SURGERY">Surgery</option>
              <option value="FOLLOWUP">Follow-up</option>
              <option value="EMERGENCY">Emergency</option>
            </NativeSelect>
          </div>
          <div>
            <Label>Date &amp; time *</Label>
            <Input required type="datetime-local" value={bookForm.scheduled_at} onChange={(e) => setBookForm({ ...bookForm, scheduled_at: e.target.value })} min={new Date().toISOString().slice(0, 16)} className="mt-1.5" />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={bookForm.notes} onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })} rows={3} placeholder="Any additional information for the vet…" className="mt-1.5" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmDialogOpen} title="Confirm appointment" message="Are you sure you want to confirm this appointment? The owner will be notified."
        confirmLabel="Confirm" onConfirm={handleConfirm} onCancel={() => setConfirmDialogOpen(false)} />

      <Modal open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} title="Cancel appointment"
        footer={<><Button variant="secondary" onClick={() => setCancelDialogOpen(false)}>Go back</Button><Button variant="destructive" onClick={handleCancel}>Cancel appointment</Button></>}
      >
        <p className="mb-3 text-sm text-muted-foreground">Please provide a reason for cancelling this appointment:</p>
        <Textarea value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} rows={3} placeholder="Reason for cancellation…" />
      </Modal>

      <Modal open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} title="Complete appointment"
        footer={<><Button variant="secondary" onClick={() => setCompleteDialogOpen(false)}>Cancel</Button><Button onClick={handleComplete}>Mark complete</Button></>}
      >
        <p className="mb-3 text-sm text-muted-foreground">Please provide a summary of the appointment outcome:</p>
        <Textarea value={outcomeSummary} onChange={(e) => setOutcomeSummary(e.target.value)} rows={4} placeholder="Summary of examination, diagnosis, treatment, and follow-up recommendations…" />
      </Modal>
    </div>
  );
}
