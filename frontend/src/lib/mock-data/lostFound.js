export const mockLostAlerts = [
  {
    id: 'lost-1', title: 'Lost orange tabby near Park Road', cat_name: 'Whiskers', status: 'ACTIVE', match_count: 1,
    description: 'Orange tabby, medium size, white paws, very friendly and responds to his name.', reporter: 'u-8', reporter_name: 'Bilal Ahmed',
    last_seen_at: '2026-09-07T18:00:00Z', last_seen_latitude: 33.7050, last_seen_longitude: 73.0480,
    contact_phone: '+923071234567', contact_email: 'bilal.ahmed@shelteros.mock', behavioral_notes: 'Shy around strangers at first, warms up quickly with food.',
    created_at: '2026-09-07T19:00:00Z', photos: ['https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&q=80'],
  },
  {
    id: 'lost-2', title: 'Missing beagle, last seen near the park', cat_name: 'Duke', status: 'RESOLVED', match_count: 0,
    description: 'Tricolor beagle, wearing a red collar with tags.', reporter: 'u-9', reporter_name: 'Noor Fatima',
    last_seen_at: '2026-08-01T10:00:00Z', last_seen_latitude: 31.5150, last_seen_longitude: 74.3550,
    contact_phone: '+923081234567', contact_email: 'noor.fatima@shelteros.mock', behavioral_notes: 'Very friendly with people, timid around loud noises.',
    created_at: '2026-08-01T11:00:00Z', photos: [],
  },
];

export const mockFoundReports = [
  {
    id: 'found-1', description: 'Found a calm grey cat wandering near the bazaar, no collar.', status: 'OPEN', match_count: 1,
    breed_guess: 'Mixed Breed', color_tags: ['Grey'], reporter_name: 'Zainab Ali', found_at: '2026-09-08T12:00:00Z', created_at: '2026-09-08T12:30:00Z',
    found_latitude: 33.7080, found_longitude: 73.0500, contact_phone: '+923091234567', contact_email: 'zainab.ali@example.com',
    photos: [], resolved_cat: null, shelter_name: null,
  },
  {
    id: 'found-2', description: 'Small brown dog found near the highway exit, seems well cared for.', status: 'SHELTERED', match_count: 0,
    breed_guess: 'Mixed Breed', color_tags: ['Brown'], reporter_name: 'Usman Tariq', found_at: '2026-08-25T09:00:00Z', created_at: '2026-08-25T09:15:00Z',
    found_latitude: 24.8600, found_longitude: 67.0400, contact_phone: '', contact_email: '',
    photos: [], resolved_cat: 'cat-3', shelter_name: 'Second Chance Animal Rescue',
  },
];

export const getLostAlertById = (id) => mockLostAlerts.find((a) => a.id === id) || null;
export const getFoundReportById = (id) => mockFoundReports.find((r) => r.id === id) || null;

export const mockMatches = [
  {
    id: 'match-1', status: 'PENDING', score: 0.86, score_pct: 86,
    lost_alert: { id: 'lost-1', title: 'Lost orange tabby near Park Road', cat_name: 'Whiskers', description: 'Orange tabby, medium size, white paws.', reporter_name: 'Bilal Ahmed', last_seen_at: '2026-09-07T18:00:00Z', reporter: 'u-8', photos: [] },
    found_report: { id: 'found-1', description: 'Found a calm grey cat wandering near the bazaar.', reporter_name: 'Zainab Ali', created_at: '2026-09-08T12:30:00Z', contact_phone: '+923091234567', photos: [] },
  },
];
