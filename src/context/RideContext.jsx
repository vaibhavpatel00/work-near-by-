import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const RideContext = createContext(null);

const RIDES_STORAGE_KEY = 'wikwik_rides_v1';

// Helper to encode metadata into description string (same pattern as gigs)
const encodeDescriptionWithMeta = (description, meta = {}) => {
  const metaObj = {
    passengers: meta.passengers || [],
    preferences: meta.preferences || {},
  };
  return `${description || ''}\n\n__META__${JSON.stringify(metaObj)}`;
};

// Helper to decode description and metadata
const decodeDescriptionWithMeta = (rawDescription) => {
  if (!rawDescription) return { description: '', meta: {} };
  const parts = rawDescription.split('\n\n__META__');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      return { description: parts[0], meta };
    } catch {
      return { description: rawDescription, meta: {} };
    }
  }
  return { description: rawDescription, meta: {} };
};

// Fallback UUID regex check
const isUuid = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const RideProvider = ({ children }) => {
  const { location } = useLocation();
  const { user } = useAuth();

  const [rides, setRides] = useState(() => {
    try {
      const stored = localStorage.getItem(RIDES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return [];
  });

  const [toasts, setToasts] = useState([]);

  // Fetch all rides from Supabase
  const syncWithSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) {
        console.error('Supabase Rides Fetch Error:', error.message);
        return;
      }

      if (!data) return;

      const formatted = data.map(r => {
        const { description, meta } = decodeDescriptionWithMeta(r.description);
        return {
          id: String(r.id),
          vehicleType: r.vehicle_type || 'car',
          origin: r.origin || { address: '', lat: 0, lng: 0 },
          destination: r.destination || { address: '', lat: 0, lng: 0 },
          departureDate: r.departure_date,
          seatsAvailable: r.seats_available || 1,
          pricePerSeat: Number(r.price_per_seat),
          currency: r.currency || '₹',
          description: description,
          driverId: r.driver_id,
          driverName: r.driver_name || 'Driver',
          driverPhone: r.driver_phone || '',
          status: r.status || 'active',
          postedAt: r.posted_at,
          passengers: meta.passengers || [],
          preferences: meta.preferences || {},
        };
      });

      setRides(formatted);
    } catch (err) {
      console.error('Rides sync exception:', err);
    }
  }, []);

  // Fetch on mount & poll every 5 seconds
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 5000);

    let channel = null;
    try {
      channel = supabase
        .channel('public:rides_realtime_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
          syncWithSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Rides realtime subscription error:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(RIDES_STORAGE_KEY, JSON.stringify(rides));
    } catch { /* safety */ }
  }, [rides]);

  // Toast helpers
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Search/filter rides
  const searchRides = useCallback((filters = {}) => {
    const { vehicleType, originQuery, destQuery, date } = filters;

    let filtered = rides.filter(ride => {
      if (ride.status !== 'active') return false;

      if (vehicleType && ride.vehicleType !== vehicleType) return false;

      if (originQuery && originQuery.trim()) {
        const q = originQuery.toLowerCase();
        if (!ride.origin.address.toLowerCase().includes(q)) return false;
      }

      if (destQuery && destQuery.trim()) {
        const q = destQuery.toLowerCase();
        if (!ride.destination.address.toLowerCase().includes(q)) return false;
      }

      if (date) {
        const rideDate = new Date(ride.departureDate).toDateString();
        const filterDate = new Date(date).toDateString();
        if (rideDate !== filterDate) return false;
      }

      return true;
    });

    // Add distance from user to origin
    filtered = filtered.map(ride => ({
      ...ride,
      distanceToOrigin: (ride.origin && typeof ride.origin.lat === 'number')
        ? calculateDistance(location.lat, location.lng, ride.origin.lat, ride.origin.lng)
        : 0,
    }));

    filtered.sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
    return filtered;
  }, [rides, location]);

  // Get ride by ID
  const getRideById = useCallback((id) => {
    const ride = rides.find(r => String(r.id) === String(id));
    if (!ride) return null;

    return {
      ...ride,
      distanceToOrigin: (ride.origin && typeof ride.origin.lat === 'number')
        ? calculateDistance(location.lat, location.lng, ride.origin.lat, ride.origin.lng)
        : 0,
    };
  }, [rides, location]);

  // Offer a new ride
  const offerRide = useCallback(async (rideData) => {
    const rideId = generateId();

    let driverUuid = user?.id;
    if (!isUuid(driverUuid)) {
      driverUuid = null;
    }

    const passengers = [];
    const preferences = rideData.preferences || {};

    const encodedDescription = encodeDescriptionWithMeta(rideData.description || '', {
      passengers,
      preferences,
    });

    const newRide = {
      id: rideId,
      vehicleType: rideData.vehicleType || 'car',
      origin: rideData.origin,
      destination: rideData.destination,
      departureDate: rideData.departureDate,
      seatsAvailable: rideData.seatsAvailable || (rideData.vehicleType === 'bike' ? 1 : 3),
      pricePerSeat: Number(rideData.pricePerSeat),
      currency: rideData.currency || '₹',
      description: rideData.description || '',
      driverId: user?.id || rideId,
      driverName: user?.name || 'Driver',
      driverPhone: rideData.driverPhone || user?.phone || '',
      status: 'active',
      postedAt: new Date().toISOString(),
      passengers,
      preferences,
    };

    setRides(prev => [newRide, ...prev]);

    const payload = {
      id: rideId,
      vehicle_type: newRide.vehicleType,
      origin: newRide.origin,
      destination: newRide.destination,
      departure_date: newRide.departureDate,
      seats_available: newRide.seatsAvailable,
      price_per_seat: newRide.pricePerSeat,
      currency: newRide.currency,
      description: encodedDescription,
      driver_id: driverUuid,
      driver_name: newRide.driverName,
      driver_phone: newRide.driverPhone,
      status: 'active',
    };

    try {
      const { error } = await supabase.from('rides').insert([payload]).select();
      if (error) {
        console.error('[Supabase Ride Insert Error]', error);
        showToast(`Warning: Ride sync issue (${error.message})`, 'warning');
      } else {
        showToast('Ride published successfully!', 'success');
        await syncWithSupabase();
      }
    } catch (err) {
      console.error('[Supabase Ride Insert Catch]', err);
    }

    return newRide;
  }, [user, showToast, syncWithSupabase]);

  // Book a seat (passenger requests)
  const bookSeat = useCallback(async (rideId, message = '') => {
    if (!user) {
      showToast('Please login to book a ride', 'error');
      return false;
    }

    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return false;

    if (currentRide.status !== 'active') {
      showToast('This ride is no longer available', 'error');
      return false;
    }

    const existingReq = (currentRide.passengers || []).find(p => p.passengerId === user.id);
    if (existingReq) {
      showToast('You have already requested a seat!', 'info');
      return false;
    }

    const requestId = generateId();
    const newPassenger = {
      id: requestId,
      passengerId: user.id,
      passengerName: user.name || 'Passenger',
      passengerPhone: user.phone || '',
      passengerEmail: user.email || '',
      message: message || 'Hi, I would like to book a seat!',
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: message ? [{
        id: generateId(),
        senderId: user.id,
        senderName: user.name || 'Passenger',
        text: message,
        timestamp: new Date().toISOString(),
      }] : [],
    };

    const updatedPassengers = [...(currentRide.passengers || []), newPassenger];
    const approvedCount = updatedPassengers.filter(p => p.status === 'approved').length;
    const isFull = approvedCount >= currentRide.seatsAvailable;
    const updatedStatus = isFull ? 'full' : currentRide.status;

    const updatedEncodedDesc = encodeDescriptionWithMeta(currentRide.description, {
      passengers: updatedPassengers,
      preferences: currentRide.preferences,
    });

    setRides(prev => prev.map(r => {
      if (String(r.id) !== String(rideId)) return r;
      return { ...r, passengers: updatedPassengers, status: updatedStatus };
    }));

    showToast('Seat booking request sent! Waiting for driver approval.', 'success');

    try {
      await supabase.from('rides')
        .update({ description: updatedEncodedDesc, status: updatedStatus })
        .eq('id', rideId);
    } catch (e) {
      console.error('Supabase book seat error:', e);
    }

    return true;
  }, [user, rides, showToast]);

  // Respond to passenger request (approve/reject)
  const respondToPassenger = useCallback(async (rideId, requestId, status) => {
    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return;

    const updatedPassengers = (currentRide.passengers || []).map(p =>
      p.id === requestId ? { ...p, status } : p
    );

    const approvedCount = updatedPassengers.filter(p => p.status === 'approved').length;
    const isFull = approvedCount >= currentRide.seatsAvailable;
    const updatedRideStatus = isFull ? 'full' : currentRide.status;

    const updatedEncodedDesc = encodeDescriptionWithMeta(currentRide.description, {
      passengers: updatedPassengers,
      preferences: currentRide.preferences,
    });

    setRides(prev => prev.map(r => {
      if (String(r.id) !== String(rideId)) return r;
      return { ...r, passengers: updatedPassengers, status: updatedRideStatus };
    }));

    if (status === 'approved') {
      showToast('Passenger approved! Seat confirmed.', 'success');
    } else {
      showToast('Passenger request rejected.', 'info');
    }

    try {
      await supabase.from('rides')
        .update({ description: updatedEncodedDesc, status: updatedRideStatus })
        .eq('id', rideId);
    } catch (e) {
      console.error('Supabase respond error:', e);
    }
  }, [rides, showToast]);

  // Send chat message on a passenger request thread
  const sendRideChatMessage = useCallback(async (rideId, requestId, text) => {
    if (!user || !text.trim()) return;

    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return;

    const updatedPassengers = (currentRide.passengers || []).map(p => {
      if (p.id !== requestId) return p;
      const newMsg = {
        id: generateId(),
        senderId: user.id,
        senderName: user.name || 'User',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      return { ...p, messages: [...(p.messages || []), newMsg] };
    });

    const updatedEncodedDesc = encodeDescriptionWithMeta(currentRide.description, {
      passengers: updatedPassengers,
      preferences: currentRide.preferences,
    });

    setRides(prev => prev.map(r => {
      if (String(r.id) !== String(rideId)) return r;
      return { ...r, passengers: updatedPassengers };
    }));

    try {
      await supabase.from('rides').update({ description: updatedEncodedDesc }).eq('id', rideId);
    } catch (e) {
      console.error('Supabase ride chat error:', e);
    }
  }, [user, rides]);

  // Cancel a ride
  const cancelRide = useCallback(async (rideId) => {
    setRides(prev => prev.map(r =>
      String(r.id) === String(rideId) ? { ...r, status: 'cancelled' } : r
    ));
    showToast('Ride cancelled', 'info');

    try {
      await supabase.from('rides').update({ status: 'cancelled' }).eq('id', rideId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Complete a ride
  const completeRide = useCallback(async (rideId) => {
    setRides(prev => prev.map(r =>
      String(r.id) === String(rideId) ? { ...r, status: 'completed' } : r
    ));
    showToast('Ride marked as completed!', 'success');

    try {
      await supabase.from('rides').update({ status: 'completed' }).eq('id', rideId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Delete a ride
  const deleteRide = useCallback(async (rideId) => {
    setRides(prev => prev.filter(r => String(r.id) !== String(rideId)));
    showToast('Ride deleted', 'info');

    try {
      await supabase.from('rides').delete().eq('id', rideId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Get user's offered rides
  const getMyOfferedRides = useCallback(() => {
    if (!user) return [];
    return rides.filter(r => String(r.driverId) === String(user.id))
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [rides, user]);

  // Get user's booked rides (as passenger)
  const getMyBookedRides = useCallback(() => {
    if (!user) return [];
    return rides.filter(r =>
      (r.passengers || []).some(p => String(p.passengerId) === String(user.id))
    ).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [rides, user]);

  // Get all rides (for Travel page listing)
  const getAllActiveRides = useCallback(() => {
    return rides
      .filter(r => r.status === 'active')
      .map(ride => ({
        ...ride,
        distanceToOrigin: (ride.origin && typeof ride.origin.lat === 'number')
          ? calculateDistance(location.lat, location.lng, ride.origin.lat, ride.origin.lng)
          : 0,
      }))
      .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  }, [rides, location]);

  return (
    <RideContext.Provider value={{
      rides,
      toasts,
      showToast,
      searchRides,
      getRideById,
      offerRide,
      bookSeat,
      respondToPassenger,
      sendRideChatMessage,
      cancelRide,
      completeRide,
      deleteRide,
      getMyOfferedRides,
      getMyBookedRides,
      getAllActiveRides,
    }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRides = () => {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRides must be used within RideProvider');
  return ctx;
};
