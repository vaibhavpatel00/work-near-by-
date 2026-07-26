import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const GigContext = createContext(null);

const GIGS_STORAGE_KEY = 'gignearby_gigs';

export const GigProvider = ({ children }) => {
  const { location, radius } = useLocation();
  const { user } = useAuth();

  const [gigs, setGigs] = useState(() => {
    const stored = localStorage.getItem(GIGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock demo gigs (IDs like gig-1, gig-2, etc.)
          const realOnly = parsed.filter(g => typeof g.id === 'string' && !g.id.startsWith('gig-'));
          return realOnly;
        }
      } catch { /* ignore */ }
    }
    return [];
  });

  const [toasts, setToasts] = useState([]);

  // Fetch initial gigs from Supabase table
  useEffect(() => {
    let isMounted = true;
    const fetchGigsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('gigs')
          .select('*')
          .order('posted_at', { ascending: false });

        if (error) {
          console.info('Supabase gigs query info:', error.message);
          return;
        }

        if (data && isMounted) {
          // Map DB column names to app camelCase properties
          const formatted = data.map(g => ({
            id: g.id,
            title: g.title,
            description: g.description,
            category: g.category,
            amount: g.amount,
            currency: g.currency || '₹',
            date: g.date,
            duration: g.duration,
            location: g.location,
            postedBy: g.posted_by,
            postedAt: g.posted_at,
            status: g.status,
            acceptedBy: g.accepted_by,
          }));
          setGigs(formatted);
        }
      } catch (err) {
        console.warn('Unable to connect to Supabase gigs table:', err.message);
      }
    };

    fetchGigsFromSupabase();

    // Subscribe to realtime changes on 'gigs' table
    let subscription = null;
    try {
      subscription = supabase
        .channel('public:gigs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            const formatted = {
              id: newRow.id,
              title: newRow.title,
              description: newRow.description,
              category: newRow.category,
              amount: newRow.amount,
              currency: newRow.currency || '₹',
              date: newRow.date,
              duration: newRow.duration,
              location: newRow.location,
              postedBy: newRow.posted_by,
              postedAt: newRow.posted_at,
              status: newRow.status,
              acceptedBy: newRow.accepted_by,
            };
            setGigs(prev => [formatted, ...prev.filter(g => g.id !== formatted.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setGigs(prev => prev.map(g => g.id === updated.id ? {
              ...g,
              status: updated.status,
              acceptedBy: updated.accepted_by,
            } : g));
          }
        })
        .subscribe();
    } catch { /* ignore realtime error if disabled */ }

    return () => {
      isMounted = false;
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  // Persist gigs to localStorage as backup
  useEffect(() => {
    localStorage.setItem(GIGS_STORAGE_KEY, JSON.stringify(gigs));
  }, [gigs]);

  // Toast helpers
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Get user by ID (from mock data or current user)
  const getUserById = useCallback((userId) => {
    if (user && user.id === userId) return user;
    return MOCK_USERS.find(u => u.id === userId) || { id: userId, name: 'User', rating: 4.8 };
  }, [user]);

  // Get nearby gigs within radius
  const getNearbyGigs = useCallback((filterCategory = null, searchQuery = '') => {
    let filtered = gigs.filter(gig => {
      // Distance filter
      const dist = calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng);
      if (dist > radius) return false;

      // Category filter
      if (filterCategory && gig.category !== filterCategory) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return gig.title.toLowerCase().includes(q) ||
               gig.description.toLowerCase().includes(q);
      }

      return true;
    });

    // Add distance to each gig
    filtered = filtered.map(gig => ({
      ...gig,
      distance: calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng),
    }));

    // Sort by posted time (newest first)
    filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    return filtered;
  }, [gigs, location, radius]);

  // Get gig by ID
  const getGigById = useCallback((id) => {
    const gig = gigs.find(g => g.id === id);
    if (!gig) return null;
    return {
      ...gig,
      distance: calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng),
    };
  }, [gigs, location]);

  // Post a new gig
  const postGig = useCallback(async (gigData) => {
    const localId = generateId();
    const newGig = {
      ...gigData,
      id: localId,
      postedBy: user?.id || 'user-1',
      postedAt: new Date().toISOString(),
      status: 'active',
      acceptedBy: null,
      currency: '₹',
    };

    // Update local state immediately for instant response
    setGigs(prev => [newGig, ...prev]);
    showToast('Work requirement posted successfully!', 'success');

    // Attempt to write to Supabase table
    try {
      const { data, error } = await supabase
        .from('gigs')
        .insert([{
          title: gigData.title,
          description: gigData.description,
          category: gigData.category,
          amount: Number(gigData.amount),
          currency: '₹',
          date: gigData.date || new Date().toISOString(),
          duration: gigData.duration || 'Flexible',
          location: gigData.location,
          posted_by: user?.id || null,
          status: 'active',
        }])
        .select()
        .single();

      if (!error && data) {
        // Swap local id with server id
        setGigs(prev => prev.map(g => g.id === localId ? { ...g, id: data.id } : g));
      }
    } catch (err) {
      console.info('Saved locally. Supabase insert info:', err.message);
    }

    return newGig;
  }, [user, showToast]);

  // Accept a gig
  const acceptGig = useCallback(async (gigId) => {
    if (!user) {
      showToast('Please login to accept work requirements', 'error');
      return false;
    }

    // Update local state immediately
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, acceptedBy: user.id, status: 'booked' } : g
    ));
    showToast('Work accepted! Contact the poster.', 'success');

    // Attempt update on Supabase
    try {
      await supabase
        .from('gigs')
        .update({ accepted_by: user.id, status: 'booked' })
        .eq('id', gigId);
    } catch { /* fallback to local */ }

    return true;
  }, [user, showToast]);

  // Cancel a gig
  const cancelGig = useCallback(async (gigId) => {
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, status: 'cancelled' } : g
    ));
    showToast('Work requirement cancelled', 'info');

    try {
      await supabase
        .from('gigs')
        .update({ status: 'cancelled' })
        .eq('id', gigId);
    } catch { /* fallback to local */ }
  }, [showToast]);

  // Complete a gig
  const completeGig = useCallback(async (gigId) => {
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, status: 'completed' } : g
    ));
    showToast('Work marked as completed!', 'success');

    try {
      await supabase
        .from('gigs')
        .update({ status: 'completed' })
        .eq('id', gigId);
    } catch { /* fallback to local */ }
  }, [showToast]);

  // Get user's posted gigs
  const getMyPostedGigs = useCallback(() => {
    if (!user) return [];
    return gigs.filter(g => g.postedBy === user.id).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [gigs, user]);

  // Get user's accepted/booked gigs
  const getMyBookedGigs = useCallback(() => {
    if (!user) return [];
    return gigs.filter(g => g.acceptedBy === user.id).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [gigs, user]);

  return (
    <GigContext.Provider value={{
      gigs,
      toasts,
      dismissToast,
      showToast,
      getUserById,
      getNearbyGigs,
      getGigById,
      postGig,
      acceptGig,
      cancelGig,
      completeGig,
      getMyPostedGigs,
      getMyBookedGigs,
    }}>
      {children}
    </GigContext.Provider>
  );
};

export const useGigs = () => {
  const ctx = useContext(GigContext);
  if (!ctx) throw new Error('useGigs must be used within GigProvider');
  return ctx;
};
