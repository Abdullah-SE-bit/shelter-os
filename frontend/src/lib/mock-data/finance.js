export const mockDonations = [
  { id: 'don-1', donor_name: 'Ahmed Raza', donor_email: 'ahmed.raza@example.com', amount: 5000, campaign: 'camp-1', payment_method: 'BANK_TRANSFER', received_at: '2026-09-05T00:00:00Z', notes: '' },
  { id: 'don-2', donor_name: '', donor_email: '', amount: 2000, campaign: null, payment_method: 'JAZZCASH', received_at: '2026-09-02T00:00:00Z', notes: 'Anonymous donor' },
  { id: 'don-3', donor_name: 'Sana Malik', donor_email: 'sana.malik@example.com', amount: 10000, campaign: 'camp-1', payment_method: 'BANK_TRANSFER', received_at: '2026-08-28T00:00:00Z', notes: '' },
  { id: 'don-4', donor_name: 'Hina Iqbal', donor_email: 'hina.iqbal@example.com', amount: 1500, campaign: 'camp-2', payment_method: 'EASYPAISA', received_at: '2026-08-20T00:00:00Z', notes: '' },
];

export const mockCampaigns = [
  { id: 'camp-1', title: 'Winter Shelter Fund', shelter_name: 'Happy Paws Shelter', is_app_level: false, target_amount: 100000, collected_amount: 68500, status: 'ACTIVE', start_date: '2026-06-01T00:00:00Z', end_date: '2026-12-31T00:00:00Z', description: 'Help us keep every kennel warm this winter.' },
  { id: 'camp-2', title: 'Emergency Vet Fund', shelter_name: 'Second Chance Animal Rescue', is_app_level: false, target_amount: 50000, collected_amount: 51200, status: 'COMPLETED', start_date: '2026-05-01T00:00:00Z', end_date: '2026-08-31T00:00:00Z', description: 'Covers urgent veterinary care for rescued animals.' },
  { id: 'camp-3', title: 'New Kennel Wing', shelter_name: null, is_app_level: true, target_amount: 200000, collected_amount: 42000, status: 'ACTIVE', start_date: '2026-07-01T00:00:00Z', end_date: '2027-03-01T00:00:00Z', description: 'Expanding capacity for street-animal intake nationwide.' },
];

export const mockExpenses = [
  { id: 'exp-1', shelter_id: 'shelter-1', category: 'FOOD', amount: 18000, description: 'Monthly food supply restock', incurred_at: '2026-09-01T00:00:00Z', payment_method: 'CASH' },
  { id: 'exp-2', shelter_id: 'shelter-1', category: 'MEDICINE', amount: 9200, description: 'Vaccination batch for new intakes', incurred_at: '2026-08-25T00:00:00Z', payment_method: 'BANK_TRANSFER' },
  { id: 'exp-3', shelter_id: 'shelter-1', category: 'UTILITIES', amount: 12500, description: 'Electricity and water bill', incurred_at: '2026-08-20T00:00:00Z', payment_method: 'BANK_TRANSFER' },
  { id: 'exp-4', shelter_id: 'shelter-2', category: 'MAINTENANCE', amount: 6700, description: 'Kennel repairs', incurred_at: '2026-08-18T00:00:00Z', payment_method: 'CASH' },
];
