'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet's default marker images break under bundlers; wire them up
// explicitly so the pin renders. Next.js resolves a static image import to
// a { src, width, height } object, not a plain URL string — unwrap `.src`.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

const PAKISTAN_CENTER = [30.3753, 69.3451];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function ClickToPlace({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// MapContainer only reads center/zoom once (on mount); this keeps the view in
// sync when the city changes or a point is chosen.
function Recenter({ view }) {
  const map = useMap();
  useEffect(() => {
    if (view?.center) map.setView(view.center, view.zoom);
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * Interactive map picker for choosing a shelter's exact location.
 *
 * Props:
 *  - cityName:   selected city label (for search context + messages)
 *  - cityCenter: { lat, lng, radius_km } | null  (constrains the pick)
 *  - latitude / longitude: current value (from parent)
 *  - onChange({ latitude, longitude })
 */
export default function MapLocationPicker({ cityName, cityCenter, latitude, longitude, onChange }) {
  const hasPoint = latitude != null && latitude !== '' && longitude != null && longitude !== '';
  const point = hasPoint ? [Number(latitude), Number(longitude)] : null;

  const cityLatLng = cityCenter ? [cityCenter.lat, cityCenter.lng] : null;
  const radiusKm = cityCenter?.radius_km || 45;

  const [view, setView] = useState({
    center: point || cityLatLng || PAKISTAN_CENTER,
    zoom: point ? 15 : cityLatLng ? 12 : 6,
  });
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState('');

  // Recenter on the city when it changes (and no exact point yet).
  useEffect(() => {
    if (cityLatLng) setView((v) => ({ center: cityLatLng, zoom: point ? v.zoom : 12 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityCenter?.lat, cityCenter?.lng]);

  const outOfCity =
    cityLatLng && point ? haversineKm(cityLatLng[0], cityLatLng[1], point[0], point[1]) > radiusKm : false;

  const pick = (lat, lng) => {
    setMsg('');
    setView({ center: [lat, lng], zoom: 15 });
    onChange({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMsg('');
    try {
      const q = [query.trim(), cityName, 'Pakistan'].filter(Boolean).join(', ');
      const url =
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pk&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        pick(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        setMsg('No matching place found. Try a nearby landmark or area name.');
      }
    } catch {
      setMsg('Search failed. Please check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setMsg('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude),
      (err) => setMsg(`Unable to get your location: ${err.message}`),
    );
  };

  return (
    <div>
      {/* Search + actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={cityName ? `Search a place in ${cityName}…` : 'Search a place…'}
            style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-default)' }}
          />
          <button type="submit" disabled={searching} className="btn btn-secondary btn-sm">
            {searching ? 'Searching…' : '🔍 Search'}
          </button>
        </form>
        <button type="button" onClick={useMyLocation} className="btn btn-secondary btn-sm">📍 Use my location</button>
      </div>

      {/* Map */}
      <div style={{ height: '340px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
        <MapContainer center={view.center} zoom={view.zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={pick} />
          <Recenter view={view} />
          {point && (
            <Marker
              position={point}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  pick(ll.lat, ll.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Hints / status */}
      <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Click on the map or drag the marker to set the exact location{cityName ? ` within ${cityName}` : ''}. You can also
        search for a place or use your current location.
      </div>
      {point && (
        <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          📌 {point[0].toFixed(6)}, {point[1].toFixed(6)}
        </div>
      )}
      {outOfCity && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            background: 'rgba(200,60,60,0.08)',
            border: '1px solid var(--cat-red)',
            color: 'var(--cat-red)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          ⚠️ This point is outside {cityName}. Please pick a location within the city.
        </div>
      )}
      {msg && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--cat-red)' }}>{msg}</div>}
    </div>
  );
}
