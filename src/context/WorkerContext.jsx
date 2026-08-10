import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const WorkerContext = createContext(null);

const WORKERS_STORAGE_KEY = 'wikwik_workers_v1';
const GIG_CATEGORY_WORKER = 'worker_profile';

// Helper to encode metadata into description string
const encodeWorkerDescriptionWithMeta = (description, meta = {}) => {
  const cleanDesc = (description || '').split('\n\n__META__')[0];
  const metaObj = {
    workerId: meta.workerId || '',
    workerEmail: meta.workerEmail || '',
    name: meta.name || '',
    profession: meta.profession || 'electrician',
    customProfession: meta.customProfession || '',
    phone: meta.phone || '',
    whatsapp: meta.whatsapp || '',
    workingHours: meta.workingHours || '09:00 AM - 08:00 PM',
    workingDays: meta.workingDays || 'Monday - Saturday',
    experience: meta.experience || '',
    livingArea: meta.livingArea || '',
    location: meta.location || { address: '', lat: 0, lng: 0 },
    rate: meta.rate || 0,
    rateUnit: meta.rateUnit || 'per visit',
    currency: meta.currency || '₹',
    emergencyAvailable: Boolean(meta.emergencyAvailable),
    rating: meta.rating || 4.8,
    reviewsCount: meta.reviewsCount || 5,
    status: meta.status || 'active',
  };
  return `${cleanDesc}\n\n__META__${JSON.stringify(metaObj)}`;
};

