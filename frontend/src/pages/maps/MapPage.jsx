import { useState } from 'react';
import { sheltersApi } from '../../api/sheltersApi';
import { lostFoundApi } from '../../api/lostFoundApi';
import useApi from '../../hooks/useApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function MapPage() {
  const [filterType, setFilterType] = useState('ALL');
  
  // Fetch shelters with location data
  const { data: sheltersData, loading: sheltersLoading } = useApi(() => sheltersApi.list());
  const shelters = (Array.isArray(sheltersData) ? sheltersData : sheltersData?.data || []).filter(s => s.latitude && s.longitude);

  // Fetch lost/found alerts with location
  const { data: alertsData, loading: alertsLoading } = useApi(() => lostFoundApi.listLost());
  const alerts = (Array.isArray(alertsData) ? alertsData : alertsData?.data || []).filter(a => a.last_seen_latitude && a.last_seen_longitude);

  const loading = sheltersLoading || alertsLoading;

  // Combine all locations
  const locations = [
    ...shelters.map(s => ({
      type: 'SHELTER',
      id: s.id,
      name: s.name,
      lat: s.latitude,
      lng: s.longitude,
      city: s.city,
      capacity: s.capacity_total,
      occupancy: s.current_occupancy,
      icon: '🏠',
      color: 'var(--cat-sage)',
    })),
    ...alerts.map(a => ({
      type: 'LOST_ALERT',
      id: a.id,
      name: `Lost: ${a.cat_name || 'Cat'}`,
      lat: a.last_seen_latitude,
      lng: a.last_seen_longitude,
      city: a.last_seen_city,
      date: a.reported_at,
      icon: '🔍',
      color: 'var(--cat-amber)',
    })),
  ];

  const filteredLocations = filterType === 'ALL' 
    ? locations 
    : locations.filter(l => l.type === filterType);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--cat-sage), var(--cat-blue))',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ position: 'absolute', right: '2rem', bottom: '-0.5rem', fontSize: '6rem', opacity: 0.1 }}>🗺️</div>
        <h1 style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '2rem', fontFamily: 'Playfair Display, serif' }}>
          Location Map
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.9375rem' }}>
          View shelters and lost cat locations on the map
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { value: 'ALL', label: 'All Locations', icon: '🗺️' },
          { value: 'SHELTER', label: 'Shelters', icon: '🏠' },
          { value: 'LOST_ALERT', label: 'Lost Cats', icon: '🔍' },
        ].map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            style={{
              background: filterType === value ? 'var(--cat-terra)' : 'var(--surface-card)',
              color: filterType === value ? 'white' : 'var(--text-primary)',
              border: filterType === value ? 'none' : '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '0.625rem 1.125rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Empty State */}
      {!loading && filteredLocations.length === 0 && (
        <EmptyState
          icon="🗺️"
          title="No locations found"
          message={
            filterType === 'ALL'
              ? 'No locations with coordinates available yet.'
              : filterType === 'SHELTER'
              ? 'No shelters with location data found.'
              : 'No lost cat alerts with location data found.'
          }
        />
      )}

      {/* Location Cards Grid */}
      {!loading && filteredLocations.length > 0 && (
        <>
          {/* Summary */}
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9375rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}>
            <span style={{ fontSize: '1.25rem' }}>📍</span>
            <span>
              Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredLocations.length}</strong> location{filteredLocations.length !== 1 ? 's' : ''}
              {filterType !== 'ALL' && ` (${filterType === 'SHELTER' ? 'Shelters' : 'Lost Cats'})`}
            </span>
          </div>

          {/* Location Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem',
          }}>
            {filteredLocations.map((location) => (
              <div
                key={`${location.type}-${location.id}`}
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: `2px solid ${location.color}`,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {/* Icon & Type Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: `${location.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                  }}>
                    {location.icon}
                  </div>
                  <span style={{
                    background: `${location.color}20`,
                    color: location.color,
                    padding: '0.375rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {location.type === 'SHELTER' ? 'Shelter' : 'Lost Cat'}
                  </span>
                </div>

                {/* Name */}
                <h3 style={{
                  margin: '0 0 0.75rem',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>
                  {location.name}
                </h3>

                {/* Location Info */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                  }}>
                    <span>📍</span>
                    <span>{location.city || 'Location not specified'}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'monospace',
                  }}>
                    <span>🌐</span>
                    <span>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                  </div>
                </div>

                {/* Type-specific details */}
                {location.type === 'SHELTER' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-default)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                        Capacity
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cat-sage)' }}>
                        {location.capacity || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                        Occupancy
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cat-amber)' }}>
                        {location.occupancy || 0}
                      </div>
                    </div>
                  </div>
                )}

                {location.type === 'LOST_ALERT' && location.date && (
                  <div style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-default)',
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                      Reported
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {new Date(location.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                )}

                {/* View on External Map Button */}
                <button
                  onClick={() => window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')}
                  style={{
                    width: '100%',
                    marginTop: '1rem',
                    padding: '0.625rem',
                    background: location.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  View on Google Maps →
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
