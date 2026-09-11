export const mockMedicalRecords = [
  { id: 'mr-1', cat: 'cat-1', record_type: 'CHECKUP', occurred_at: '2026-01-15T10:00:00Z', description: 'Routine annual checkup. Healthy weight, clear eyes and ears.', treatment: '', diagnosis: '', vet_name: 'Faisal Khan', cost: 1500 },
  { id: 'mr-2', cat: 'cat-1', record_type: 'VACCINATION', occurred_at: '2025-11-02T09:30:00Z', description: 'Core vaccination booster administered.', treatment: 'FVRCP booster', diagnosis: '', vet_name: 'Faisal Khan', cost: 800 },
  { id: 'mr-3', cat: 'cat-2', record_type: 'ILLNESS', occurred_at: '2026-02-20T14:00:00Z', description: 'Mild upper respiratory symptoms observed — sneezing, slight discharge.', treatment: 'Amoxicillin course, 7 days', diagnosis: 'Suspected URI', vet_name: 'Sara Malik', cost: 2200 },
];

export const mockVaccinations = [
  { id: 'vac-1', cat: 'cat-1', vaccine_name: 'FVRCP', date_given: '2025-11-02', next_due_date: '2026-11-02', vet_name: 'Faisal Khan', batch_number: 'FV-2211' },
  { id: 'vac-2', cat: 'cat-1', vaccine_name: 'Rabies', date_given: '2025-09-15', next_due_date: '2026-09-15', vet_name: 'Faisal Khan', batch_number: 'RB-0917' },
  { id: 'vac-3', cat: 'cat-2', vaccine_name: 'FeLV', date_given: '2025-12-01', next_due_date: '2026-06-01', vet_name: 'Sara Malik', batch_number: 'FL-1201' },
];

export const mockMedications = [
  { id: 'med-1', cat: 'cat-2', medication_name: 'Amoxicillin', dosage: '50mg', frequency: 'TWICE_DAILY', start_date: '2026-02-20', end_date: '2026-02-27', reason: 'Upper respiratory infection', prescribing_vet: 'Sara Malik' },
  { id: 'med-2', cat: 'cat-3', medication_name: 'Rimadyl', dosage: '25mg', frequency: 'DAILY', start_date: '2026-01-10', end_date: '', reason: 'Post-surgical pain management', prescribing_vet: 'Faisal Khan' },
];

export const byCat = (list, catId) => list.filter((r) => r.cat === catId);