// Helper to decode description and metadata
const decodeWorkerDescriptionWithMeta = (rawDescription) => {
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

export const WorkerProvider = ({ children }) => {
  const { location } = useLocation();
  const { user } = useAuth();

  const [workers, setWorkers] = useState(() => {
    try {
      const stored = localStorage.getItem(WORKERS_STORAGE_KEY);
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

  // Sync worker profiles from Supabase
  const syncWithSupabase = useCallback(async () => {
    try {
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('category', GIG_CATEGORY_WORKER)
        .eq('status', 'active')
        .order('posted_at', { ascending: false });

      if (!gigError && gigData && Array.isArray(gigData)) {
        const parsedWorkers = gigData.map(g => {
          const { description, meta } = decodeWorkerDescriptionWithMeta(g.description);
          return {
            id: String(g.id),
            workerId: meta.workerId || g.posted_by,
            workerEmail: meta.workerEmail || '',
            name: meta.name || g.title || 'Professional Worker',
            profession: meta.profession || 'electrician',
            customProfession: meta.customProfession || '',
            phone: meta.phone || '',
            whatsapp: meta.whatsapp || meta.phone || '',
            workingHours: meta.workingHours || '09:00 AM - 08:00 PM',
            workingDays: meta.workingDays || 'Monday - Saturday',
            experience: meta.experience || 'Experienced',
            livingArea: meta.livingArea || g.location?.address || 'Nearby Area',
            location: meta.location || g.location || { address: '', lat: 0, lng: 0 },
            rate: Number(meta.rate || g.amount || 0),
            rateUnit: meta.rateUnit || 'per visit',
            currency: g.currency || meta.currency || '₹',
            description: description || '',
            emergencyAvailable: Boolean(meta.emergencyAvailable),
            rating: Number(meta.rating || 4.8),
            reviewsCount: Number(meta.reviewsCount || 6),
            status: g.status || 'active',
            registeredAt: g.posted_at,
          };
        });

        if (parsedWorkers.length > 0) {
          setWorkers(parsedWorkers);
        }
      }
    } catch (err) {
      console.warn('Worker sync notice:', err);
    }
  }, []);

  // Fetch on mount & poll every 4 seconds + Realtime channel
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 4000);

    let channel = null;
    try {
      channel = supabase
        .channel('public:workers_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, () => {
          syncWithSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Worker realtime sub error:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
    } catch { /* safety */ }
  }, [workers]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Register or Update a worker profile
  const registerWorker = useCallback(async (workerData) => {
    const profileId = workerData.id || generateId();
    const workerUserId = user?.id || profileId;
    const workerUserEmail = (user?.email || workerData.workerEmail || '').trim().toLowerCase();

    const workerObj = {
      id: profileId,
      workerId: workerUserId,
      workerEmail: workerUserEmail,
      name: workerData.name || user?.name || 'Worker',
      profession: workerData.profession || 'electrician',
      customProfession: workerData.customProfession || '',
      phone: workerData.phone || user?.phone || '',
      whatsapp: workerData.whatsapp || workerData.phone || user?.phone || '',
      workingHours: workerData.workingHours || '09:00 AM - 08:00 PM',
      workingDays: workerData.workingDays || 'Monday - Saturday',
      experience: workerData.experience || '2+ Years',
      livingArea: workerData.livingArea || workerData.location?.address || 'Nearby',
      location: workerData.location || { address: workerData.livingArea || '', lat: location.lat, lng: location.lng },
      rate: Number(workerData.rate || 0),
      rateUnit: workerData.rateUnit || 'per visit',
      currency: workerData.currency || '₹',
      description: workerData.description || '',
      emergencyAvailable: Boolean(workerData.emergencyAvailable),
      rating: 4.9,
      reviewsCount: 1,
      status: 'active',
      registeredAt: new Date().toISOString(),
    };

    // Update local state immediately
    setWorkers(prev => [workerObj, ...prev.filter(w => w.id !== profileId && w.workerEmail !== workerUserEmail)]);
    showToast('Worker profile registered successfully! People nearby can now find and contact you.', 'success');

    // Central Supabase persist
    const encodedDescription = encodeWorkerDescriptionWithMeta(workerObj.description, workerObj);

    const payload = {
      id: profileId,
      title: `${workerObj.name} - ${workerObj.profession.toUpperCase()}`,
      description: encodedDescription,
      category: GIG_CATEGORY_WORKER,
      amount: workerObj.rate,
      currency: workerObj.currency,
      date: new Date().toISOString(),
      duration: workerObj.workingHours,
      location: workerObj.location,
      posted_by: isUuid(workerUserId) ? workerUserId : profileId,
      status: 'active',
      posted_at: workerObj.registeredAt,
    };

    try {
      await supabase.from('gigs').upsert([payload]);
    } catch (err) {
      console.warn('Worker Supabase save error:', err);
    }

    setTimeout(syncWithSupabase, 400);

    return workerObj;
  }, [user, location, showToast, syncWithSupabase]);

  // Search & Filter nearby workers by profession & radius
  const getNearbyWorkers = useCallback((filters = {}) => {
    const {
      profession,
      searchQuery = '',
      radiusKm = 50,
    } = filters;

    let filtered = workers.filter(worker => {
      if (worker.status !== 'active') return false;

      // Profession filter
      if (profession && profession !== 'all') {
        if (worker.profession !== profession && worker.customProfession !== profession) {
          return false;
        }
      }

      // Radius matching (Haversine distance from user's GPS/current location)
      if (worker.location && typeof worker.location.lat === 'number' && typeof worker.location.lng === 'number') {
        const dist = calculateDistance(location.lat, location.lng, worker.location.lat, worker.location.lng);
        if (radiusKm < 200 && dist > radiusKm) {
          return false;
        }
      }

      // Search Query filter (name, profession, livingArea, skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (worker.name || '').toLowerCase().includes(q);
        const matchesProf = (worker.profession || '').toLowerCase().includes(q);
        const matchesArea = (worker.livingArea || '').toLowerCase().includes(q);
        const matchesDesc = (worker.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesProf && !matchesArea && !matchesDesc) return false;
      }

      return true;
    });

    // Attach computed distance
    filtered = filtered.map(worker => ({
      ...worker,
      distance: (worker.location && typeof worker.location.lat === 'number')
        ? calculateDistance(location.lat, location.lng, worker.location.lat, worker.location.lng)
        : 0,
    }));

    // Sort by nearest first
    filtered.sort((a, b) => a.distance - b.distance);
    return filtered;
  }, [workers, location]);

  // Get worker by ID
  const getWorkerById = useCallback((id) => {
    const worker = workers.find(w => String(w.id) === String(id));
    if (!worker) return null;

    return {
      ...worker,
      distance: (worker.location && typeof worker.location.lat === 'number')
        ? calculateDistance(location.lat, location.lng, worker.location.lat, worker.location.lng)
        : 0,
    };
  }, [workers, location]);

  // Check if current logged in user has a registered worker profile
  const myWorkerProfile = user
    ? workers.find(w => 
        (user.email && w.workerEmail && user.email.toLowerCase() === w.workerEmail.toLowerCase()) ||
        (user.id && w.workerId && String(user.id) === String(w.workerId))
      ) || null
    : null;

  return (
    <WorkerContext.Provider value={{
      workers,
      toasts,
      showToast,
      registerWorker,
      getNearbyWorkers,
      getWorkerById,
      myWorkerProfile,
    }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkers = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorkers must be used within WorkerProvider');
  return ctx;
};
