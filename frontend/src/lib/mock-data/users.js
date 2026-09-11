export const mockUsers = [
  { id: 'u-1', email: 'sam.rivera@shelteros.mock', role: 'SUPER_ADMIN', is_active: true, is_email_verified: true, date_joined: '2024-01-10T00:00:00Z', last_activity_at: '2026-09-11T09:40:00Z', profile: { first_name: 'Sam', last_name: 'Rivera' } },
  { id: 'u-2', email: 'jordan.blake@shelteros.mock', role: 'SHELTER_ADMIN', is_active: true, is_email_verified: true, date_joined: '2024-02-14T00:00:00Z', last_activity_at: '2026-09-11T08:15:00Z', profile: { first_name: 'Jordan', last_name: 'Blake' }, shelter_name: 'Happy Paws Shelter' },
  { id: 'u-3', email: 'amina.hassan@shelteros.mock', role: 'SHELTER_ADMIN', is_active: true, is_email_verified: true, date_joined: '2024-03-02T00:00:00Z', last_login_at: '2026-09-09T12:00:00Z', profile: { first_name: 'Amina', last_name: 'Hassan' }, shelter_name: 'Second Chance Animal Rescue' },
  { id: 'u-4', email: 'dr.faisal@shelteros.mock', role: 'VET', is_active: true, is_email_verified: true, date_joined: '2024-04-18T00:00:00Z', last_login_at: '2026-09-08T10:00:00Z', profile: { first_name: 'Faisal', last_name: 'Khan' }, vet_profile: { is_fully_approved: true, super_admin_status: 'APPROVED', shelter_admin_status: 'APPROVED' } },
  { id: 'u-5', email: 'dr.sara@shelteros.mock', role: 'VET', is_active: true, is_email_verified: false, date_joined: '2026-01-05T00:00:00Z', last_login_at: '2026-08-20T09:00:00Z', profile: { first_name: 'Sara', last_name: 'Malik' }, vet_profile: { is_fully_approved: false, super_admin_status: 'APPROVED', shelter_admin_status: 'PENDING' } },
  { id: 'u-6', email: 'casey.nguyen@shelteros.mock', role: 'VOLUNTEER', is_active: true, is_email_verified: true, date_joined: '2024-05-20T00:00:00Z', last_activity_at: '2026-09-11T08:05:00Z', profile: { first_name: 'Casey', last_name: 'Nguyen' } },
  { id: 'u-7', email: 'priya.singh@shelteros.mock', role: 'VOLUNTEER', is_active: true, is_email_verified: true, date_joined: '2024-06-11T00:00:00Z', last_login_at: '2026-07-18T17:40:00Z', profile: { first_name: 'Priya', last_name: 'Singh' } },
  { id: 'u-8', email: 'bilal.ahmed@shelteros.mock', role: 'CAT_OWNER', is_active: true, is_email_verified: true, date_joined: '2024-08-02T00:00:00Z', last_login_at: '2026-09-01T14:00:00Z', profile: { first_name: 'Bilal', last_name: 'Ahmed' } },
  { id: 'u-9', email: 'noor.fatima@shelteros.mock', role: 'ADOPTER', is_active: true, is_email_verified: false, date_joined: '2025-01-15T00:00:00Z', last_login_at: '2026-08-30T11:00:00Z', profile: { first_name: 'Noor', last_name: 'Fatima' } },
  { id: 'u-10', email: 'inactive.user@shelteros.mock', role: 'ADOPTER', is_active: false, is_email_verified: true, date_joined: '2024-09-09T00:00:00Z', last_login_at: '2025-11-02T10:00:00Z', profile: { first_name: 'Ali', last_name: 'Raza' } },
];

