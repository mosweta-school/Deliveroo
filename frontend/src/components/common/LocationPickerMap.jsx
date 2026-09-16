// frontend/src/components/common/LocationPickerMap.jsx
import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

/**
 * Small map for fine-tuning a location.
 * 
 * Why: Autocomplete is fast, but sometimes the pin lands on the wrong
 * side of the road. Letting users drag the marker gives them control.
 */
const LocationPickerMap = ({ value, onChange, height = '250px' }) => {
  if (!value?.latitude || !value?.longitude) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 rounded-lg border border-dashed border-slate-300 text-sm text-slate-400"
        style={{ height }}
      >
        Enter an address above to see it on the map
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-slate-200">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: value.latitude, lng: value.longitude }}
        zoom={15}
        onClick={(e) => {
          if (onChange) {
            onChange({
              ...value,
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng(),
            });
          }
        }}
      >
        <Marker
          position={{ lat: value.latitude, lng: value.longitude }}
          draggable
          onDragEnd={(e) => {
            if (onChange) {
              onChange({
                ...value,
                latitude: e.latLng.lat(),
                longitude: e.latLng.lng(),
              });
            }
          }}
        />
      </GoogleMap>
      <p className="text-xs text-gray-400 mt-1">
        Click on the map or drag the pin to fine-tune the location
      </p>
    </div>
  );
};

export default LocationPickerMap;