export const mockWeightLogs = [
  { id: 'w-1', cat: 'cat-1', weight_kg: 4.1, recorded_at: '2025-12-01T00:00:00Z', notes: '' },
  { id: 'w-2', cat: 'cat-1', weight_kg: 4.18, recorded_at: '2026-01-01T00:00:00Z', notes: '' },
  { id: 'w-3', cat: 'cat-1', weight_kg: 4.25, recorded_at: '2026-02-01T00:00:00Z', notes: 'Gaining well after dental work.' },
  { id: 'w-4', cat: 'cat-3', weight_kg: 28.4, recorded_at: '2026-01-15T00:00:00Z', notes: '' },
];

export const mockAppointments = [
  {
    id: 'appt-1', cat: 'cat-2', cat_name: 'Oliver', vet: 'u-4', vet_name: 'Faisal Khan', owner: 'u-8', owner_name: 'Bilal Ahmed',
    appointment_type: 'CHECKUP', status: 'SCHEDULED', scheduled_at: '2026-09-20T11:00:00Z', notes: 'Follow-up after URI treatment.',
  },
  {
    id: 'appt-2', cat: 'cat-1', cat_name: 'Luna', vet: 'u-4', vet_name: 'Faisal Khan', owner: 'u-2', owner_name: 'Jordan Blake',
    appointment_type: 'VACCINATION', status: 'CONFIRMED', scheduled_at: '2026-09-14T09:30:00Z', notes: '',
  },
  {
    id: 'appt-3', cat: 'cat-3', cat_name: 'Biscuit', vet: 'u-5', vet_name: 'Sara Malik', owner: 'u-3', owner_name: 'Amina Hassan',
    appointment_type: 'SURGERY', status: 'COMPLETED', scheduled_at: '2026-08-02T13:00:00Z', outcome_summary: 'Neuter procedure completed without complications. Recovery normal.', notes: '',
  },
  {
    id: 'appt-4', cat: 'cat-7', cat_name: 'Buddy', vet: 'u-4', vet_name: 'Faisal Khan', owner: 'u-3', owner_name: 'Amina Hassan',
    appointment_type: 'FOLLOWUP', status: 'CANCELLED', scheduled_at: '2026-07-11T10:00:00Z', cancellation_reason: 'Rescheduled by owner.', notes: '',
  },
];

export const mockHealthAlerts = [
  {
    id: 'ha-1', cat: 'cat-2', cat_name: 'Oliver', alert_type: 'VACCINATION_OVERDUE', severity: 'WARNING',
    message: "Oliver's FeLV booster was due last week — please schedule a vaccination visit.", triggered_at: '2026-09-05T00:00:00Z', is_resolved: false,
  },
  {
    id: 'ha-2', cat: 'cat-1', cat_name: 'Luna', alert_type: 'CHECKUP_DUE', severity: 'INFO',
    message: "Luna's annual checkup is coming up in the next 30 days.", triggered_at: '2026-09-01T00:00:00Z', is_resolved: false,
  },
  {
    id: 'ha-3', cat: 'cat-3', cat_name: 'Biscuit', alert_type: 'MISSED_DOSE', severity: 'CRITICAL',
    message: 'Rimadyl dose was not logged for the scheduled time. Please confirm with the foster/owner.', triggered_at: '2026-08-28T00:00:00Z',
    is_resolved: true, resolved_at: '2026-08-28T18:00:00Z', resolved_by_name: 'Amina Hassan',
  },
];