export const mockVolunteers = [
  {
    id: 'vol-1', name: 'Casey Nguyen', email: 'casey.nguyen@shelteros.mock', phone: '+923041234567',
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', skills: ['Dog walking', 'Cat socialization'],
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
export const getVolunteerById = (id) => mockVolunteers.find((v) => v.id === id) || null;

export const mockShelterChangeRequests = [
  {
    id: 'chg-1', volunteer_name: 'Hamza Farooq', from_shelter_name: null, to_shelter_name: 'Happy Paws Shelter',
    reason: 'Closer to my home, easier to volunteer on weekdays.', status: 'PENDING',
  },
];

export const mockVetApprovals = [
  {
    user_id: 'u-4', first_name: 'Faisal', last_name: 'Khan', email: 'dr.faisal@shelteros.mock',
    vet_profile: {
      license_number: 'PVM-11234', practice_type: 'CLINIC', clinic_name: 'Faisal Pet Clinic',
      specializations: ['Surgery', 'Internal medicine'],
      lifecycle_status: 'APPROVED', super_admin_status: 'APPROVED', shelter_admin_status: 'APPROVED',
    },
  },
  {
    user_id: 'u-5', first_name: 'Sara', last_name: 'Malik', email: 'dr.sara@shelteros.mock',
    vet_profile: {
      license_number: 'PVM-22981', practice_type: 'SHELTER', target_shelter_name: 'Happy Paws Shelter',
      specializations: ['Dermatology'],
      lifecycle_status: 'PENDING', super_admin_status: 'APPROVED', shelter_admin_status: 'PENDING',
    },
  },
  {
    user_id: 'u-11', first_name: 'Zara', last_name: 'Iqbal', email: 'dr.zara@shelteros.mock',
    vet_profile: {
      license_number: 'PVM-30456', practice_type: 'CLINIC', clinic_name: 'Iqbal Veterinary Care',
      specializations: ['Dentistry', 'Radiology'],
      lifecycle_status: 'APPEAL_UNDER_REVIEW', super_admin_status: 'REJECTED', shelter_admin_status: 'PENDING',
      rejection_reason: 'License number could not be verified against the registry.',
      latest_appeal: {
        explanation: 'My license was renewed last month; the registry entry was delayed. Updated certificate attached.',
        has_document: true, needs_super_review: false, super_status: 'PENDING',
        needs_shelter_review: true, shelter_status: 'PENDING',
      },
    },
  },
  {
    user_id: 'u-12', first_name: 'Omar', last_name: 'Sheikh', email: 'dr.omar@shelteros.mock',
    vet_profile: {
      license_number: 'PVM-40789', practice_type: 'SHELTER', target_shelter_name: 'Second Chance Animal Rescue',
      specializations: ['Emergency care'],
      lifecycle_status: 'SUPER_FINAL_REVIEW', super_admin_status: 'PENDING', shelter_admin_status: 'REJECTED',
      rejection_reason: 'Shelter admin flagged inconsistent references.',
      latest_appeal: {
        explanation: 'The references listed were outdated; I have added two current shelter contacts as proof of active practice.',
        has_document: true, needs_super_review: true, super_status: 'PENDING',
        needs_shelter_review: false, shelter_status: 'REJECTED',
        shelter_reject_details: 'References could not be reached and documents looked altered.',
        shelter_reject_anomalies: 'Signature date mismatch on the reference letter.',
      },
    },
  },
  {
    user_id: 'u-13', first_name: 'Layla', last_name: 'Ahmed', email: 'dr.layla@shelteros.mock',
    vet_profile: {
      license_number: 'PVM-50112', practice_type: 'CLINIC', clinic_name: 'Ahmed Animal Hospital',
      specializations: ['Oncology'],
      lifecycle_status: 'SUSPENDED', super_admin_status: 'REJECTED', shelter_admin_status: 'REJECTED',
      rejection_reason: 'Appeal rejected by Super Admin — license could not be confirmed.',
    },
  },
  {
    user_id: 'u-14', first_name: 'Hassan', last_name: 'Ali', email: 'dr.hassan@shelteros.mock',
    vet_profile: {
      license_number: 'PVM-60998', practice_type: 'CLINIC', clinic_name: 'Ali Vet Practice',
      specializations: ['General practice'],
      lifecycle_status: 'FLAGGED', super_admin_status: 'REJECTED', shelter_admin_status: 'PENDING',
      rejection_reason: 'Appeal window lapsed without a response.',
    },
  },
];
