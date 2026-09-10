import { useState } from 'react';
import { wellnessApi } from '../../api/wellnessApi';
import { catsApi } from '../../api/catsApi';
import { accountsApi } from '../../api/accountsApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AppointmentsPage() {
  const { user } = useAuth();
  // Cat owners, shelter admins and volunteers can all request appointments.
  const canBook = ['CAT_OWNER', 'SHELTER_ADMIN', 'VOLUNTEER', 'ADOPTER'].includes(user?.role);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [outcomeSummary, setOutcomeSummary] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Fetch appointments
  const { data: appointmentsData, loading, refetch } = useApi(() => wellnessApi.myAppointments());
  // /appointments/me/ returns a bare array, which useApi surfaces directly.
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : (appointmentsData?.results || []);

  // For booking form
  const [bookForm, setBookForm] = useState({
    cat: '',
    vet: '',
    appointment_type: 'CHECKUP',
    scheduled_at: '',
    notes: '',
  });

  // Fetch user's cats (for Cat Owners)
  const { data: catsData } = useApi(
    () => catsApi.list(),
    { skip: !canBook }
  );
  // /cats/ returns { results, count, ... }, so read the results array (guarding
  // for a bare array too).
  const userCats = Array.isArray(catsData) ? catsData : (catsData?.results || []);

  // Fetch vets (for booking). useApi already unwraps the envelope to res.data.data,
  // and GET /users/ returns a bare array, so vetsData IS the array of vets.
  const { data: vetsData } = useApi(() => accountsApi.list({ role: 'VET' }));
  const vets = Array.isArray(vetsData) ? vetsData : (vetsData?.results || []);

  const isVet = user?.role === 'VET';
  const isCatOwner = user?.role === 'CAT_OWNER';

  const statusColors = {
    SCHEDULED: 'var(--cat-blue)',
    CONFIRMED: 'var(--cat-sage)',
    COMPLETED: 'var(--text-muted)',
    CANCELLED: 'var(--cat-red)',
    NO_SHOW: 'var(--cat-amber)',
  };

  const typeIcons = {
    CHECKUP: '🩺',
    VACCINATION: '💉',
    SURGERY: '⚕️',
    FOLLOWUP: '📋',
    EMERGENCY: '🚨',
  };

  const filteredAppointments = filterStatus === 'ALL' 
    ? appointments 
    : appointments.filter(a => a.status === filterStatus);

  const upcomingAppointments = appointments.filter(a => 
    new Date(a.scheduled_at) >= new Date() && a.status !== 'CANCELLED' && a.status !== 'COMPLETED'
  );

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      await wellnessApi.createAppointment(bookForm);
      setBookModalOpen(false);
      setBookForm({ cat: '', vet: '', appointment_type: 'CHECKUP', scheduled_at: '', notes: '' });
      refetch();
      alert('Appointment booked successfully! The vet will receive a notification.');
    } catch (error) {
      console.error('Failed to book appointment:', error);
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
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      alert('Failed to confirm appointment. Please try again.');
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
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
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
    } catch (error) {
      console.error('Failed to complete appointment:', error);
      alert('Failed to complete appointment. Please try again.');
    }
  };

  const AppointmentCard = ({ appointment }) => {
    const isPast = new Date(appointment.scheduled_at) < new Date();
    // Actions follow the appointment status, not the clock, so a vet always has
    // a path to Confirm -> Complete (or Cancel) an open appointment.
    const isOpen = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';
    const canConfirm = isVet && appointment.status === 'SCHEDULED';
    const canComplete = isVet && isOpen;
    const canCancel = (isVet || canBook) && isOpen;

    return (
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
        borderLeft: `4px solid ${statusColors[appointment.status] || 'var(--border-default)'}`,
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {/* Icon */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--cat-linen)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}>
            {typeIcons[appointment.appointment_type] || '📅'}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {appointment.appointment_type?.replace(/_/g, ' ')}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    background: statusColors[appointment.status] + '20',
                    color: statusColors[appointment.status],
                  }}>
                    {appointment.status}
                  </span>
                  {isPast && appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cat-amber)' }}>
                      ⚠️ Past due
                    </span>
                  )}
                </div>
              </div>
              
              {/* Action buttons for Vets */}
              {isVet && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {canConfirm && (
                    <button
                      onClick={() => { setSelectedAppointment(appointment); setConfirmDialogOpen(true); }}
                      className="btn btn-sm"
                      style={{ background: 'var(--cat-sage)', color: 'white', border: 'none' }}
                    >
                      ✓ Confirm
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={() => { setSelectedAppointment(appointment); setCompleteDialogOpen(true); }}
                      className="btn btn-sm"
                      style={{ background: 'var(--cat-blue)', color: 'white', border: 'none' }}
                    >
                      ✓ Complete
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => { setSelectedAppointment(appointment); setCancelDialogOpen(true); }}
                      className="btn btn-secondary btn-sm"
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              )}

              {/* Cancel button for the booker (owner / shelter admin / volunteer) */}
              {!isVet && canBook && canCancel && (
                <button
                  onClick={() => { setSelectedAppointment(appointment); setCancelDialogOpen(true); }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              {/* Appointment type — shown to both the vet and whoever booked it. */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>📋 Type</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {typeIcons[appointment.appointment_type] || '📅'} {appointment.appointment_type?.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>📅 Scheduled</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatDateTime(appointment.scheduled_at)}
                </div>
              </div>
              {appointment.cat && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🐱 Cat</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {appointment.cat_name || 'Unnamed'}
                  </div>
                </div>
              )}
              {isVet && appointment.owner && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>👤 Booked by</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {appointment.owner_name || appointment.owner_email || '—'}
                  </div>
                </div>
              )}
              {!isVet && appointment.vet && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>🩺 Vet</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {appointment.vet_name || '—'}
                  </div>
                </div>
              )}
            </div>

            {/* Vet reaches their patient's records only through the appointment. */}
            {isVet && appointment.cat && (
              <div style={{ marginTop: '0.75rem' }}>
                <Link to={`/cats/${appointment.cat}/medical`} className="btn btn-secondary btn-sm">
                  🩺 Open medical record
                </Link>
              </div>
            )}

            {appointment.notes && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--cat-linen)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>📝 Notes</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{appointment.notes}</div>
              </div>
            )}

            {appointment.outcome_summary && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(136,176,136,0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>✓ Outcome</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{appointment.outcome_summary}</div>
              </div>
            )}

            {appointment.cancellation_reason && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(201,71,71,0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>✕ Cancellation Reason</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{appointment.cancellation_reason}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-blue), var(--cat-sage))',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-0.5rem', fontSize: '6rem', opacity: 0.1 }}>📅</div>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          Appointments
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 1rem', fontSize: '0.9375rem' }}>
          {isVet ? 'Manage your vet appointments' : 'Book and manage appointments with veterinarians'}
        </p>
        {canBook && (
          <button onClick={() => setBookModalOpen(true)} className="btn btn-primary">
            📅 Book Appointment
          </button>
        )}
      </div>

      {/* Upcoming alert */}
      {upcomingAppointments.length > 0 && (
        <div style={{
          background: 'rgba(136,176,136,0.12)',
          border: '1px solid rgba(136,176,136,0.35)',
          borderRadius: '12px',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            You have {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {['ALL', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              background: filterStatus === status ? 'var(--cat-terra)' : 'var(--surface-card)',
              color: filterStatus === status ? 'white' : 'var(--text-primary)',
              border: filterStatus === status ? 'none' : '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '0.625rem 1.125rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading appointments..." />
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments"
          message={filterStatus === 'ALL' 
            ? "You don't have any appointments yet." 
            : `No ${filterStatus.toLowerCase()} appointments.`}
          action={canBook && filterStatus === 'ALL' && (
            <button onClick={() => setBookModalOpen(true)} className="btn btn-primary">
              Book Your First Appointment
            </button>
          )}
        />
      ) : (
        <div>
          {filteredAppointments.map(appointment => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      <Modal
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="📅 Book Appointment"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setBookModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button form="book-form" type="submit" className="btn btn-primary">
              Book Appointment
            </button>
          </div>
        }
      >
        <form id="book-form" onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Select Cat *
            </label>
            <select
              required
              value={bookForm.cat}
              onChange={(e) => setBookForm({ ...bookForm, cat: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
            >
              <option value="">Choose a cat...</option>
              {userCats.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name || 'Unnamed Cat'}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Select Vet *
            </label>
            <select
              required
              value={bookForm.vet}
              onChange={(e) => setBookForm({ ...bookForm, vet: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
            >
              <option value="">Choose a vet...</option>
              {vets.map(vet => (
                <option key={vet.id} value={vet.id}>
                  {vet.profile?.first_name && vet.profile?.last_name 
                    ? `Dr. ${vet.profile.first_name} ${vet.profile.last_name}`
                    : vet.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Appointment Type *
            </label>
            <select
              required
              value={bookForm.appointment_type}
              onChange={(e) => setBookForm({ ...bookForm, appointment_type: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
            >
              <option value="CHECKUP">🩺 Checkup</option>
              <option value="VACCINATION">💉 Vaccination</option>
              <option value="SURGERY">⚕️ Surgery</option>
              <option value="FOLLOWUP">📋 Follow-up</option>
              <option value="EMERGENCY">🚨 Emergency</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Date & Time *
            </label>
            <input
              required
              type="datetime-local"
              value={bookForm.scheduled_at}
              onChange={(e) => setBookForm({ ...bookForm, scheduled_at: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              Notes (Optional)
            </label>
            <textarea
              value={bookForm.notes}
              onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
              rows={3}
              placeholder="Any additional information for the vet..."
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                resize: 'vertical',
              }}
            />
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Appointment"
        message="Are you sure you want to confirm this appointment? The owner will be notified."
        confirmText="Confirm"
        confirmColor="var(--cat-sage)"
      />

      {/* Cancel Dialog */}
      <Modal
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel Appointment"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setCancelDialogOpen(false)} className="btn btn-secondary">
              Go Back
            </button>
            <button onClick={handleCancel} className="btn" style={{ background: 'var(--cat-red)', color: 'white', border: 'none' }}>
              Cancel Appointment
            </button>
          </div>
        }
      >
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Please provide a reason for cancelling this appointment:
          </p>
          <textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            rows={3}
            placeholder="Reason for cancellation..."
            style={{
              width: '100%',
              padding: '0.625rem',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              resize: 'vertical',
            }}
          />
        </div>
      </Modal>

      {/* Complete Dialog */}
      <Modal
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
        title="Complete Appointment"
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setCompleteDialogOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleComplete} className="btn" style={{ background: 'var(--cat-blue)', color: 'white', border: 'none' }}>
              Mark Complete
            </button>
          </div>
        }
      >
        <div>
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Please provide a summary of the appointment outcome:
          </p>
          <textarea
            value={outcomeSummary}
            onChange={(e) => setOutcomeSummary(e.target.value)}
            rows={4}
            placeholder="Summary of examination, diagnosis, treatment, and follow-up recommendations..."
            style={{
              width: '100%',
              padding: '0.625rem',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              resize: 'vertical',
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
