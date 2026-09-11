export const mockInventory = [
  { id: 'inv-1', shelter_id: 'shelter-1', name: 'Dry cat food (10kg)', category: 'FOOD', current_quantity: 24, unit: 'bags', minimum_threshold: 10 },
  { id: 'inv-2', shelter_id: 'shelter-1', name: 'Cat litter', category: 'CLEANING', current_quantity: 8, unit: 'bags', minimum_threshold: 10 },
  { id: 'inv-3', shelter_id: 'shelter-1', name: 'Amoxicillin 50mg', category: 'MEDICINE', current_quantity: 40, unit: 'tablets', minimum_threshold: 20 },
  { id: 'inv-4', shelter_id: 'shelter-1', name: 'Cleaning solution', category: 'CLEANING', current_quantity: 5, unit: 'bottles', minimum_threshold: 6 },
  { id: 'inv-5', shelter_id: 'shelter-1', name: 'Dog food (15kg)', category: 'FOOD', current_quantity: 15, unit: 'bags', minimum_threshold: 8 },
  { id: 'inv-6', shelter_id: 'shelter-1', name: 'Bedding & blankets', category: 'BEDDING', current_quantity: 12, unit: 'units', minimum_threshold: 5 },
].map((i) => ({ ...i, is_low_stock: i.current_quantity <= i.minimum_threshold }));

export const mockInventoryHistory = [
  { id: 'ih-1', item_id: 'inv-1', adjustment: 10, notes: 'Restock', adjusted_by_name: 'Jordan Blake', adjusted_at: '2026-09-01T09:00:00Z', balance_after: 24 },
  { id: 'ih-2', item_id: 'inv-1', adjustment: -2, notes: 'Daily feeding', adjusted_by_name: 'Casey Nguyen', adjusted_at: '2026-09-05T18:00:00Z', balance_after: 22 },
  { id: 'ih-3', item_id: 'inv-1', adjustment: -1, notes: 'Daily feeding', adjusted_by_name: 'Casey Nguyen', adjusted_at: '2026-09-06T18:00:00Z', balance_after: 21 },
];

export const getInventoryItem = (id) => mockInventory.find((i) => i.id === id) || null;
