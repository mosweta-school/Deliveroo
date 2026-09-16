// frontend/src/components/common/AddressAutocomplete.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin, Crosshair, Loader } from 'lucide-react';

// ============================================================
// Address component helpers
// ============================================================
const pickComponent = (components, types) => {
  if (!components) return '';
  for (const type of types) {
    const found = components.find((c) => c.types.includes(type));
    if (found) return found.long_name;
  }
  return '';
};

const extractCity = (components) =>
  pickComponent(components, [
    'locality',
    'postal_town',
    'sublocality_level_1',
    'sublocality',
    'administrative_area_level_2',
    'administrative_area_level_1',
  ]);

const extractCounty = (components) =>
  pickComponent(components, [
    'administrative_area_level_1',
    'administrative_area_level_2',
    'administrative_area_level_3',
  ]);

/**
 * Compose the richest display address we can from a Google place.
 *
 * Why not just use formatted_address? For businesses and landmarks,
 * Google often omits the name — picking "Quiver Kilimani" gives
 * "Ngong Road, Nairobi, Kenya", losing both the business name AND the
 * sublocality. Composing from components keeps both.
 */
const buildDisplayAddress = (place) => {
  const name = (place.name || '').trim();
  const formatted = (place.formatted_address || '').trim();
  const components = place.address_components || [];

  const get = (type) => {
    const c = components.find((x) => x.types.includes(type));
    return c ? c.long_name : '';
  };

  const route = get('route');
  const streetNumber = get('street_number');
  const sublocality = get('sublocality_level_1') || get('sublocality');
  const locality = get('locality');
  const county = get('administrative_area_level_1');

  const parts = [
    name,
    sublocality && sublocality.toLowerCase() !== name.toLowerCase() ? sublocality : '',
    [streetNumber, route].filter(Boolean).join(' '),
    locality,
    county,
  ]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .filter((s, i, arr) => s.toLowerCase() !== (arr[i - 1] || '').toLowerCase());

  if (parts.length >= 2) return parts.join(', ');
  if (formatted) return formatted;
  if (name) return name;
  return parts.join(', ');
};

// ============================================================
// Component
// ============================================================
const AddressAutocomplete = ({
  label,
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  required,
  showCurrentLocation = false,
  streetAddress = '',
  onStreetAddressChange,
  showStreetAddress = true,
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const isGoogleUpdateRef = useRef(false);
  const [isLocating, setIsLocating] = useState(false);

  // Controlled input — the single source of truth for what's shown.
  const [inputValue, setInputValue] = useState(value || '');
  const [hasSelectedPlace, setHasSelectedPlace] = useState(false);

  // Keep the latest callbacks / props in refs so the Autocomplete setup
  // effect can depend on [] and never re-run mid-life. Without this, a
  // parent re-render would tear down and recreate the widget, and Google
  // gets confused about which input owns the shared .pac-container.
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const streetAddressRef = useRef(streetAddress);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    streetAddressRef.current = streetAddress;
  }, [onPlaceSelect, streetAddress]);

  // Sync from parent when `value` changes externally (draft restore,
  // form reset). Only overwrite when it actually differs so we don't
  // fight the user while they type.
  useEffect(() => {
    const incoming = value || '';
    setInputValue((current) => (current === incoming ? current : incoming));
    if (incoming) setHasSelectedPlace(true);
  }, [value]);

  // ---- Initialize Google Places Autocomplete (once per mount) ----
  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current) return;
    if (autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: 'ke' },
        fields: [
          'formatted_address',
          'geometry',
          'address_components',
          'name',
          'place_id',
        ],
        types: ['establishment', 'geocode'],
      }
    );

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      console.log('📍 [Autocomplete] place selected', {
        name: place?.name,
        formatted_address: place?.formatted_address,
        componentTypes: place?.address_components?.map((c) => c.types[0]),
      });

      if (!place || !place.geometry || !place.geometry.location) {
        console.warn('⚠️ [Autocomplete] place has no geometry');
        return;
      }

      const latitude = place.geometry.location.lat();
      const longitude = place.geometry.location.lng();

      const city = extractCity(place.address_components);
      const county = extractCounty(place.address_components);
      const finalAddress = buildDisplayAddress(place);

      if (!finalAddress) {
        console.error('❌ [Autocomplete] could not build address from place');
        return;
      }

      const placeData = {
        address: finalAddress,
        city,
        county,
        latitude,
        longitude,
        street_address: streetAddressRef.current || '',
      };

      isGoogleUpdateRef.current = true;
      setInputValue(finalAddress);
      setHasSelectedPlace(true);

      // Read the callback from the ref so the widget doesn't need to be
      // re-created when the parent's callback identity changes.
      if (onPlaceSelectRef.current) onPlaceSelectRef.current(placeData);

      setTimeout(() => {
        isGoogleUpdateRef.current = false;
      }, 0);
    });

    return () => {
      // Remove the listener.
      if (listener) window.google.maps.event.removeListener(listener);

      // Tear down the widget. Without this, the widget's shared
      // .pac-container survives into the next instance, which is what
      // caused the wizard's destination field to receive the pickup
      // widget's events. unbindAll() is the community-standard escape
      // hatch for the legacy Autocomplete class.
      if (autocompleteRef.current) {
        try {
          window.google.maps.event.clearInstanceListeners(
            autocompleteRef.current
          );
          if (typeof autocompleteRef.current.unbindAll === 'function') {
            autocompleteRef.current.unbindAll();
          }
        } catch (err) {
          // best effort
        }
        autocompleteRef.current = null;
      }
    };
  }, []); // ← [] because we read current values from refs

  // ---- Controlled change handler ----
  const handleInputChange = useCallback(
    (e) => {
      if (isGoogleUpdateRef.current) return;
      const next = e.target.value;
      setInputValue(next);
      if (hasSelectedPlace) setHasSelectedPlace(false);
      if (onChange) onChange(e);
    },
    [onChange, hasSelectedPlace]
  );

  // ---- "Use current location" ----
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported');
      return;
    }
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          });

          if (result.results && result.results.length > 0) {
            const place = result.results[0];
            const city = extractCity(place.address_components);
            const county = extractCounty(place.address_components);
            const finalAddress =
              buildDisplayAddress(place) || place.formatted_address || '';

            const placeData = {
              address: finalAddress,
              city,
              county,
              latitude,
              longitude,
              street_address: streetAddressRef.current || '',
            };

            setInputValue(finalAddress);
            setHasSelectedPlace(true);
            if (onPlaceSelectRef.current) onPlaceSelectRef.current(placeData);
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          const fallback = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setInputValue(fallback);
          setHasSelectedPlace(true);
          if (onPlaceSelectRef.current) {
            onPlaceSelectRef.current({
              address: fallback,
              city: '',
              county: '',
              latitude,
              longitude,
              street_address: streetAddressRef.current || '',
            });
          }
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please enable location access.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={required}
          autoComplete="off"
        />
        {showCurrentLocation && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Use current location"
          >
            {isLocating ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {showStreetAddress && hasSelectedPlace && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address, Building, Apartment
          </label>
          <input
            type="text"
            value={streetAddress}
            onChange={(e) =>
              onStreetAddressChange && onStreetAddressChange(e.target.value)
            }
            placeholder="e.g. Apartment 4B, Kilimani Heights, off Argwings Kodhek"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoComplete="off"
          />
          <p className="text-xs text-gray-400 mt-1">
            Optional — helps the rider find the exact entrance.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;