export const mockUsers = [
  { id: 'u-1', email: 'sam.rivera@shelteros.mock', role: 'SUPER_ADMIN', is_active: true, is_email_verified: true, date_joined: '2024-01-10T00:00:00Z', last_activity_at: '2026-09-11T09:40:00Z', profile: { first_name: 'Sam', last_name: 'Rivera' } },
  { id: 'u-2', email: 'jordan.blake@shelteros.mock', role: 'SHELTER_ADMIN', is_active: true, is_email_verified: true, date_joined: '2024-02-14T00:00:00Z', last_activity_at: '2026-09-11T08:15:00Z', profile: { first_name: 'Jordan', last_name: 'Blake' }, shelter_name: 'Happy Paws Shelter' },
  { id: 'u-3', email: 'amina.hassan@shelteros.mock', role: 'SHELTER_ADMIN', is_active: true, is_email_verified: true, date_joined: '2024-03-02T00:00:00Z', last_login_at: '2026-09-09T12:00:00Z', profile: { first_name: 'Amina', last_name: 'Hassan' }, shelter_name: 'Second Chance Animal Rescue' },
  { id: 'u-4', email: 'faisal.khan@shelteros.mock', role: 'EMPLOYEE', is_active: true, is_email_verified: true, date_joined: '2024-04-18T00:00:00Z', last_login_at: '2026-09-08T10:00:00Z', profile: { first_name: 'Faisal', last_name: 'Khan' } },
  { id: 'u-5', email: 'sara.malik@shelteros.mock', role: 'EMPLOYEE', is_active: true, is_email_verified: false, date_joined: '2026-01-05T00:00:00Z', last_login_at: '2026-08-20T09:00:00Z', profile: { first_name: 'Sara', last_name: 'Malik' } },
  { id: 'u-6', email: 'casey.nguyen@shelteros.mock', role: 'EMPLOYEE', is_active: true, is_email_verified: true, date_joined: '2024-05-20T00:00:00Z', last_activity_at: '2026-09-11T08:05:00Z', profile: { first_name: 'Casey', last_name: 'Nguyen' } },
  { id: 'u-7', email: 'priya.singh@shelteros.mock', role: 'EMPLOYEE', is_active: true, is_email_verified: true, date_joined: '2024-06-11T00:00:00Z', last_login_at: '2026-07-18T17:40:00Z', profile: { first_name: 'Priya', last_name: 'Singh' } },
  { id: 'u-8', email: 'bilal.ahmed@shelteros.mock', role: 'PET_OWNER', is_active: true, is_email_verified: true, date_joined: '2024-08-02T00:00:00Z', last_login_at: '2026-09-01T14:00:00Z', profile: { first_name: 'Bilal', last_name: 'Ahmed' } },
  { id: 'u-9', email: 'noor.fatima@shelteros.mock', role: 'ADOPTER', is_active: true, is_email_verified: false, date_joined: '2025-01-15T00:00:00Z', last_login_at: '2026-08-30T11:00:00Z', profile: { first_name: 'Noor', last_name: 'Fatima' } },
  { id: 'u-10', email: 'inactive.user@shelteros.mock', role: 'ADOPTER', is_active: false, is_email_verified: true, date_joined: '2024-09-09T00:00:00Z', last_login_at: '2025-11-02T10:00:00Z', profile: { first_name: 'Ali', last_name: 'Raza' } },
];

export const mockEmployees = [
  {
    id: 'vol-1', name: 'Casey Nguyen', email: 'casey.nguyen@shelteros.mock', phone: '+923041234567',
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', skills: ['Dog walking', 'Pet socialization'],
    availability: 'Weekends', service_radius_km: 15, is_approved: true, active_assignments: 2, joined_at: '2024-05-20T00:00:00Z',
  },
  {
    id: 'vol-2', name: 'Priya Singh', email: 'priya.singh@shelteros.mock', phone: '+923051234567',
    shelter_id: 'shelter-2', shelter_name: 'Second Chance Animal Rescue', skills: ['Transport', 'Foster coordination'],
    availability: 'Weekday evenings', service_radius_km: 25, is_approved: true, active_assignments: 1, joined_at: '2024-06-11T00:00:00Z',
  },
  {
    id: 'vol-3', name: 'Hamza Farooq', email: 'hamza.farooq@shelteros.mock', phone: '+923061234567',
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', skills: ['Photography', 'Adoption events'],
    availability: 'Flexible', service_radius_km: 10, is_approved: false, active_assignments: 0, joined_at: '2026-02-01T00:00:00Z',
  },
];

export const getUserById = (id) => mockUsers.find((u) => u.id === id) || null;
export const getEmployeeById = (id) => mockEmployees.find((v) => v.id === id) || null;

export const mockShelterChangeRequests = [
  {
    id: 'chg-1', employee_name: 'Hamza Farooq', from_shelter_name: null, to_shelter_name: 'Happy Paws Shelter',
    reason: 'Closer to my home, easier to work there on weekdays.', status: 'PENDING',
  },
];

