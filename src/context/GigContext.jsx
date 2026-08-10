import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const GigContext = createContext(null);

const GIGS_STORAGE_KEY = 'wikwik_gigs_v4';

// Helper to encode metadata into description string for 100% Supabase schema compatibility
const encodeDescriptionWithMeta = (description, meta = {}) => {
  const cleanDesc = (description || '').split('\n\n__META__')[0];
  const metaObj = {
    contactDetails: meta.contactDetails || null,
    attachments: meta.attachments || [],
    expiryDate: meta.expiryDate || null,
    maxApplications: meta.maxApplications || 5,
    requests: meta.requests || [],
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

export const GigProvider = ({ children }) => {
  const { location, radius } = useLocation();
  const { user } = useAuth();

  const [gigs, setGigs] = useState(() => {
    try {
      const stored = localStorage.getItem(GIGS_STORAGE_KEY);
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

  // Fetch all gigs from Supabase as SINGLE SOURCE OF TRUTH
  const syncWithSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) {
        console.error('Supabase Gigs Fetch Error:', error.message, error);
        return;
      }

      if (!data) return;

      const formatted = data.map(g => {
        const { description, meta } = decodeDescriptionWithMeta(g.description);
        return {
          id: String(g.id),
          title: g.title,
          description: description,
          category: g.category,
          amount: Number(g.amount),
          currency: g.currency || '₹',
          date: g.date,
          duration: g.duration || 'Flexible',
          location: g.location || { address: 'Nearby', lat: 17.385, lng: 78.4867 },
          postedBy: g.posted_by,
          postedAt: g.posted_at,
          status: g.status,
          acceptedBy: g.accepted_by,
          contactDetails: meta.contactDetails || g.contact_details || { phone: '', email: '', whatsapp: true, allowCall: true },
          attachments: meta.attachments || g.attachments || [],
          expiryDate: meta.expiryDate || g.expiry_date || null,
          maxApplications: meta.maxApplications || g.max_applications || 5,
          requests: meta.requests || g.requests || [],
        };
      });

      setGigs(formatted);
    } catch (err) {
      console.error('Supabase sync exception:', err);
    }
  }, []);

  // Fetch on mount & poll every 3 seconds for instant multi-device public updates
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 3000);

    let channel = null;
    try {
      channel = supabase
        .channel('public:gigs_realtime_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, (payload) => {
          console.log('Realtime change payload received:', payload);
          syncWithSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // Persist gigs to localStorage as client cache
  useEffect(() => {
    try {
      localStorage.setItem(GIGS_STORAGE_KEY, JSON.stringify(gigs));
    } catch { /* storage safety */ }
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

  // Get user by ID
  const getUserById = useCallback((userId) => {
    if (user && user.id === userId) return user;
    return MOCK_USERS.find(u => u.id === userId) || { 
      id: userId, 
      name: 'Community Member', 
      rating: 4.8 
    };
  }, [user]);

  // Check if gig is expired or reached max applications
  const isGigExpired = useCallback((gig) => {
    if (!gig) return false;
    if (gig.status === 'expired' || gig.status === 'cancelled' || gig.status === 'completed') return true;
    
    if (gig.expiryDate) {
      const now = new Date();
      const exp = new Date(gig.expiryDate);
      if (now > exp) return true;
    }

    const approvedOrPendingCount = (gig.requests || []).filter(r => r.status !== 'rejected').length;
    if (gig.maxApplications && approvedOrPendingCount >= gig.maxApplications) {
      return true;
    }

    return false;
  }, []);

  // Get nearby gigs for Home/Explore feed
  const getNearbyGigs = useCallback((filterCategory = null, searchQuery = '') => {
    let filtered = gigs.map(gig => {
      const expired = isGigExpired(gig);
      const computedStatus = (gig.status === 'active' && expired) ? 'expired' : gig.status;
      return { ...gig, status: computedStatus };
    }).filter(gig => {
      // Distance filter check
      if (gig.location && typeof gig.location.lat === 'number' && typeof gig.location.lng === 'number') {
        const dist = calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng);
        // Debug location filtering
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Location Filter] Gig: "${gig.title}", Distance: ${dist.toFixed(1)}km, Selected Radius: ${radius}km`);
        }
        // If distance is far greater than radius and radius is not max, filter
        if (radius < 150 && dist > radius) return false;
      }

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
      distance: (gig.location && typeof gig.location.lat === 'number')
        ? calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng) 
        : 0,
    }));

    filtered.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    return filtered;
  }, [gigs, location, radius, isGigExpired]);

  // Get gig by ID
  const getGigById = useCallback((id) => {
    const gig = gigs.find(g => String(g.id) === String(id));
    if (!gig) return null;

    const expired = isGigExpired(gig);
    const computedStatus = (gig.status === 'active' && expired) ? 'expired' : gig.status;

    return {
      ...gig,
      status: computedStatus,
      distance: (gig.location && typeof gig.location.lat === 'number')
        ? calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng) 
        : 0,
    };
  }, [gigs, location, isGigExpired]);

  // Post a new gig (Inserts centrally to Supabase)
  const postGig = useCallback(async (gigData) => {
    const localUuid = generateId(); // Valid RFC 4122 v4 UUID
    
    // Ensure valid UUID for posted_by column
    let postedByUuid = user?.id;
    if (!isUuid(postedByUuid)) {
      // If user is guest or mock user ID, pass null or valid UUID fallback
      postedByUuid = null;
    }

    const contactDetails = gigData.contactDetails || {
      phone: user?.phone || '',
      email: user?.email || '',
      whatsapp: true,
      allowCall: true,
    };
    const attachments = gigData.attachments || [];
    const expiryDate = gigData.expiryDate || null;
    const maxApplications = gigData.maxApplications ? Number(gigData.maxApplications) : 5;
    const requests = [];

    // Encode description with metadata
    const encodedDescription = encodeDescriptionWithMeta(gigData.description, {
      contactDetails,
      attachments,
      expiryDate,
      maxApplications,
      requests,
    });

    const newGig = {
      ...gigData,
      id: localUuid,
      postedBy: user?.id || postedByUuid || localUuid,
      postedAt: new Date().toISOString(),
      status: 'active',
      acceptedBy: null,
      currency: '₹',
      contactDetails,
      attachments,
      expiryDate,
      maxApplications,
      requests,
    };

    // Update local state immediately for fast UI feedback
    setGigs(prev => [newGig, ...prev]);

    // Send insertion payload strictly matching Supabase table columns
    const payload = {
      id: localUuid,
      title: gigData.title,
      description: encodedDescription,
      category: gigData.category,
      amount: Number(gigData.amount),
      currency: '₹',
      date: gigData.date || new Date().toISOString(),
      duration: gigData.duration || 'Flexible',
      location: gigData.location,
      posted_by: postedByUuid,
      status: 'active',
    };

    console.log('[Supabase Insert] Inserting new gig into public.gigs:', payload);

    try {
      const { data, error } = await supabase.from('gigs').insert([payload]).select();

      if (error) {
        console.error('[Supabase Insert Error]', error.code, error.message, error);
        showToast(`Warning: Supabase sync info (${error.message})`, 'warning');
      } else {
        console.log('[Supabase Insert Success] Record created centrally:', data);
        showToast('Work requirement published centrally on Supabase!', 'success');
        // Refresh feed from Supabase
        await syncWithSupabase();
      }
    } catch (err) {
      console.error('[Supabase Insert Catch Error]', err);
    }

    return newGig;
  }, [user, showToast, syncWithSupabase]);

  // Send a booking request (Worker applies for gig)
  const applyForGig = useCallback(async (gigId, message = '') => {
    if (!user) {
      showToast('Please login to send a work request', 'error');
      return false;
    }

    const currentGig = gigs.find(g => String(g.id) === String(gigId));
    if (!currentGig) return false;

    if (isGigExpired(currentGig)) {
      showToast('This work requirement has expired or reached application limit', 'error');
      return false;
    }

    const existingReq = (currentGig.requests || []).find(r => r.workerId === user.id);
    if (existingReq) {
      showToast('You have already applied for this work!', 'info');
      return false;
    }

    // Malpractice protection check: Worker cannot book multiple jobs at the same date & time
    const targetDateStr = new Date(currentGig.date).toDateString();
    const hasConflict = gigs.some(otherGig => {
      if (String(otherGig.id) === String(gigId)) return false;
      const otherDateStr = new Date(otherGig.date).toDateString();
      if (otherDateStr !== targetDateStr) return false;

      const userReqOnOther = (otherGig.requests || []).find(r => String(r.workerId) === String(user.id) && r.status !== 'rejected');
      const isUserAcceptedOnOther = String(otherGig.acceptedBy) === String(user.id);

      return isUserAcceptedOnOther || !!userReqOnOther;
    });

    if (hasConflict) {
      showToast('⚠️ Malpractice Protection: You already have a booking scheduled for this date & time!', 'error');
      return false;
    }

    const requestId = generateId();
    const newRequest = {
      id: requestId,
      workerId: user.id,
      workerName: user.name || 'Applicant Worker',
      workerPhone: user.phone || '',
      workerEmail: user.email || '',
      message: message || 'Hi, I am interested in doing this work!',
      status: 'pending',
      createdAt: new Date().toISOString(),
      messages: message ? [
        {
          id: generateId(),
          senderId: user.id,
          senderName: user.name || 'Applicant Worker',
          text: message,
          timestamp: new Date().toISOString(),
        }
      ] : [],
    };

    const updatedRequests = [...(currentGig.requests || []), newRequest];
    const reachedMax = currentGig.maxApplications && updatedRequests.filter(r => r.status !== 'rejected').length >= currentGig.maxApplications;
    const updatedGigStatus = reachedMax ? 'expired' : currentGig.status;

    const updatedEncodedDesc = encodeDescriptionWithMeta(currentGig.description, {
      contactDetails: currentGig.contactDetails,
      attachments: currentGig.attachments,
      expiryDate: currentGig.expiryDate,
      maxApplications: currentGig.maxApplications,
      requests: updatedRequests,
    });

    setGigs(prev => prev.map(g => {
      if (String(g.id) !== String(gigId)) return g;
      return {
        ...g,
        requests: updatedRequests,
        status: updatedGigStatus,
      };
    }));

    showToast('Work request sent to publisher! Waiting for approval.', 'success');

    // Update Supabase
    try {
      await supabase
        .from('gigs')
        .update({ description: updatedEncodedDesc, status: updatedGigStatus })
        .eq('id', gigId);
    } catch (e) {
      console.error('Supabase apply update error:', e);
    }

    return true;
  }, [user, gigs, isGigExpired, showToast]);

  // Respond to request (Publisher approves or rejects worker request)
  const respondToRequest = useCallback(async (gigId, requestId, status) => {
    const currentGig = gigs.find(g => String(g.id) === String(gigId));
    if (!currentGig) return;

    const targetReq = (currentGig.requests || []).find(r => r.id === requestId);
    const updatedRequests = (currentGig.requests || []).map(r =>
      r.id === requestId ? { ...r, status } : r
    );

    let acceptedWorkerId = currentGig.acceptedBy;
    let updatedGigStatus = currentGig.status;

    if (status === 'approved' && targetReq) {
      acceptedWorkerId = isUuid(targetReq.workerId) ? targetReq.workerId : null;
      updatedGigStatus = 'booked';
    }

    const updatedEncodedDesc = encodeDescriptionWithMeta(currentGig.description, {
      contactDetails: currentGig.contactDetails,
      attachments: currentGig.attachments,
      expiryDate: currentGig.expiryDate,
      maxApplications: currentGig.maxApplications,
      requests: updatedRequests,
    });

    setGigs(prev => prev.map(g => {
      if (String(g.id) !== String(gigId)) return g;
      return {
        ...g,
        requests: updatedRequests,
        acceptedBy: targetReq?.workerId || g.acceptedBy,
        status: updatedGigStatus,
      };
    }));

    if (status === 'approved') {
      showToast('Applicant request approved! Booking confirmed.', 'success');
    } else {
      showToast('Application request rejected.', 'info');
    }

    // Update Supabase
    try {
      const updatePayload = { description: updatedEncodedDesc, status: updatedGigStatus };
      if (status === 'approved' && acceptedWorkerId) {
        updatePayload.accepted_by = acceptedWorkerId;
      }
      await supabase.from('gigs').update(updatePayload).eq('id', gigId);
    } catch (e) {
      console.error('Supabase respond update error:', e);
    }
  }, [gigs, showToast]);

  // Send a chat message on a request thread
  const sendChatMessage = useCallback(async (gigId, requestId, text) => {
    if (!user || !text.trim()) return;

    const currentGig = gigs.find(g => String(g.id) === String(gigId));
    if (!currentGig) return;

    const updatedRequests = (currentGig.requests || []).map(r => {
      if (r.id !== requestId) return r;
      const newMsg = {
        id: generateId(),
        senderId: user.id,
        senderName: user.name || 'User',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      return {
        ...r,
        messages: [...(r.messages || []), newMsg],
      };
    });

    const updatedEncodedDesc = encodeDescriptionWithMeta(currentGig.description, {
      contactDetails: currentGig.contactDetails,
      attachments: currentGig.attachments,
      expiryDate: currentGig.expiryDate,
      maxApplications: currentGig.maxApplications,
      requests: updatedRequests,
    });

    setGigs(prev => prev.map(g => {
      if (String(g.id) !== String(gigId)) return g;
      return {
        ...g,
        requests: updatedRequests,
      };
    }));

    // Update Supabase
    try {
      await supabase.from('gigs').update({ description: updatedEncodedDesc }).eq('id', gigId);
    } catch (e) {
      console.error('Supabase chat update error:', e);
    }
  }, [user, gigs]);

  // Cancel a gig
  const cancelGig = useCallback(async (gigId) => {
    setGigs(prev => prev.map(g =>
      String(g.id) === String(gigId) ? { ...g, status: 'cancelled' } : g
    ));
    showToast('Work requirement cancelled', 'info');

    try {
      await supabase.from('gigs').update({ status: 'cancelled' }).eq('id', gigId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Complete a gig
  const completeGig = useCallback(async (gigId) => {
    setGigs(prev => prev.map(g =>
      String(g.id) === String(gigId) ? { ...g, status: 'completed' } : g
    ));
    showToast('Work marked as completed!', 'success');

    try {
      await supabase.from('gigs').update({ status: 'completed' }).eq('id', gigId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Delete a gig
  const deleteGig = useCallback(async (gigId) => {
    setGigs(prev => prev.filter(g => String(g.id) !== String(gigId)));
    showToast('Work requirement deleted successfully', 'info');

    try {
      await supabase.from('gigs').delete().eq('id', gigId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Get user's posted gigs
  const getMyPostedGigs = useCallback(() => {
    if (!user) return [];
    return gigs.filter(g => String(g.postedBy) === String(user.id)).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [gigs, user]);

  // Get user's booked or applied gigs
  const getMyBookedGigs = useCallback(() => {
    if (!user) return [];
    return gigs.filter(g =>
      String(g.acceptedBy) === String(user.id) ||
      (g.requests || []).some(r => String(r.workerId) === String(user.id))
    ).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
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
      isGigExpired,
      postGig,
      applyForGig,
      respondToRequest,
      sendChatMessage,
      cancelGig,
      completeGig,
      deleteGig,
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
