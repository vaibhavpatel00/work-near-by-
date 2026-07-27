import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const GigContext = createContext(null);

const GIGS_STORAGE_KEY = 'wikwik_gigs_v3';

const INITIAL_DEMO_GIGS = [
  {
    id: 'demo-gig-1',
    title: 'Experienced Driver Needed for Outstation Trip to Pune',
    description: 'Looking for a verified driver for a 2-day round trip to Pune. SUV vehicle provided. Must have valid DL and experience on highway driving.',
    category: 'driver',
    amount: 3500,
    currency: '₹',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    duration: '2 Days',
    location: {
      address: 'Banjara Hills, Hyderabad',
      lat: 17.4156,
      lng: 78.4347,
    },
    contactDetails: {
      phone: '+91 98765 43210',
      email: 'rajesh.sharma@example.com',
      whatsapp: true,
      allowCall: true,
    },
    attachments: [
      {
        id: 'att-1',
        name: 'Trip_Route_Details.pdf',
        type: 'document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
      {
        id: 'att-2',
        name: 'Car_Vehicle_Photo.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      }
    ],
    expiryDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0] + 'T23:59',
    maxApplications: 5,
    postedBy: 'user-101',
    postedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'active',
    acceptedBy: null,
    requests: [
      {
        id: 'req-1',
        workerId: 'user-worker-1',
        workerName: 'Vikram Singh',
        workerPhone: '+91 91234 56789',
        workerEmail: 'vikram.driver@example.com',
        message: 'Hello sir, I have 8 years of highway driving experience. Available immediately.',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        messages: [
          {
            id: 'm-1',
            senderId: 'user-worker-1',
            senderName: 'Vikram Singh',
            text: 'Hello sir, I have 8 years of highway driving experience. Available immediately.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'm-2',
            senderId: 'user-101',
            senderName: 'Rajesh Sharma',
            text: 'Hi Vikram, do you have experience driving heavy SUVs?',
            timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
          }
        ]
      }
    ]
  },
  {
    id: 'demo-gig-2',
    title: 'House Cleaning & Deep Kitchen Sanitization',
    description: 'Full 3BHK flat cleaning required before house party. Deep kitchen degreasing, bathroom scrubbing, and floor mopping.',
    category: 'housekeeping',
    amount: 1800,
    currency: '₹',
    date: new Date(Date.now() + 86400000 * 1).toISOString(),
    duration: '5 Hours',
    location: {
      address: 'Gachibowli, Hyderabad',
      lat: 17.4401,
      lng: 78.3489,
    },
    contactDetails: {
      phone: '+91 99887 76655',
      email: 'priya.kapoor@example.com',
      whatsapp: true,
      allowCall: false,
    },
    attachments: [
      {
        id: 'att-3',
        name: 'Kitchen_Area.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      }
    ],
    expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] + 'T18:00',
    maxApplications: 3,
    postedBy: 'user-102',
    postedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'active',
    acceptedBy: null,
    requests: []
  }
];

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
    return INITIAL_DEMO_GIGS;
  });

  const [toasts, setToasts] = useState([]);

  // Fetch initial gigs from Supabase and sync state
  const syncWithSupabase = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error || !data || data.length === 0) return;

      const formatted = data.map(g => ({
        id: String(g.id),
        title: g.title,
        description: g.description,
        category: g.category,
        amount: g.amount,
        currency: g.currency || '₹',
        date: g.date,
        duration: g.duration,
        location: g.location,
        contactDetails: g.contact_details || g.contactDetails || { phone: '', email: '', whatsapp: true, allowCall: true },
        attachments: g.attachments || [],
        expiryDate: g.expiry_date || g.expiryDate || null,
        maxApplications: g.max_applications || g.maxApplications || 5,
        postedBy: g.posted_by || g.postedBy,
        postedAt: g.posted_at || g.postedAt,
        status: g.status,
        acceptedBy: g.accepted_by || g.acceptedBy,
        requests: g.requests || [],
      }));

      setGigs(prev => {
        const map = new Map(prev.map(item => [item.id, item]));
        formatted.forEach(item => {
          map.set(item.id, { ...map.get(item.id), ...item });
        });
        return Array.from(map.values()).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
      });
    } catch (err) {
      console.info('Supabase sync info:', err.message);
    }
  }, []);

  // Fetch on mount & poll every 4 seconds for cross-device updates
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 4000);

    // Subscribe to realtime postgres_changes on 'gigs' table
    let channel = null;
    try {
      channel = supabase
        .channel('public:gigs_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, () => {
          syncWithSupabase();
        })
        .subscribe();
    } catch { /* ignore realtime fallback */ }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // Persist gigs to localStorage as client fallback
  useEffect(() => {
    try {
      localStorage.setItem(GIGS_STORAGE_KEY, JSON.stringify(gigs));
    } catch { /* storage limit safety */ }
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
      name: userId === 'user-101' ? 'Rajesh Sharma' : 'Community Member', 
      rating: 4.8 
    };
  }, [user]);

  // Check if gig is expired or reached max applications
  const isGigExpired = useCallback((gig) => {
    if (!gig) return false;
    if (gig.status === 'expired' || gig.status === 'cancelled' || gig.status === 'completed') return true;
    
    // Date check
    if (gig.expiryDate) {
      const now = new Date();
      const exp = new Date(gig.expiryDate);
      if (now > exp) return true;
    }

    // Max applications check
    const approvedOrPendingCount = (gig.requests || []).filter(r => r.status !== 'rejected').length;
    if (gig.maxApplications && approvedOrPendingCount >= gig.maxApplications) {
      return true;
    }

    return false;
  }, []);

  // Get nearby gigs within radius (or include all if radius is large)
  const getNearbyGigs = useCallback((filterCategory = null, searchQuery = '') => {
    let filtered = gigs.map(gig => {
      const expired = isGigExpired(gig);
      const computedStatus = (gig.status === 'active' && expired) ? 'expired' : gig.status;
      return { ...gig, status: computedStatus };
    }).filter(gig => {
      // Distance filter safety: if distance calculation returns valid number, check radius
      if (gig.location && gig.location.lat && gig.location.lng) {
        const dist = calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng);
        // Allow up to max radius or 500km fallback for multi-device cross-city testing
        if (radius < 100 && dist > radius) return false;
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
      distance: gig.location?.lat ? calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng) : 0,
    }));

    // Sort by posted time (newest first)
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
      distance: gig.location?.lat ? calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng) : 0,
    };
  }, [gigs, location, isGigExpired]);

  // Post a new gig (with multi-device Supabase syncing)
  const postGig = useCallback(async (gigData) => {
    const localId = generateId();
    const newGig = {
      ...gigData,
      id: localId,
      postedBy: user?.id || 'user-current',
      postedAt: new Date().toISOString(),
      status: 'active',
      acceptedBy: null,
      currency: '₹',
      contactDetails: gigData.contactDetails || {
        phone: user?.phone || '',
        email: user?.email || '',
        whatsapp: true,
        allowCall: true,
      },
      attachments: gigData.attachments || [],
      expiryDate: gigData.expiryDate || null,
      maxApplications: gigData.maxApplications ? Number(gigData.maxApplications) : 5,
      requests: [],
    };

    // Update local state immediately
    setGigs(prev => [newGig, ...prev]);
    showToast('Work requirement published successfully!', 'success');

    // Write to Supabase DB for cross-device public visibility
    try {
      const fullPayload = {
        id: localId,
        title: gigData.title,
        description: gigData.description,
        category: gigData.category,
        amount: Number(gigData.amount),
        currency: '₹',
        date: gigData.date || new Date().toISOString(),
        duration: gigData.duration || 'Flexible',
        location: gigData.location,
        contact_details: newGig.contactDetails,
        attachments: newGig.attachments,
        expiry_date: newGig.expiryDate,
        max_applications: newGig.maxApplications,
        posted_by: user?.id || 'user-current',
        status: 'active',
        requests: [],
      };

      const { error } = await supabase.from('gigs').insert([fullPayload]);

      if (error) {
        console.warn('Full payload insert warning, trying standard payload:', error.message);
        // Fallback insert without jsonb columns if migration not run yet
        await supabase.from('gigs').insert([{
          id: localId,
          title: gigData.title,
          description: gigData.description,
          category: gigData.category,
          amount: Number(gigData.amount),
          currency: '₹',
          date: gigData.date || new Date().toISOString(),
          duration: gigData.duration || 'Flexible',
          location: gigData.location,
          posted_by: user?.id || 'user-current',
          status: 'active',
        }]);
      }
    } catch (err) {
      console.info('Supabase insert fallback:', err.message);
    }

    return newGig;
  }, [user, showToast]);

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

    let updatedRequests = [];
    let updatedGigStatus = currentGig.status;

    setGigs(prev => prev.map(g => {
      if (String(g.id) !== String(gigId)) return g;
      updatedRequests = [...(g.requests || []), newRequest];
      const reachedMax = g.maxApplications && updatedRequests.filter(r => r.status !== 'rejected').length >= g.maxApplications;
      updatedGigStatus = reachedMax ? 'expired' : g.status;
      return {
        ...g,
        requests: updatedRequests,
        status: updatedGigStatus,
      };
    }));

    showToast('Work request sent to publisher! Waiting for approval.', 'success');

    // Sync to Supabase
    try {
      await supabase
        .from('gigs')
        .update({ requests: updatedRequests, status: updatedGigStatus })
        .eq('id', gigId);
    } catch { /* fallback */ }

    return true;
  }, [user, gigs, isGigExpired, showToast]);

  // Respond to request (Publisher approves or rejects worker request)
  const respondToRequest = useCallback(async (gigId, requestId, status) => {
    let updatedRequests = [];
    let updatedGigStatus = 'active';
    let acceptedWorkerId = null;

    setGigs(prev => prev.map(g => {
      if (String(g.id) !== String(gigId)) return g;
      const targetReq = (g.requests || []).find(r => r.id === requestId);
      updatedRequests = (g.requests || []).map(r =>
        r.id === requestId ? { ...r, status } : r
      );

      if (status === 'approved' && targetReq) {
        acceptedWorkerId = targetReq.workerId;
        updatedGigStatus = 'booked';
        return {
          ...g,
          requests: updatedRequests,
          acceptedBy: acceptedWorkerId,
          status: 'booked',
        };
      }

      return {
        ...g,
        requests: updatedRequests,
      };
    }));

    if (status === 'approved') {
      showToast('Applicant request approved! Booking confirmed.', 'success');
    } else {
      showToast('Application request rejected.', 'info');
    }

    // Sync to Supabase
    try {
      const updateData = { requests: updatedRequests };
      if (status === 'approved' && acceptedWorkerId) {
        updateData.accepted_by = acceptedWorkerId;
        updateData.status = 'booked';
      }
      await supabase.from('gigs').update(updateData).eq('id', gigId);
    } catch { /* fallback */ }
  }, [showToast]);

  // Send a chat message on a request thread
  const sendChatMessage = useCallback(async (gigId, requestId, text) => {
    if (!user || !text.trim()) return;

    let updatedRequests = [];

    setGigs(prev => prev.map(g => {
      if (String(g.id) !== String(gigId)) return g;
      updatedRequests = (g.requests || []).map(r => {
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
      return {
        ...g,
        requests: updatedRequests,
      };
    }));

    // Sync to Supabase
    try {
      await supabase.from('gigs').update({ requests: updatedRequests }).eq('id', gigId);
    } catch { /* fallback */ }
  }, [user]);

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
