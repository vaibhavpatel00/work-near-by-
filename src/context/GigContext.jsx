import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const GigContext = createContext(null);

const GIGS_STORAGE_KEY = 'wikwik_gigs_v2';

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

  // Fetch initial gigs from Supabase table if available
  useEffect(() => {
    let isMounted = true;
    const fetchGigsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('gigs')
          .select('*')
          .order('posted_at', { ascending: false });

        if (error || !data || data.length === 0) return;

        if (isMounted) {
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
            contactDetails: g.contact_details || { phone: '', email: '', whatsapp: true, allowCall: true },
            attachments: g.attachments || [],
            expiryDate: g.expiry_date || null,
            maxApplications: g.max_applications || 5,
            postedBy: g.posted_by,
            postedAt: g.posted_at,
            status: g.status,
            acceptedBy: g.accepted_by,
            requests: g.requests || [],
          }));
          
          // Merge with local state to preserve client state
          setGigs(prev => {
            const map = new Map(prev.map(item => [item.id, item]));
            formatted.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.info('Supabase table fallback to local state:', err.message);
      }
    };

    fetchGigsFromSupabase();
  }, []);

  // Persist gigs to localStorage
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

  // Get user by ID (from mock data or current user)
  const getUserById = useCallback((userId) => {
    if (user && user.id === userId) return user;
    return MOCK_USERS.find(u => u.id === userId) || { id: userId, name: userId === 'user-101' ? 'Rajesh Sharma' : 'Community Member', rating: 4.8 };
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

  // Get nearby gigs within radius
  const getNearbyGigs = useCallback((filterCategory = null, searchQuery = '') => {
    let filtered = gigs.map(gig => {
      // Auto update status if expired
      const expired = isGigExpired(gig);
      const computedStatus = (gig.status === 'active' && expired) ? 'expired' : gig.status;
      return { ...gig, status: computedStatus };
    }).filter(gig => {
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
  }, [gigs, location, radius, isGigExpired]);

  // Get gig by ID
  const getGigById = useCallback((id) => {
    const gig = gigs.find(g => g.id === id);
    if (!gig) return null;

    const expired = isGigExpired(gig);
    const computedStatus = (gig.status === 'active' && expired) ? 'expired' : gig.status;

    return {
      ...gig,
      status: computedStatus,
      distance: calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng),
    };
  }, [gigs, location, isGigExpired]);

  // Post a new gig
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

    // Update local state immediately for instant response
    setGigs(prev => [newGig, ...prev]);
    showToast('Work requirement published successfully!', 'success');

    // Attempt to write to Supabase table
    try {
      await supabase
        .from('gigs')
        .insert([{
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
          posted_by: user?.id || null,
          status: 'active',
          requests: [],
        }]);
    } catch (err) {
      console.info('Saved locally. Supabase insert info:', err.message);
    }

    return newGig;
  }, [user, showToast]);

  // Send a booking request (Worker applies for gig)
  const applyForGig = useCallback(async (gigId, message = '') => {
    if (!user) {
      showToast('Please login to send a work request', 'error');
      return false;
    }

    const currentGig = gigs.find(g => g.id === gigId);
    if (!currentGig) return false;

    if (isGigExpired(currentGig)) {
      showToast('This work requirement has expired or reached application limit', 'error');
      return false;
    }

    // Check if worker already applied
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

    setGigs(prev => prev.map(g => {
      if (g.id !== gigId) return g;
      const updatedRequests = [...(g.requests || []), newRequest];
      const reachedMax = g.maxApplications && updatedRequests.filter(r => r.status !== 'rejected').length >= g.maxApplications;
      return {
        ...g,
        requests: updatedRequests,
        status: reachedMax ? 'expired' : g.status,
      };
    }));

    showToast('Work request sent to publisher! Waiting for approval.', 'success');
    return true;
  }, [user, gigs, isGigExpired, showToast]);

  // Respond to request (Publisher approves or rejects worker request)
  const respondToRequest = useCallback(async (gigId, requestId, status) => {
    setGigs(prev => prev.map(g => {
      if (g.id !== gigId) return g;
      const targetReq = (g.requests || []).find(r => r.id === requestId);
      const updatedRequests = (g.requests || []).map(r =>
        r.id === requestId ? { ...r, status } : r
      );

      if (status === 'approved' && targetReq) {
        return {
          ...g,
          requests: updatedRequests,
          acceptedBy: targetReq.workerId,
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
  }, [showToast]);

  // Send a chat message on a request thread
  const sendChatMessage = useCallback((gigId, requestId, text) => {
    if (!user || !text.trim()) return;

    setGigs(prev => prev.map(g => {
      if (g.id !== gigId) return g;
      const updatedRequests = (g.requests || []).map(r => {
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
  }, [user]);

  // Cancel a gig
  const cancelGig = useCallback(async (gigId) => {
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, status: 'cancelled' } : g
    ));
    showToast('Work requirement cancelled', 'info');
  }, [showToast]);

  // Complete a gig
  const completeGig = useCallback(async (gigId) => {
    setGigs(prev => prev.map(g =>
      g.id === gigId ? { ...g, status: 'completed' } : g
    ));
    showToast('Work marked as completed!', 'success');
  }, [showToast]);

  // Get user's posted gigs
  const getMyPostedGigs = useCallback(() => {
    if (!user) return [];
    return gigs.filter(g => g.postedBy === user.id).sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [gigs, user]);

  // Get user's booked or applied gigs
  const getMyBookedGigs = useCallback(() => {
    if (!user) return [];
    return gigs.filter(g =>
      g.acceptedBy === user.id ||
      (g.requests || []).some(r => r.workerId === user.id)
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
