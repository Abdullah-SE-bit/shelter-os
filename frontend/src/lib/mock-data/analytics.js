export const mockDashboardStats = {
  total_pets: 142, total_shelters: 3, total_employees: 41, open_rescues: 5,
  pending_adoptions: 6, active_lost_alerts: 3,
  pets_in_shelter: 68, pets_fostered: 22, pets_adopted: 41, pets_lost: 4, pets_deceased: 7,
  users_by_role: { SUPER_ADMIN: 1, SHELTER_ADMIN: 2, PET_OWNER: 1, ADOPTER: 2, EMPLOYEE: 4 },
  recent_activity: [
    { description: 'Luna (Persian) was checked in at Happy Paws Shelter', timestamp: '2026-09-10T14:00:00Z' },
    { description: 'Adoption application approved for Buddy', timestamp: '2026-09-09T11:00:00Z' },
    { description: 'New donation of Rs. 10,000 received', timestamp: '2026-08-28T09:00:00Z' },
    { description: 'Rescue #R-204 marked resolved', timestamp: '2026-08-25T16:20:00Z' },
  ],
};

export const mockReports = {
  total_applications: 24, reviewed_applications: 18, interviews_done: 10, approved_applications: 7,
  total_pets: 142, adoptions: 41, rescues_resolved: 19, active_employees: 41, total_donations: 187300,
  pets_by_status: { IN_SHELTER: 68, FOSTERED: 22, ADOPTED: 41, LOST: 4, DECEASED: 7 },
  pets_by_breed: { Persian: 12, Siamese: 9, 'Maine Coon': 6, 'Golden Retriever': 8, Labrador: 5, Beagle: 7, Mixed: 34 },
};

export const mockShelterDashboard = {
  pets_in_care: 42, pending_intakes: 3, pending_discharges: 2, active_employees: 24,
  pending_applications: 4, low_stock_items: 2, monthly_donations: 68500,
};
