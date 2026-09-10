export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1';

export const ROLES = {
  SUPER_ADMIN:   'SUPER_ADMIN',
  SHELTER_ADMIN: 'SHELTER_ADMIN',
  VET:           'VET',
  VOLUNTEER:     'VOLUNTEER',
  CAT_OWNER:     'CAT_OWNER',
  ADOPTER:       'ADOPTER',
};

export const CAT_STATUSES = {
  UNKNOWN:    'UNKNOWN',
  IN_SHELTER: 'IN_SHELTER',
  FOSTERED:   'FOSTERED',
  ADOPTED:    'ADOPTED',
  LOST:       'LOST',
  DECEASED:   'DECEASED',
};

export const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const URGENCY_CSS = {
  LOW:      'urgency-low',
  MEDIUM:   'urgency-medium',
  HIGH:     'urgency-high',
  CRITICAL: 'urgency-critical',
};

export const STATUS_CSS = {
  IN_SHELTER: 'status-in_shelter',
  FOSTERED:   'status-fostered',
  ADOPTED:    'status-adopted',
  LOST:       'status-lost',
  DECEASED:   'status-deceased',
  UNKNOWN:    'status-unknown',
};

export const CAT_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&q=80',
  'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&q=80',
  'https://images.unsplash.com/photo-1596854407944-bf87f6fdd049?w=400&q=80',
  'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&q=80',
];

export const NAV_CAT_FACTS = [
  'Cats sleep 12–16 hours a day 😴',
  'A group of cats is called a clowder 🐱',
  'Cats have 32 muscles in each ear 👂',
  'A cat\'s purr can heal bones 🦴',
  'Cats can jump 6× their own length 🐾',
];
