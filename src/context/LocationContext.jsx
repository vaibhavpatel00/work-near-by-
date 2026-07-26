import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

const DEFAULT_LAT = 17.385;
const DEFAULT_LNG = 78.4867;
const STORAGE_KEY = 'wixwix_location';

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`);
    if (!res.ok) throw new Error('Geocoding error');
    const data = await res.json();
    const addr = data.address || {};
    
    const sublocality = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdistrict || addr.locality;
    const city = addr.city || addr.town || addr.village || addr.county || addr.state_district;
    
    if (sublocality && city) {
      return `${sublocality}, ${city}`;
    } else if (sublocality) {
      return sublocality;
    } else if (city) {
      return city;
    } else if (data.display_name) {
      const parts = data.display_name.split(',');
      return parts.slice(0, 2).join(',').trim();
    }
  } catch (err) {
    console.info('Reverse geocode fallback:', err);
  }
  return `Near ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); }
      catch { /* ignore */ }
    }
    return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, address: 'Hyderabad, India' };
  });
  const [radius, setRadius] = useState(10); // km
  const [locationError, setLocationError] = useState(null);
  const [locating, setLocating] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Immediate fallback location while reverse-geocoding runs
        const tempLoc = {
          lat,
          lng,
          address: 'Locating address...',
        };
        setLocation(tempLoc);

        // Fetch real reverse-geocoded place name (Area, City)
        const areaName = await reverseGeocode(lat, lng);
        const finalLoc = {
          lat,
          lng,
          address: areaName,
        };
        setLocation(finalLoc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalLoc));
        setLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setLocationError('Unable to get live GPS. Using default location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Try to get location on mount if not stored
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      requestLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{
      location,
      radius,
      setRadius,
      requestLocation,
      locationError,
      locating,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};
