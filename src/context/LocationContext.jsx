import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_LAT, DEFAULT_LNG } from '../data/mockData';

const LocationContext = createContext(null);

const STORAGE_KEY = 'gignearby_location';

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
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: 'Current Location',
        };
        setLocation(loc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        setLocating(false);
      },
      (error) => {
        setLocationError('Unable to get your location. Using default.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Try to get location on mount
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
