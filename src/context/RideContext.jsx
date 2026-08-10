import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const RideContext = createContext(null);

const RIDES_STORAGE_KEY = 'wikwik_rides_v5';
const GIG_CATEGORY_TRAVEL = 'travel_ride';

// Helper to encode metadata into description string for 100% Supabase schema compatibility
const encodeDescriptionWithMeta = (description, meta = {}) => {
  const cleanDesc = (description || '').split('\n\n__META__')[0];
  const metaObj = {
    ownerId: meta.ownerId || meta.driverId || '',
    ownerEmail: meta.ownerEmail || '',
    driverName: meta.driverName || 'Driver',
    driverPhone: meta.driverPhone || '',
    vehicleType: meta.vehicleType || 'car',
    origin: meta.origin || { address: '', lat: 0, lng: 0 },
    destination: meta.destination || { address: '', lat: 0, lng: 0 },
    departureDate: meta.departureDate || new Date().toISOString(),
    seatsAvailable: meta.seatsAvailable || 3,
    pricePerSeat: meta.pricePerSeat || 0,
    currency: meta.currency || '₹',
    passengers: meta.passengers || [],
    preferences: meta.preferences || {},
  };
  return `${cleanDesc}\n\n__META__${JSON.stringify(metaObj)}`;
};

// Helper to decode description and metadata
const decodeDescriptionWithMeta = (rawDescription) => {
  if (!rawDescription) return { description: '', meta: {} };
  const parts = rawDescription.split('\n\n__META__');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[parts.length - 1]);
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

// STRICT Helper: Check if a user is the owner/driver of a ride
export const isRideOwner = (ride, user) => {
  if (!ride || !user) return false;

  const userEmail = (user.email || '').trim().toLowerCase();
  const ownerEmail = (ride.ownerEmail || '').trim().toLowerCase();

  // 1. Primary check: Email match (Strict 1-to-1)
  if (userEmail && ownerEmail) {
    return userEmail === ownerEmail;
  }

  // 2. Secondary check: Authenticated User ID match
  if (user.id && ride.ownerId && String(user.id) === String(ride.ownerId)) {
    return true;
  }

  return false;
};

