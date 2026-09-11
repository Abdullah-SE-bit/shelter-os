export const mockBreeds = [
  { id: 'b1', value: 'PERSIAN', display_label: 'Persian' },
  { id: 'b2', value: 'SIAMESE', display_label: 'Siamese' },
  { id: 'b3', value: 'MAINE_COON', display_label: 'Maine Coon' },
  { id: 'b4', value: 'GOLDEN_RETRIEVER', display_label: 'Golden Retriever' },
  { id: 'b5', value: 'LABRADOR', display_label: 'Labrador Retriever' },
  { id: 'b6', value: 'BEAGLE', display_label: 'Beagle' },
  { id: 'b7', value: 'RABBIT_MIX', display_label: 'Mixed Rabbit' },
  { id: 'b8', value: 'MIXED', display_label: 'Mixed Breed' },
];

export const mockPets = [
  {
    id: 'pet-1', name: 'Luna', species: 'CAT', breed_label: 'Persian', gender: 'FEMALE', age_years: 2, age_months: 0,
    color: 'White', current_status: 'IN_SHELTER', primary_photo_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80'],
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', owner_name: null, is_vaccinated_core: true, is_neutered: true,
    is_microchipped: true, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 0,
    description: 'Luna is a gentle, affectionate Persian who loves quiet laps and sunny windowsills. She gets along well with other calm pets.',
    adoption_requirements: 'A quiet home with regular grooming for her long coat.',
  },
  {
    id: 'pet-2', name: 'Oliver', species: 'CAT', breed_label: 'Siamese', gender: 'MALE', age_years: 1, age_months: 3,
    color: 'Seal Point', current_status: 'IN_SHELTER', primary_photo_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&q=80'],
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', owner_name: null, is_vaccinated_core: true, is_neutered: false,
    is_microchipped: true, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 3500,
    description: 'Oliver is vocal, playful, and endlessly curious. He would do best as an only pet with an active family.',
    adoption_requirements: 'No small pets — Oliver has a strong prey drive toward birds.',
  },
  {
    id: 'pet-3', name: 'Biscuit', species: 'DOG', breed_label: 'Golden Retriever', gender: 'MALE', age_years: 3, age_months: 0,
    color: 'Golden', current_status: 'IN_SHELTER', primary_photo_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80'],
    shelter_id: 'shelter-2', shelter_name: 'Second Chance Animal Rescue', owner_name: null, is_vaccinated_core: true, is_neutered: true,
    is_microchipped: true, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 5000,
    description: 'Biscuit is a friendly, well-trained Golden who loves fetch and long walks. Great with kids of all ages.',
    adoption_requirements: 'A yard or access to regular outdoor exercise.',
  },
  {
    id: 'pet-4', name: 'Mochi', species: 'CAT', breed_label: 'Maine Coon', gender: 'FEMALE', age_years: 0, age_months: 8,
    color: 'Brown Tabby', current_status: 'FOSTERED', primary_photo_url: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600&q=80'],
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', owner_name: null, is_vaccinated_core: true, is_neutered: false,
    is_microchipped: false, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 4000,
    description: 'Mochi is a playful Maine Coon kitten currently thriving in a foster home. Loves toys and climbing.',
    adoption_requirements: 'A pet tree or vertical space is strongly recommended.',
  },
  {
    id: 'pet-5', name: 'Rex', species: 'DOG', breed_label: 'Labrador Retriever', gender: 'MALE', age_years: 4, age_months: 0,
    color: 'Black', current_status: 'ADOPTED', primary_photo_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&q=80'],
    shelter_id: 'shelter-2', shelter_name: 'Second Chance Animal Rescue', owner_name: 'Amina Hassan', is_vaccinated_core: true, is_neutered: true,
    is_microchipped: true, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 0,
    description: 'Rex found his forever home in 2025. A loyal, calm companion who loves swimming.',
    adoption_requirements: '',
  },
  {
    id: 'pet-6', name: 'Whiskers', species: 'CAT', breed_label: 'Mixed Breed', gender: 'MALE', age_years: 5, age_months: 0,
    color: 'Orange Tabby', current_status: 'LOST', primary_photo_url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&q=80'],
    shelter_id: null, shelter_name: null, owner_name: 'Bilal Ahmed', is_vaccinated_core: true, is_neutered: true,
    is_microchipped: true, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 0,
    description: 'Whiskers went missing near Park Road on 2026-02-14. Friendly and responds to his name.',
    adoption_requirements: '',
  },
  {
    id: 'pet-7', name: 'Buddy', species: 'DOG', breed_label: 'Beagle', gender: 'MALE', age_years: 2, age_months: 6,
    color: 'Tricolor', current_status: 'IN_SHELTER', primary_photo_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&q=80'],
    shelter_id: 'shelter-2', shelter_name: 'Second Chance Animal Rescue', owner_name: null, is_vaccinated_core: true, is_neutered: true,
    is_microchipped: true, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 4500,
    description: 'Buddy is a cheerful, food-motivated Beagle who loves nose work games and other dogs.',
    adoption_requirements: 'Secure fencing recommended — Beagles are natural wanderers.',
  },
  {
    id: 'pet-8', name: 'Coco', species: 'RABBIT', breed_label: 'Mixed Rabbit', gender: 'FEMALE', age_years: 1, age_months: 0,
    color: 'White & Brown', current_status: 'IN_SHELTER', primary_photo_url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&q=80',
    photos: ['https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&q=80'],
    shelter_id: 'shelter-1', shelter_name: 'Happy Paws Shelter', owner_name: null, is_vaccinated_core: false, is_neutered: true,
    is_microchipped: false, is_dewormed: true, is_fiv_positive: false, is_felv_positive: false, adoption_fee: 1500,
    description: 'Coco is a gentle, litter-trained rabbit who enjoys leafy greens and quiet company.',
    adoption_requirements: 'An appropriately sized hutch or free-roam bunny-proofed space.',
  },
];

export const getPetById = (id) => mockPets.find((c) => c.id === id) || null;

export const mockPetSpeciesLabel = { CAT: 'Cat', DOG: 'Dog', RABBIT: 'Rabbit' };
