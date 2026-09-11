export const formatCurrency = (amount, currency = 'PKR') =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(amount || 0);

export const formatPetAge = (years, months) => {
  const y = Number(years) || 0;
  const m = Number(months) || 0;
  if (!y && !m) return 'Unknown age';
  if (y === 0) return `${m} month${m !== 1 ? 's' : ''}`;
  if (m === 0) return `${y} year${y !== 1 ? 's' : ''}`;
  return `${y}y ${m}m`;
};

export const formatPercent = (value) => `${Math.round(value || 0)}%`;

export const statusLabel = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const petGenderLabel = (gender) => {
  const map = { MALE: '♂ Male', FEMALE: '♀ Female', UNKNOWN: '? Unknown' };
  return map[gender] || gender;
};

export const truncate = (str, max = 60) =>
  !str ? '' : str.length <= max ? str : str.slice(0, max) + '…';

export const initials = (firstName, lastName) => {
  const f = firstName?.[0] || '';
  const l = lastName?.[0] || '';
  return (f + l).toUpperCase() || '?';
};

// Re-export date utilities so pages can import from either file
export { formatDate, formatDateTime, timeAgo } from './dateUtils.js';
