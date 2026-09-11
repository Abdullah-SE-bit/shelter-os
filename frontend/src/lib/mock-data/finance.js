export const mockDonations = [
  { id: 'don-1', donor_name: 'Ahmed Raza', amount: 5000, shelter_name: 'Happy Paws Shelter', campaign_name: 'Winter Shelter Fund', donated_at: '2026-09-05T00:00:00Z', payment_method: 'Bank Transfer', is_anonymous: false },
  { id: 'don-2', donor_name: 'Anonymous', amount: 2000, shelter_name: 'Second Chance Animal Rescue', campaign_name: null, donated_at: '2026-09-02T00:00:00Z', payment_method: 'JazzCash', is_anonymous: true },
  { id: 'don-3', donor_name: 'Sana Malik', amount: 10000, shelter_name: 'Happy Paws Shelter', campaign_name: 'Winter Shelter Fund', donated_at: '2026-08-28T00:00:00Z', payment_method: 'Bank Transfer', is_anonymous: false },
  { id: 'don-4', donor_name: 'Hina Iqbal', amount: 1500, shelter_name: 'Second Chance Animal Rescue', campaign_name: 'Emergency Vet Fund', donated_at: '2026-08-20T00:00:00Z', payment_method: 'Easypaisa', is_anonymous: false },
];

export const mockCampaigns = [
  { id: 'camp-1', name: 'Winter Shelter Fund', shelter_name: 'Happy Paws Shelter', goal_amount: 100000, raised_amount: 68500, status: 'ACTIVE', ends_at: '2026-12-31T00:00:00Z', description: 'Help us keep every kennel warm this winter.' },
  { id: 'camp-2', name: 'Emergency Vet Fund', shelter_name: 'Second Chance Animal Rescue', goal_amount: 50000, raised_amount: 51200, status: 'COMPLETED', ends_at: '2026-08-31T00:00:00Z', description: 'Covers urgent veterinary care for rescued animals.' },
  { id: 'camp-3', name: 'New Kennel Wing', shelter_name: 'Karachi Companion Care', goal_amount: 200000, raised_amount: 42000, status: 'ACTIVE', ends_at: '2027-03-01T00:00:00Z', description: 'Expanding capacity for street-animal intake in Karachi.' },
];

export const mockExpenses = [
  { id: 'exp-1', shelter_id: 'shelter-1', category: 'FOOD', amount: 18000, description: 'Monthly food supply restock', spent_at: '2026-09-01T00:00:00Z' },
  { id: 'exp-2', shelter_id: 'shelter-1', category: 'MEDICAL', amount: 9200, description: 'Vaccination batch for new intakes', spent_at: '2026-08-25T00:00:00Z' },
  { id: 'exp-3', shelter_id: 'shelter-1', category: 'UTILITIES', amount: 12500, description: 'Electricity and water bill', spent_at: '2026-08-20T00:00:00Z' },
  { id: 'exp-4', shelter_id: 'shelter-2', category: 'MAINTENANCE', amount: 6700, description: 'Kennel repairs', spent_at: '2026-08-18T00:00:00Z' },
];