// STRICT Helper: Get passenger's booking in a ride
export const getPassengerBooking = (ride, user) => {
  if (!ride || !user || !Array.isArray(ride.passengers)) return null;

  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id ? String(user.id) : '';

  return ride.passengers.find(p => {
    const pEmail = (p.passengerEmail || '').trim().toLowerCase();
    const pId = p.passengerId ? String(p.passengerId) : '';

    if (userEmail && pEmail && userEmail === pEmail) return true;
    if (userId && pId && userId === pId) return true;
    return false;
  }) || null;
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
          return parsed.filter(r => r.status === 'active' && Boolean(r.ownerEmail));
        }
      }
    } catch { /* ignore */ }
    return [];
  });

  const [toasts, setToasts] = useState([]);

  // Fetch all rides from Supabase (Dual source: public.gigs with category travel_ride AND public.rides table)
  const syncWithSupabase = useCallback(async () => {
    try {
      const ridesMap = new Map();

      // 1. Fetch from public.gigs
      try {
        const { data: gigData, error: gigError } = await supabase
          .from('gigs')
          .select('*')
          .eq('category', GIG_CATEGORY_TRAVEL)
          .eq('status', 'active')
          .order('posted_at', { ascending: false });

        if (!gigError && gigData && Array.isArray(gigData)) {
          gigData.forEach(g => {
            const { description, meta } = decodeDescriptionWithMeta(g.description);
            const ownerId = meta.ownerId || g.posted_by;
            const ownerEmail = meta.ownerEmail || '';

            // Discard corrupted legacy test rides with no owner email
            if (!ownerEmail && !isUuid(ownerId)) return;

            const rideObj = {
              id: String(g.id),
              vehicleType: meta.vehicleType || 'car',
              origin: meta.origin || g.location || { address: '', lat: 0, lng: 0 },
              destination: meta.destination || { address: '', lat: 0, lng: 0 },
              departureDate: meta.departureDate || g.date || g.posted_at,
              seatsAvailable: meta.seatsAvailable || 3,
              pricePerSeat: Number(meta.pricePerSeat || g.amount || 0),
              currency: g.currency || meta.currency || '₹',
              description: description || '',
              ownerId: ownerId,
              ownerEmail: ownerEmail,
              driverId: ownerId,
              driverName: meta.driverName || 'Driver',
              driverPhone: meta.driverPhone || '',
              status: g.status || 'active',
              postedAt: g.posted_at,
              passengers: meta.passengers || [],
              preferences: meta.preferences || {},
            };
            ridesMap.set(rideObj.id, rideObj);
          });
        }
      } catch (err) {
        console.warn('Gigs travel sync notice:', err);
      }

      // 2. Also fetch from public.rides table if present
      try {
        const { data: directRides, error: ridesError } = await supabase
          .from('rides')
          .select('*')
          .eq('status', 'active')
          .order('posted_at', { ascending: false });

        if (!ridesError && directRides && Array.isArray(directRides)) {
          directRides.forEach(r => {
            const { description, meta } = decodeDescriptionWithMeta(r.description);
            const ownerId = r.driver_id || meta.ownerId;
            const ownerEmail = meta.ownerEmail || '';

            if (!ownerEmail && !isUuid(ownerId)) return;

            const rideObj = {
              id: String(r.id),
              vehicleType: r.vehicle_type || meta.vehicleType || 'car',
              origin: r.origin || meta.origin || { address: '', lat: 0, lng: 0 },
              destination: r.destination || meta.destination || { address: '', lat: 0, lng: 0 },
              departureDate: r.departure_date || meta.departureDate,
              seatsAvailable: r.seats_available || meta.seatsAvailable || 1,
              pricePerSeat: Number(r.price_per_seat || meta.pricePerSeat || 0),
              currency: r.currency || meta.currency || '₹',
              description: description || '',
              ownerId: ownerId,
              ownerEmail: ownerEmail,
              driverId: ownerId,
              driverName: r.driver_name || meta.driverName || 'Driver',
              driverPhone: r.driver_phone || meta.driverPhone || '',
              status: r.status || 'active',
              postedAt: r.posted_at,
              passengers: meta.passengers || [],
              preferences: meta.preferences || {},
            };
            ridesMap.set(rideObj.id, rideObj);
          });
        }
      } catch {
        /* Ignore if table not present */
      }

      const combined = Array.from(ridesMap.values()).sort(
        (a, b) => new Date(b.postedAt) - new Date(a.postedAt)
      );
      setRides(combined);
    } catch (err) {
      console.error('Rides sync exception:', err);
    }
  }, []);

  // Fetch on mount & poll every 3 seconds + Realtime channel
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 3000);

    let gigsChannel = null;
    let ridesChannel = null;

    try {
      gigsChannel = supabase
        .channel('public:gigs_travel_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, () => {
          syncWithSupabase();
        })
        .subscribe();

      ridesChannel = supabase
        .channel('public:rides_travel_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
          syncWithSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Rides realtime subscription error:', e);
    }

    return () => {
      clearInterval(interval);
      if (gigsChannel) supabase.removeChannel(gigsChannel);
      if (ridesChannel) supabase.removeChannel(ridesChannel);
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
    }, 3500);
  }, []);

  /**
   * Search / Filter rides with 50-60km Radius Matching
   */
  const searchRides = useCallback((filters = {}) => {
    const {
      vehicleType,
      originQuery,
      originCoords,
      destQuery,
      destCoords,
      date,
      radiusKm = 60,
    } = filters;

    let filtered = rides.filter(ride => {
      if (ride.status !== 'active') return false;

      // Vehicle Type filter
      if (vehicleType && vehicleType !== 'all' && ride.vehicleType !== vehicleType) {
        return false;
      }

      // Date filter
      if (date) {
        const rideDate = new Date(ride.departureDate).toDateString();
        const filterDate = new Date(date).toDateString();
        if (rideDate !== filterDate) return false;
      }

      // 1. ORIGIN MATCHING
      if (originCoords && typeof originCoords.lat === 'number' && typeof originCoords.lng === 'number') {
        if (ride.origin && typeof ride.origin.lat === 'number' && typeof ride.origin.lng === 'number') {
          const dist = calculateDistance(originCoords.lat, originCoords.lng, ride.origin.lat, ride.origin.lng);
          if (dist > radiusKm) {
            if (originQuery && originQuery.trim()) {
              const q = originQuery.toLowerCase();
              if (!ride.origin.address.toLowerCase().includes(q)) return false;
            } else {
              return false;
            }
          }
        }
      } else if (originQuery && originQuery.trim()) {
        const q = originQuery.toLowerCase();
        const address = (ride.origin?.address || '').toLowerCase();
        const words = q.split(/[\s,]+/).filter(w => w.length > 2);
        const matches = words.some(w => address.includes(w));
        if (!address.includes(q) && !matches) return false;
      }

      // 2. DESTINATION MATCHING
      if (destCoords && typeof destCoords.lat === 'number' && typeof destCoords.lng === 'number') {
        if (ride.destination && typeof ride.destination.lat === 'number' && typeof ride.destination.lng === 'number') {
          const dist = calculateDistance(destCoords.lat, destCoords.lng, ride.destination.lat, ride.destination.lng);
          if (dist > radiusKm) {
            if (destQuery && destQuery.trim()) {
              const q = destQuery.toLowerCase();
              if (!ride.destination.address.toLowerCase().includes(q)) return false;
            } else {
              return false;
            }
          }
        }
      } else if (destQuery && destQuery.trim()) {
        const q = destQuery.toLowerCase();
        const address = (ride.destination?.address || '').toLowerCase();
        const words = q.split(/[\s,]+/).filter(w => w.length > 2);
        const matches = words.some(w => address.includes(w));
        if (!address.includes(q) && !matches) return false;
      }

      return true;
    });

    filtered = filtered.map(ride => {
      const distToOrigin = (ride.origin && typeof ride.origin.lat === 'number')
        ? calculateDistance(location.lat, location.lng, ride.origin.lat, ride.origin.lng)
        : 0;

      const distFromSearchOrigin = (originCoords && ride.origin && typeof ride.origin.lat === 'number')
        ? calculateDistance(originCoords.lat, originCoords.lng, ride.origin.lat, ride.origin.lng)
        : null;

      const distFromSearchDest = (destCoords && ride.destination && typeof ride.destination.lat === 'number')
        ? calculateDistance(destCoords.lat, destCoords.lng, ride.destination.lat, ride.destination.lng)
        : null;

      return {
        ...ride,
        distanceToOrigin: distToOrigin,
        distFromSearchOrigin,
        distFromSearchDest,
      };
    });

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

  // Helper to persist ride across both Supabase tables with PRESERVED owner identity
  const saveRideToSupabase = async (ride, meta) => {
    const ownerId = ride.ownerId || meta?.ownerId || (user?.id ? user.id : ride.id);
    const ownerEmail = ride.ownerEmail || meta?.ownerEmail || user?.email || '';
    const driverName = ride.driverName || meta?.driverName || user?.name || user?.email?.split('@')[0] || 'Driver';
    const driverPhone = ride.driverPhone || meta?.driverPhone || user?.phone || '';

    const fullMeta = {
      ...meta,
      ownerId,
      ownerEmail,
      driverId: ownerId,
      driverName,
      driverPhone,
      vehicleType: ride.vehicleType,
      origin: ride.origin,
      destination: ride.destination,
      departureDate: ride.departureDate,
      seatsAvailable: ride.seatsAvailable,
      pricePerSeat: ride.pricePerSeat,
      currency: ride.currency,
      passengers: ride.passengers || meta?.passengers || [],
      preferences: ride.preferences || meta?.preferences || {},
    };

    const encodedDescription = encodeDescriptionWithMeta(ride.description || '', fullMeta);

    // 1. Direct UPDATE on public.gigs table
    try {
      const { error: updateErr } = await supabase
        .from('gigs')
        .update({
          description: encodedDescription,
          status: ride.status || 'active',
        })
        .eq('id', ride.id);

      if (updateErr) {
        console.warn('Gigs update notice:', updateErr);
      }
    } catch (e) {
      console.warn('Gigs update error:', e);
    }

    // 2. Also upsert to ensure complete row exists in public.gigs
    const gigPayload = {
      id: ride.id,
      title: `${ride.vehicleType === 'bike' ? '🏍️ Bike' : '🚗 Car'}: ${ride.origin?.address || 'Origin'} → ${ride.destination?.address || 'Destination'}`,
      description: encodedDescription,
      category: GIG_CATEGORY_TRAVEL,
      amount: ride.pricePerSeat,
      currency: ride.currency || '₹',
      date: ride.departureDate,
      duration: 'One-way trip',
      location: ride.origin,
      posted_by: isUuid(ownerId) ? ownerId : ride.id,
      status: ride.status || 'active',
      posted_at: ride.postedAt || new Date().toISOString(),
    };

    try {
      const { error: upsertErr } = await supabase.from('gigs').upsert([gigPayload]);
      if (upsertErr) {
        console.warn('Gigs upsert error:', upsertErr);
      }
    } catch (err) {
      console.warn('Gigs table travel upsert error:', err);
    }

    // 3. Secondary: Save to public.rides table if available
    try {
      const ridePayload = {
        id: ride.id,
        vehicle_type: ride.vehicleType,
        origin: ride.origin,
        destination: ride.destination,
        departure_date: ride.departureDate,
        seats_available: ride.seatsAvailable,
        price_per_seat: ride.pricePerSeat,
        currency: ride.currency,
        description: encodedDescription,
        driver_id: isUuid(ownerId) ? ownerId : null,
        driver_name: driverName,
        driver_phone: driverPhone,
        status: ride.status || 'active',
        posted_at: ride.postedAt || new Date().toISOString(),
      };
      await supabase.from('rides').upsert([ridePayload]);
    } catch {
      /* ignore if table does not exist */
    }
  };

  // Offer a new ride
  const offerRide = useCallback(async (rideData) => {
    const rideId = generateId();

    const passengers = [];
    const preferences = rideData.preferences || {};
    const ownerId = user?.id || rideId;
    const ownerEmail = (user?.email || rideData.ownerEmail || '').trim().toLowerCase();
    const driverName = user?.name || user?.email?.split('@')[0] || rideData.driverName || 'Driver';
    const driverPhone = rideData.driverPhone || user?.phone || '';

    const newRide = {
      id: rideId,
      vehicleType: rideData.vehicleType || 'car',
      origin: rideData.origin,
      destination: rideData.destination,
      departureDate: rideData.departureDate,
      seatsAvailable: Number(rideData.seatsAvailable) || (rideData.vehicleType === 'bike' ? 1 : 3),
      pricePerSeat: Number(rideData.pricePerSeat),
      currency: rideData.currency || '₹',
      description: rideData.description || '',
      ownerId,
      ownerEmail,
      driverId: ownerId,
      driverName,
      driverPhone,
      status: 'active',
      postedAt: new Date().toISOString(),
      passengers,
      preferences,
    };

    setRides(prev => [newRide, ...prev.filter(r => r.id !== rideId)]);
    showToast('Ride published successfully!', 'success');

    await saveRideToSupabase(newRide, {
      ownerId,
      ownerEmail,
      driverId: ownerId,
      driverName,
      driverPhone,
      vehicleType: newRide.vehicleType,
      origin: newRide.origin,
      destination: newRide.destination,
      departureDate: newRide.departureDate,
      seatsAvailable: newRide.seatsAvailable,
      pricePerSeat: newRide.pricePerSeat,
      currency: newRide.currency,
      passengers,
      preferences,
    });

    setTimeout(syncWithSupabase, 400);

    return newRide;
  }, [user, showToast, syncWithSupabase]);

  // Book a seat (passenger requests)
  const bookSeat = useCallback(async (rideId, message = '') => {
    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return false;

    if (currentRide.status !== 'active') {
      showToast('This ride is no longer available', 'error');
      return false;
    }

    const passengerUserId = user?.id || generateId();
    const passengerUserEmail = (user?.email || '').trim().toLowerCase();
    const passengerUserName = user?.name || user?.email?.split('@')[0] || 'Passenger';
    const passengerUserPhone = user?.phone || '';

    // Check if user is already a passenger
    const existingReq = getPassengerBooking(currentRide, user || { id: passengerUserId, email: passengerUserEmail });
    if (existingReq) {
      showToast('You have already requested a seat in this ride!', 'info');
      return false;
    }

    const requestId = generateId();
    const newPassenger = {
      id: requestId,
      passengerId: passengerUserId,
      passengerEmail: passengerUserEmail,
      passengerName: passengerUserName,
      passengerPhone: passengerUserPhone,
      message: message || 'Hi, I would like to book a seat!',
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: message ? [{
        id: generateId(),
        senderId: passengerUserId,
        senderName: passengerUserName,
        text: message,
        timestamp: new Date().toISOString(),
      }] : [],
    };

    const updatedPassengers = [...(currentRide.passengers || []), newPassenger];
    const approvedCount = updatedPassengers.filter(p => p.status === 'approved').length;
    const isFull = approvedCount >= currentRide.seatsAvailable;
    const updatedStatus = isFull ? 'full' : currentRide.status;

    const updatedRide = {
      ...currentRide,
      passengers: updatedPassengers,
      status: updatedStatus,
    };

    setRides(prev => prev.map(r => String(r.id) === String(rideId) ? updatedRide : r));
    showToast('Seat booking request sent! Owner will review and approve.', 'success');

    await saveRideToSupabase(updatedRide, {
      ownerId: currentRide.ownerId,
      ownerEmail: currentRide.ownerEmail,
      driverId: currentRide.driverId,
      driverName: currentRide.driverName,
      driverPhone: currentRide.driverPhone,
      passengers: updatedPassengers,
      preferences: currentRide.preferences,
    });

    setTimeout(syncWithSupabase, 400);

    return true;
  }, [user, rides, showToast, syncWithSupabase]);

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

    const updatedRide = {
      ...currentRide,
      passengers: updatedPassengers,
      status: updatedRideStatus,
    };

    setRides(prev => prev.map(r => String(r.id) === String(rideId) ? updatedRide : r));

    if (status === 'approved') {
      showToast('Passenger approved! Seat confirmed.', 'success');
    } else {
      showToast('Passenger request rejected.', 'info');
    }

    await saveRideToSupabase(updatedRide, {
      ownerId: currentRide.ownerId,
      ownerEmail: currentRide.ownerEmail,
      driverId: currentRide.driverId,
      driverName: currentRide.driverName,
      driverPhone: currentRide.driverPhone,
      passengers: updatedPassengers,
      preferences: currentRide.preferences,
    });

    setTimeout(syncWithSupabase, 400);
  }, [rides, showToast, syncWithSupabase]);

  // Send chat message on a passenger request thread
  const sendRideChatMessage = useCallback(async (rideId, requestId, text) => {
    if (!text.trim()) return;

    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return;

    const senderId = user?.id || 'guest';
    const senderName = user?.name || user?.email?.split('@')[0] || 'User';

    const updatedPassengers = (currentRide.passengers || []).map(p => {
      if (p.id !== requestId) return p;
      const newMsg = {
        id: generateId(),
        senderId,
        senderName,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      return { ...p, messages: [...(p.messages || []), newMsg] };
    });

    const updatedRide = {
      ...currentRide,
      passengers: updatedPassengers,
    };

    setRides(prev => prev.map(r => String(r.id) === String(rideId) ? updatedRide : r));

    await saveRideToSupabase(updatedRide, {
      ownerId: currentRide.ownerId,
      ownerEmail: currentRide.ownerEmail,
      driverId: currentRide.driverId,
      driverName: currentRide.driverName,
      driverPhone: currentRide.driverPhone,
      passengers: updatedPassengers,
      preferences: currentRide.preferences,
    });
  }, [user, rides]);

  // Cancel a ride
  const cancelRide = useCallback(async (rideId) => {
    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return;

    const updatedRide = { ...currentRide, status: 'cancelled' };
    setRides(prev => prev.map(r => String(r.id) === String(rideId) ? updatedRide : r));
    showToast('Ride cancelled', 'info');

    await saveRideToSupabase(updatedRide, currentRide);
  }, [rides, showToast]);

  // Complete a ride
  const completeRide = useCallback(async (rideId) => {
    const currentRide = rides.find(r => String(r.id) === String(rideId));
    if (!currentRide) return;

    const updatedRide = { ...currentRide, status: 'completed' };
    setRides(prev => prev.map(r => String(r.id) === String(rideId) ? updatedRide : r));
    showToast('Ride marked as completed!', 'success');

    await saveRideToSupabase(updatedRide, currentRide);
  }, [rides, showToast]);

  // Delete a ride
  const deleteRide = useCallback(async (rideId) => {
    setRides(prev => prev.filter(r => String(r.id) !== String(rideId)));
    showToast('Ride deleted', 'info');

    try {
      await supabase.from('gigs').delete().eq('id', rideId);
      await supabase.from('rides').delete().eq('id', rideId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Clear all rides (Utility to reset cleanly)
  const clearAllRides = useCallback(() => {
    setRides([]);
    try {
      localStorage.removeItem(RIDES_STORAGE_KEY);
    } catch { /* ignore */ }
    showToast('All rides cleared. You can now post fresh rides!', 'success');
  }, [showToast]);

  // Get user's offered rides (Strictly by Owner Email / ID)
  const getMyOfferedRides = useCallback(() => {
    if (!user) return [];
    return rides.filter(r => isRideOwner(r, user))
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [rides, user]);

  // Get user's booked rides (Strictly by Passenger Email / ID)
  const getMyBookedRides = useCallback(() => {
    if (!user) return [];
    return rides.filter(r => Boolean(getPassengerBooking(r, user)))
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [rides, user]);

  // Get all active rides
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
      clearAllRides,
      getMyOfferedRides,
      getMyBookedRides,
      getAllActiveRides,
      isRideOwner: (ride) => isRideOwner(ride, user),
      getPassengerBooking: (ride) => getPassengerBooking(ride, user),
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
