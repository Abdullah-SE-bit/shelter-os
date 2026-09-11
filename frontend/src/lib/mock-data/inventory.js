export const mockInventory = [
  { id: 'inv-1', shelter_id: 'shelter-1', item_name: 'Dry cat food (10kg)', category: 'FOOD', quantity: 24, unit: 'bags', low_stock_threshold: 10, last_restocked_at: '2026-09-01T00:00:00Z' },
  { id: 'inv-2', shelter_id: 'shelter-1', item_name: 'Cat litter', category: 'SUPPLIES', quantity: 8, unit: 'bags', low_stock_threshold: 10, last_restocked_at: '2026-08-20T00:00:00Z' },
  { id: 'inv-3', shelter_id: 'shelter-1', item_name: 'Amoxicillin 50mg', category: 'MEDICAL', quantity: 40, unit: 'tablets', low_stock_threshold: 20, last_restocked_at: '2026-08-28T00:00:00Z' },
  { id: 'inv-4', shelter_id: 'shelter-1', item_name: 'Cleaning solution', category: 'SUPPLIES', quantity: 5, unit: 'bottles', low_stock_threshold: 6, last_restocked_at: '2026-08-15T00:00:00Z' },
  { id: 'inv-5', shelter_id: 'shelter-2', item_name: 'Dog food (15kg)', category: 'FOOD', quantity: 15, unit: 'bags', low_stock_threshold: 8, last_restocked_at: '2026-09-03T00:00:00Z' },
];

export const mockInventoryHistory = [
  { id: 'ih-1', item_id: 'inv-1', change: 10, reason: 'Restock', changed_by: 'Jordan Blake', changed_at: '2026-09-01T09:00:00Z' },
  { id: 'ih-2', item_id: 'inv-1', change: -2, reason: 'Daily feeding', changed_by: 'Casey Nguyen', changed_at: '2026-09-05T18:00:00Z' },
  { id: 'ih-3', item_id: 'inv-1', change: -1, reason: 'Daily feeding', changed_by: 'Casey Nguyen', changed_at: '2026-09-06T18:00:00Z' },
];
