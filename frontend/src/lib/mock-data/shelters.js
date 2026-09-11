export const mockShelters = [
  {
    id: 'shelter-1', name: 'Happy Paws Shelter', city: 'Islamabad', address: 'F-7 Markaz, Islamabad',
    latitude: 33.7294, longitude: 73.0931, phone: '+923001234567', email: 'contact@happypaws.org',
    capacity: 60, current_occupancy: 42, description: 'A no-kill shelter serving Islamabad since 2015, specializing in cat and small-animal rescue.',
    is_verified: true, admin_name: 'Jordan Blake', staff_count: 8, volunteer_count: 24, created_at: '2015-03-10T00:00:00Z',
  },
  {
    id: 'shelter-2', name: 'Second Chance Animal Rescue', city: 'Lahore', address: 'Gulberg III, Lahore',
    latitude: 31.5099, longitude: 74.3436, phone: '+923011234567', email: 'hello@secondchance.org',
    capacity: 90, current_occupancy: 67, description: 'Multi-species shelter with a strong foster network across Lahore and surrounding areas.',
    is_verified: true, admin_name: 'Amina Hassan', staff_count: 12, volunteer_count: 38, created_at: '2018-07-22T00:00:00Z',
  },
  {
    id: 'shelter-3', name: 'Karachi Companion Care', city: 'Karachi', address: 'DHA Phase 5, Karachi',
    latitude: 24.8138, longitude: 67.0653, phone: '+923021234567', email: 'info@companioncare.org',
    capacity: 45, current_occupancy: 31, description: 'Focused on street-animal rescue, sterilization, and rehoming across Karachi.',
    is_verified: false, admin_name: 'Fatima Sheikh', staff_count: 6, volunteer_count: 15, created_at: '2021-01-05T00:00:00Z',
  },
];

export const getShelterById = (id) => mockShelters.find((s) => s.id === id) || null;

export const mockCities = [
  { id: 'city-1', display_label: 'Islamabad', metadata: { lat: 33.6844, lng: 73.0479, radius_km: 45 } },
  { id: 'city-2', display_label: 'Lahore', metadata: { lat: 31.5497, lng: 74.3436, radius_km: 45 } },
  { id: 'city-3', display_label: 'Karachi', metadata: { lat: 24.8607, lng: 67.0011, radius_km: 45 } },
  { id: 'city-4', display_label: 'Peshawar', metadata: { lat: 34.0151, lng: 71.5249, radius_km: 40 } },
];
