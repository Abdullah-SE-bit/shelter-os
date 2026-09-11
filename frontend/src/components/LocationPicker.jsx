import { useState, useEffect } from 'react';

/**
 * LocationPicker Component
 * 
 * A reusable location selection component that provides:
 * - Manual coordinate entry (latitude/longitude)
 * - City/address input for context
 * - Visual map preview (opens Google Maps)
 * - Validation for coordinate ranges
 * 
 * @param {Object} props
 * @param {number} props.latitude - Initial latitude value
 * @param {number} props.longitude - Initial longitude value
 * @param {string} props.city - City or address for context
 * @param {Function} props.onChange - Callback with { latitude, longitude, city }
 * @param {boolean} props.required - Whether location is required
 * @param {string} props.label - Label for the location picker
 */
export default function LocationPicker({
  latitude: initialLat,
  longitude: initialLng,
  city: initialCity = '',
  onChange,
  required = false,
  label = 'Location',
}) {
  const [latitude, setLatitude] = useState(initialLat || '');
  const [longitude, setLongitude] = useState(initialLng || '');
  const [city, setCity] = useState(initialCity);
  const [error, setError] = useState('');

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        city,
      });
    }
  }, [latitude, longitude, city]);

  // Validate coordinates
  const validateCoordinates = () => {
    if (!latitude || !longitude) {
      if (required) {
        setError('Both latitude and longitude are required');
        return false;
      }
      setError('');
      return true;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Coordinates must be valid numbers');
      return false;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return false;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return false;
    }

    setError('');
    return true;
  };

  // Handle view on map
  const handleViewOnMap = () => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
      }
    }
  };

  // Handle get current location (if browser supports)
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          setError('');
        },
        (error) => {
          setError(`Unable to get location: ${error.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const hasValidCoords = latitude && longitude && !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Label */}
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}>
        {label}
        {required && <span style={{ color: 'var(--pet-red)', marginLeft: '0.25rem' }}>*</span>}
      </label>

      {/* City/Address Input */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{
          display: 'block',
          marginBottom: '0.375rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}>
          City / Address (for context)
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g., San Francisco, CA"
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            fontSize: '0.9375rem',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--pet-sage)'}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-default)';
          }}
        />
      </div>

      {/* Coordinates Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '0.75rem',
      }}>
        {/* Latitude */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.375rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}>
            Latitude
            {required && <span style={{ color: 'var(--pet-red)', marginLeft: '0.25rem' }}>*</span>}
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            onBlur={validateCoordinates}
            placeholder="e.g., 37.7749"
            required={required}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontFamily: 'monospace',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--pet-sage)'}
            onBlur={(e) => {
              validateCoordinates();
              e.target.style.borderColor = 'var(--border-default)';
            }}
          />
        </div>

        {/* Longitude */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.375rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}>
            Longitude
            {required && <span style={{ color: 'var(--pet-red)', marginLeft: '0.25rem' }}>*</span>}
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            onBlur={validateCoordinates}
            placeholder="e.g., -122.4194"
            required={required}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              fontSize: '0.9375rem',
              fontFamily: 'monospace',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--pet-sage)'}
            onBlur={(e) => {
              validateCoordinates();
              e.target.style.borderColor = 'var(--border-default)';
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '0.75rem',
          background: 'var(--pet-red-light)',
          border: '1px solid var(--pet-red)',
          borderRadius: '10px',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          color: 'var(--pet-red)',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        {/* Get Current Location */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--pet-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <span>📍</span>
          Use My Location
        </button>

        {/* View on Map */}
        {hasValidCoords && (
          <button
            type="button"
            onClick={handleViewOnMap}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--pet-sage)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>🗺️</span>
            View on Map
          </button>
        )}

        {/* Clear Location */}
        {(latitude || longitude) && (
          <button
            type="button"
            onClick={() => {
              setLatitude('');
              setLongitude('');
              setError('');
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--surface-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-section)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
          >
            Clear
          </button>
        )}
      </div>

      {/* Helper Text */}
      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.8125rem',
        color: 'var(--text-tertiary)',
        lineHeight: 1.5,
      }}>
        💡 <strong>Tip:</strong> You can use{' '}
        <a
          href="https://www.google.com/maps"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--pet-blue)', textDecoration: 'none' }}
        >
          Google Maps
        </a>
        {' '}to find coordinates. Right-click any location and select the coordinates to copy them.
      </div>
    </div>
  );
}
