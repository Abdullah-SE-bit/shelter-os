export const mockDashboardStats = {
  total_cats: 142, total_shelters: 3, active_volunteers: 41, total_donations: 187300,
  adoptions_this_month: 12, rescues_this_month: 8, pending_applications: 6, pending_vet_approvals: 1,
  cats_by_status: { IN_SHELTER: 68, FOSTERED: 22, ADOPTED: 41, LOST: 4, DECEASED: 7 },
  recent_activity: [
    { id: 'a1', text: 'Luna (Persian) was checked in at Happy Paws Shelter', at: '2026-09-10T14:00:00Z' },
    { id: 'a2', text: 'Adoption application approved for Buddy', at: '2026-09-09T11:00:00Z' },
    { id: 'a3', text: 'New donation of Rs. 10,000 received', at: '2026-08-28T09:00:00Z' },
  ],
};

export const mockReports = {
  total_applications: 24, reviewed_applications: 18, interviews_done: 10, approved_applications: 7,
  total_cats: 142, adoptions: 41, rescues_resolved: 19, active_volunteers: 41, total_donations: 187300,
  cats_by_status: { IN_SHELTER: 68, FOSTERED: 22, ADOPTED: 41, LOST: 4, DECEASED: 7 },
  cats_by_breed: { Persian: 12, Siamese: 9, 'Maine Coon': 6, 'Golden Retriever': 8, Labrador: 5, Beagle: 7, Mixed: 34 },
};

export const mockShelterDashboard = {
  cats_in_care: 42, pending_intakes: 3, pending_discharges: 2, active_volunteers: 24,
  pending_applications: 4, low_stock_items: 2, monthly_donations: 68500, upcoming_appointments: 5,
};
