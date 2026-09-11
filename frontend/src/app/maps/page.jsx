'use client';

import { useState } from 'react';
import { Map, Building2, Search, MapPin, Globe2, ExternalLink } from 'lucide-react';
import { mockShelters } from '@/lib/mock-data/shelters';
import { mockLostAlerts } from '@/lib/mock-data/lostFound';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'ALL', label: 'All locations', icon: Map },
  { value: 'SHELTER', label: 'Shelters', icon: Building2 },
  { value: 'LOST_ALERT', label: 'Lost pets', icon: Search },
];

const TYPE_META = {
  SHELTER: { icon: Building2, label: 'Shelter', tone: 'border-success/40', chip: 'bg-success/10 text-success' },
  LOST_ALERT: { icon: Search, label: 'Lost pet', chip: 'bg-warning/10 text-warning', tone: 'border-warning/40' },
};

export default function MapPage() {
  const [filterType, setFilterType] = useState('ALL');

  const shelters = mockShelters.filter((s) => s.latitude && s.longitude);
  const alerts = mockLostAlerts.filter((a) => a.last_seen_latitude && a.last_seen_longitude);

  const locations = [
    ...shelters.map((s) => ({
      type: 'SHELTER', id: s.id, name: s.name, lat: s.latitude, lng: s.longitude,
      city: s.city, capacity: s.capacity, occupancy: s.current_occupancy,
    })),
    ...alerts.map((a) => ({
      type: 'LOST_ALERT', id: a.id, name: `Lost: ${a.pet_name || 'Pet'}`, lat: a.last_seen_latitude,
      lng: a.last_seen_longitude, city: a.last_seen_city, date: a.last_seen_at,
    })),
  ];

  const filteredLocations = filterType === 'ALL' ? locations : locations.filter((l) => l.type === filterType);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
      <PageHeader title="Location map" description="View shelters and lost pet locations" />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
              filterType === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-border-strong',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <EmptyState
          icon={Map}
          title="No locations found"
          message={filterType === 'ALL' ? 'No locations with coordinates available yet.' : filterType === 'SHELTER' ? 'No shelters with location data found.' : 'No lost pet alerts with location data found.'}
        />
      )}

      {filteredLocations.length > 0 && (
        <>
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Showing <strong className="text-foreground">{filteredLocations.length}</strong> location{filteredLocations.length !== 1 ? 's' : ''}
            {filterType !== 'ALL' && ` (${filterType === 'SHELTER' ? 'Shelters' : 'Lost Pets'})`}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLocations.map((location) => {
              const meta = TYPE_META[location.type];
              return (
                <div key={`${location.type}-${location.id}`} className={cn('rounded-xl border-2 bg-card p-5 shadow-sm transition-shadow hover:shadow-md', meta.tone)}>
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className={cn('flex size-12 items-center justify-center rounded-xl', meta.chip)}>
                      <meta.icon className="size-6" />
                    </div>
                    <span className={cn('rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase', meta.chip)}>{meta.label}</span>
                  </div>

                  <h3 className="mb-2.5 text-[17px] font-bold text-foreground">{location.name}</h3>

                  <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {location.city || 'Location not specified'}
                  </div>
                  <div className="mb-3 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Globe2 className="size-3.5" />
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>

                  {location.type === 'SHELTER' && (
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div>
                        <div className="mb-0.5 text-xs text-muted-foreground">Capacity</div>
                        <div className="text-lg font-bold text-success">{location.capacity || 0}</div>
                      </div>
                      <div>
                        <div className="mb-0.5 text-xs text-muted-foreground">Occupancy</div>
                        <div className="text-lg font-bold text-warning">{location.occupancy || 0}</div>
                      </div>
                    </div>
                  )}

                  {location.type === 'LOST_ALERT' && location.date && (
                    <div className="border-t border-border pt-3">
                      <div className="mb-0.5 text-xs text-muted-foreground">Reported</div>
                      <div className="text-sm font-semibold text-foreground">
                        {new Date(location.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )}

                  <Button variant="secondary" className="mt-4 w-full" onClick={() => window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')}>
                    <ExternalLink className="size-3.5" />
                    View on Google Maps
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
