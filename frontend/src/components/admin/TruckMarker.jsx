// frontend/src/components/admin/TruckMarker.jsx
// Simpler, more reliable truck icons using emoji + colored circle

export const createTruckMarkerSVG = (color = '#2563EB', status = 'online') => {
  const size = 44;
  
  // Color mapping for different statuses
  const statusColors = {
    online: '#10B981',
    delivering: '#2563EB',
    on_break: '#F59E0B',
    offline: '#94A3B8'
  };
  
  const finalColor = statusColors[status] || color;
  const bgColor = finalColor + '30';
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E
    %3Ccircle cx='22' cy='22' r='18' fill='${bgColor}' stroke='${finalColor}' stroke-width='2'/%3E
    %3Ccircle cx='22' cy='22' r='12' fill='white' stroke='${finalColor}' stroke-width='2'/%3E
    %3Ctext x='22' y='26' font-size='16' text-anchor='middle' fill='${finalColor}' font-weight='bold'%3E🚚%3C/text%3E
  %3C/svg%3E`;
};

export const createPulseTruckMarkerSVG = (color = '#2563EB', status = 'online') => {
  const size = 56;
  
  const statusColors = {
    online: '#10B981',
    delivering: '#2563EB',
    on_break: '#F59E0B',
    offline: '#94A3B8'
  };
  
  const finalColor = statusColors[status] || color;
  const bgColor = finalColor + '20';
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'%3E
    %3Ccircle cx='28' cy='28' r='20' fill='none' stroke='${finalColor}' stroke-width='2' opacity='0.3'%3E
      %3Canimate attributeName='r' from='18' to='28' dur='1.5s' repeatCount='indefinite'/%3E
      %3Canimate attributeName='opacity' from='0.6' to='0' dur='1.5s' repeatCount='indefinite'/%3E
    %3C/circle%3E
    %3Ccircle cx='28' cy='28' r='18' fill='${bgColor}' stroke='${finalColor}' stroke-width='2'/%3E
    %3Ccircle cx='28' cy='28' r='12' fill='white' stroke='${finalColor}' stroke-width='2'/%3E
    %3Ctext x='28' y='32' font-size='16' text-anchor='middle' fill='${finalColor}' font-weight='bold'%3E🚚%3C/text%3E
  %3C/svg%3E`;
};

// Google Maps Marker icon format
export const getRiderMarker = (status, isActive = true) => {
  const statusColors = {
    online: '#10B981',
    delivering: '#2563EB',
    on_break: '#F59E0B',
    offline: '#94A3B8'
  };
  
  const color = statusColors[status] || statusColors.online;
  
  // For active/delivering riders, use pulse animation
  if (isActive && (status === 'delivering' || status === 'online')) {
    return createPulseTruckMarkerSVG(color, status);
  }
  
  // Default truck marker
  return createTruckMarkerSVG(color, status);
};