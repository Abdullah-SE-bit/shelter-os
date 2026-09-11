export const mockRescueReports = [
  {
    id: 'rescue-1', description: 'Injured pet found near the market, limping on front leg.', urgency_level: 'HIGH', status: 'PENDING',
    reporter_name: 'Anonymous', reported_at: '2026-09-09T08:00:00Z', latitude: 33.7100, longitude: 73.0550,
    assigned_employee: null, assigned_employee_name: null, assigned_shelter_name: null, pet_condition_notes: 'Visible limp, otherwise alert and responsive.',
  },
  {
    id: 'rescue-2', description: 'Litter of kittens abandoned in a cardboard box behind a restaurant.', urgency_level: 'CRITICAL', status: 'ASSIGNED',
    reporter_name: 'Zainab Ali', reported_at: '2026-09-08T16:30:00Z', latitude: 31.5200, longitude: 74.3600,
    assigned_employee: 'vol-2', assigned_employee_name: 'Priya Singh', assigned_shelter_name: 'Second Chance Animal Rescue', pet_condition_notes: 'Four kittens, approx. 3-4 weeks old, need bottle feeding.',
  },
  {
    id: 'rescue-3', description: 'Dog stuck in a drainage ditch after heavy rain.', urgency_level: 'MEDIUM', status: 'RESOLVED',
    reporter_name: 'Usman Tariq', reported_at: '2026-08-20T12:00:00Z', latitude: 24.8500, longitude: 67.0300,
    assigned_employee: 'vol-1', assigned_employee_name: 'Casey Nguyen', assigned_shelter_name: 'Happy Paws Shelter',
    pet_condition_notes: 'Cold and shaken but uninjured.', resolved_at: '2026-08-20T15:00:00Z',
    resolution_notes: 'Safely retrieved and warmed up; owner identified via microchip and reunited same day.',
  },
];

export const getRescueById = (id) => mockRescueReports.find((r) => r.id === id) || null;

export const mockRescueSuggestions = {
  ranked_employees: [
    { employee_id: 'vol-1', name: 'Casey Nguyen', distance_km: 2.4, active_assignments: 1, available_now: true, score: 0.92 },
    { employee_id: 'vol-2', name: 'Priya Singh', distance_km: 6.1, active_assignments: 2, available_now: true, score: 0.71 },
    { employee_id: 'vol-3', name: 'Hamza Farooq', distance_km: 9.8, active_assignments: 0, available_now: false, score: 0.44 },
  ],
  nearest_shelters: [
    { shelter_id: 'shelter-1', name: 'Happy Paws Shelter', distance_km: 3.1 },
    { shelter_id: 'shelter-2', name: 'Second Chance Animal Rescue', distance_km: 11.4 },
  ],
};

export const mockEmployeeAssignments = [
  {
    id: 'asgn-1', assignment_type: 'RESCUE_PICKUP', rescue_description: 'Litter of kittens abandoned behind a restaurant', rescue_id: 'rescue-2',
    status: 'ACCEPTED', scheduled_at: '2026-09-10T09:00:00Z', shelter_name: 'Second Chance Animal Rescue', notes: 'Bring a carrier and warm blankets.',
  },
  {
    id: 'asgn-2', assignment_type: 'DOG_WALKING', rescue_description: 'Daily walk — Buddy', rescue_id: null,
    status: 'IN_PROGRESS', scheduled_at: '2026-09-12T07:00:00Z', shelter_name: 'Second Chance Animal Rescue', notes: '',
  },
  {
    id: 'asgn-3', assignment_type: 'TRANSPORT', rescue_description: 'Transport Rex to adoption event', rescue_id: null,
    status: 'COMPLETED', scheduled_at: '2026-08-15T10:00:00Z', shelter_name: 'Second Chance Animal Rescue', notes: 'Completed without issue.',
  },
  {
    id: 'asgn-4', assignment_type: 'FOSTER_CHECKIN', rescue_description: 'Weekly check-in — Mochi foster', rescue_id: null,
    status: 'PENDING', scheduled_at: '2026-09-16T14:00:00Z', shelter_name: 'Happy Paws Shelter', notes: '',
  },
];
