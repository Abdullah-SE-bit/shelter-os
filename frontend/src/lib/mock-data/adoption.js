export const mockAdoptionListings = [
  { pet: 'pet-1', name: 'Luna', species: 'CAT', breed_label: 'Persian', gender: 'FEMALE', age_years: 2, age_months: 0, adoption_fee: 0, primary_photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80', shelter_name: 'Happy Paws Shelter', is_neutered: true, is_vaccinated_core: true, is_microchipped: true },
  { pet: 'pet-2', name: 'Oliver', species: 'CAT', breed_label: 'Siamese', gender: 'MALE', age_years: 1, age_months: 3, adoption_fee: 3500, primary_photo_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80', shelter_name: 'Happy Paws Shelter', is_neutered: false, is_vaccinated_core: true, is_microchipped: true },
  { pet: 'pet-3', name: 'Biscuit', species: 'DOG', breed_label: 'Golden Retriever', gender: 'MALE', age_years: 3, age_months: 0, adoption_fee: 5000, primary_photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80', shelter_name: 'Second Chance Animal Rescue', is_neutered: true, is_vaccinated_core: true, is_microchipped: true },
  { pet: 'pet-7', name: 'Buddy', species: 'DOG', breed_label: 'Beagle', gender: 'MALE', age_years: 2, age_months: 6, adoption_fee: 4500, primary_photo_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&q=80', shelter_name: 'Second Chance Animal Rescue', is_neutered: true, is_vaccinated_core: true, is_microchipped: true },
  { pet: 'pet-8', name: 'Coco', species: 'RABBIT', breed_label: 'Mixed Rabbit', gender: 'FEMALE', age_years: 1, age_months: 0, adoption_fee: 1500, primary_photo_url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&q=80', shelter_name: 'Happy Paws Shelter', is_neutered: true, is_vaccinated_core: false, is_microchipped: false },
];

export const mockAdoptionApplications = [
  {
    id: 'app-1', pet: 'pet-1', pet_name: 'Luna', applicant_name: 'Noor Fatima', applicant_email: 'noor.fatima@shelteros.mock',
    shelter_name: 'Happy Paws Shelter', status: 'UNDER_REVIEW', created_at: '2026-09-01T10:00:00Z', compatibility_score: 0.88,
    motivation: "I've always wanted a calm companion pet, and Luna's profile immediately stood out to me.",
  },
  {
    id: 'app-2', pet: 'pet-3', pet_name: 'Biscuit', applicant_name: 'Ahmed Raza', applicant_email: 'ahmed.raza@example.com',
    shelter_name: 'Second Chance Animal Rescue', status: 'INTERVIEW_SCHEDULED', created_at: '2026-08-28T09:00:00Z', compatibility_score: 0.94,
    motivation: 'We have a big backyard and two kids who would love an active dog like Biscuit.', interview_scheduled_at: '2026-09-18T15:00:00Z', interview_format: 'Video call',
  },
  {
    id: 'app-3', pet: 'pet-7', pet_name: 'Buddy', applicant_name: 'Sana Malik', applicant_email: 'sana.malik@example.com',
    shelter_name: 'Second Chance Animal Rescue', status: 'APPROVED', created_at: '2026-08-10T09:00:00Z', compatibility_score: 0.81, motivation: 'Buddy reminds me of a dog I grew up with — I think we would be a great match.',
  },
  {
    id: 'app-4', pet: 'pet-2', pet_name: 'Oliver', applicant_name: 'Hina Iqbal', applicant_email: 'hina.iqbal@example.com',
    shelter_name: 'Happy Paws Shelter', status: 'REJECTED', created_at: '2026-07-22T09:00:00Z', compatibility_score: 0.4,
    motivation: 'Looking for a lap pet for my apartment.', rejection_reason: 'Household includes pet birds; Oliver has a strong prey drive.',
  },
];

export const getAdoptionListing = (petId) => mockAdoptionListings.find((l) => l.pet === petId) || null;
