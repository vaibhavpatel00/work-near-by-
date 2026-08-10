/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Format distance for display
 */
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)} km away`;
};

/**
 * Format time ago
 */
export const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Format date for display
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

/**
 * Format time
 */
export const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format currency with dynamic symbol
 */
export const formatAmount = (amount, symbol = '$') => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString()}`;
};

/**
 * Generate a unique RFC 4122 UUID v4
 */
export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Get user initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLen = 80) => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '…';
};

/**
 * Levenshtein distance for typo tolerance & fuzzy search
 */
export const getLevenshteinDistance = (a, b) => {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
};

/**
 * Common Category Keywords & Typo-tolerance Map
 */
export const CATEGORY_KEYWORDS = {
  electrician: ['electrician', 'electric', 'elctric', 'elctrician', 'electrisian', 'light', 'fan', 'wiring', 'switch', 'inverter', 'mcb', 'geyser', 'bijli', 'power', 'current', 'wire', 'short circuit'],
  mechanic: ['mechanic', 'mchanic', 'mecanic', 'mekanik', 'bike', 'motorcycle', 'scooter', 'scooty', 'puncture', 'panchar', 'garage', 'servicing', 'oil change', 'brake', 'engine', 'two wheeler', '2 wheeler', 'royal enfield', 'yamaha', 'honda'],
  plumber: ['plumber', 'plumbr', 'plamber', 'plumb', 'pipe', 'tap', 'leak', 'leakage', 'bathroom', 'sanitary', 'drain', 'drainage', 'toilet', 'flush', 'water tank', 'basin', 'sink'],
  water_filter: ['water', 'filter', 'water filter', 'watar', 'filtr', 'purifier', 'purifir', 'ro', 'aquaguard', 'kent', 'pureit', 'livpure', 'tds', 'candle', 'membrane', 'drinking water'],
  ac_repair: ['ac', 'air conditioner', 'ac repair', 'cooling', 'fridge', 'refrigerator', 'compressor', 'gas filling', 'hvac', 'deep clean', 'jet pump'],
  driver: ['driver', 'drivr', 'drivar', 'driving', 'car', 'acting driver', 'cab', 'chauffeur', 'carpool', 'bike pool', 'travel', 'ride'],
  carpenter: ['carpenter', 'carpentr', 'karpenter', 'wood', 'furniture', 'door', 'lock', 'bed', 'wardrobe', 'drawer', 'kitchen', 'hinges', 'wood work'],
  painter: ['painter', 'paintr', 'pentar', 'paint', 'painting', 'wall', 'color', 'distemper', 'texture', 'waterproof', 'white wash'],
  cleaner: ['cleaner', 'clean', 'cleaning', 'maid', 'house keeping', 'deep clean', 'sweep', 'mopping', 'housekeeping'],
  chef: ['cook', 'chef', 'cooking', 'rasoi', 'food', 'caterer', 'kitchen', 'khana'],
  tutor: ['tutor', 'teacher', 'tuition', 'study', 'maths', 'science', 'english', 'teaching'],
  beautician: ['beauty', 'beautician', 'salon', 'makeup', 'parlour', 'haircut', 'facial', 'massage'],
};

/**
 * Check if query matches a keyword or category fuzzily
 */
export const fuzzyMatchText = (query, targetText) => {
  if (!query || !targetText) return false;
  const q = query.toLowerCase().trim();
  const t = targetText.toLowerCase().trim();

  // Direct substring match
  if (t.includes(q)) return true;

  // Word-by-word prefix or substring match
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);

  for (const qWord of qWords) {
    if (qWord.length < 3) continue;
    for (const tWord of tWords) {
      if (tWord.startsWith(qWord) || tWord.includes(qWord)) return true;
      // If words are similar in length, check Levenshtein distance
      if (Math.abs(tWord.length - qWord.length) <= 2) {
        const dist = getLevenshteinDistance(qWord, tWord);
        if (dist <= 2) return true;
      }
    }
  }

  return false;
};
