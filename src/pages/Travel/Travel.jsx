import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Car, Bike, MapPin, Calendar, Navigation, 
  Plus, ArrowRight, Route, Users, Zap
} from 'lucide-react';
import { useRides } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import RideCard from '../../components/Cards/RideCard';
import './Travel.css';

const Travel = () => {
  const { searchRides, getAllActiveRides, getMyOfferedRides, getMyBookedRides } = useRides();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'myrides'
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all' | 'car' | 'bike'
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  // Search places using OpenStreetMap Nominatim
  const searchPlaces = async (query, setSuggestions, setSearching) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.info('Place search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Debounced origin search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(originSearch, setOriginSuggestions, setSearchingOrigin);
    }, 400);
    return () => clearTimeout(timer);
  }, [originSearch]);

  // Debounced destination search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(destSearch, setDestSuggestions, setSearchingDest);
    }, 400);
    return () => clearTimeout(timer);
  }, [destSearch]);

  // Get filtered rides
  const filteredRides = searchRides({
    vehicleType: vehicleFilter === 'all' ? null : vehicleFilter,
    originQuery: originSearch,
    destQuery: destSearch,
    date: dateFilter || null,
  });

  const allActiveRides = getAllActiveRides();
  const myOffered = getMyOfferedRides();
  const myBooked = getMyBookedRides();

  const displayRides = activeTab === 'find' 
    ? (originSearch || destSearch || dateFilter || vehicleFilter !== 'all' ? filteredRides : allActiveRides)
    : [];

  return (
    <div className="page-content">
      <div className="travel-page">
        {/* Hero Section */}
        <section className="travel-hero animate-fade-in">
          <div className="travel-hero-content">
            <div className="travel-hero-icon-row">
              <div className="hero-vehicle-icon car-icon">
                <Car size={28} />
              </div>
              <div className="hero-vehicle-icon bike-icon">
                <Bike size={28} />
              </div>
            </div>
            <h1 className="travel-hero-title">
              <span className="travel-gradient-text">Travel Together</span>
            </h1>
            <p className="travel-hero-subtitle">
              Share rides, save money — book a <strong>car</strong> or <strong>bike</strong> ride nearby
            </p>
          </div>

          <div className="travel-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{allActiveRides.length}</span>
              <span className="hero-stat-label">Active Rides</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{allActiveRides.filter(r => r.vehicleType === 'car').length}</span>
              <span className="hero-stat-label">Cars</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{allActiveRides.filter(r => r.vehicleType === 'bike').length}</span>
              <span className="hero-stat-label">Bikes</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="travel-quick-actions animate-fade-in-up">
          <Link to="/travel/offer" className="travel-action-card offer-card">
            <div className="action-icon-circle">
              <Plus size={24} />
            </div>
            <div className="action-text">
              <strong>Offer a Ride</strong>
              <span>Share your journey</span>
            </div>
            <ArrowRight size={18} className="action-arrow" />
          </Link>
        </section>

        {/* Tabs */}
        <section className="travel-tabs animate-fade-in-up">
          <button 
            className={`travel-tab ${activeTab === 'find' ? 'active' : ''}`}
            onClick={() => setActiveTab('find')}
          >
            <Search size={16} />
            Find Rides
          </button>
          <button 
            className={`travel-tab ${activeTab === 'myrides' ? 'active' : ''}`}
            onClick={() => setActiveTab('myrides')}
          >
            <Route size={16} />
            My Rides
          </button>
        </section>

        {/* Find Rides Tab */}
        {activeTab === 'find' && (
          <>
            {/* Search Card */}
            <section className="travel-search-card glass-card animate-fade-in-up">
              <div className="travel-search-route">
                <div className="search-input-group">
                  <div className="search-dot origin-dot"></div>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="travel-search-input"
                      placeholder="From where? (e.g. Hyderabad)"
                      value={originSearch}
                      onChange={e => { setOriginSearch(e.target.value); setOriginSuggestions([]); }}
                    />
                    {searchingOrigin && <span className="search-spinner">...</span>}
                  </div>
                </div>

                {originSuggestions.length > 0 && (
                  <div className="place-suggestions">
                    {originSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        className="suggestion-item"
                        onClick={() => {
                          const parts = place.display_name.split(',');
                          setOriginSearch(parts.slice(0, 2).join(',').trim());
                          setOriginSuggestions([]);
                        }}
                      >
                        <MapPin size={12} color="#22c55e" />
                        <span>{place.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="search-connector-line"></div>

                <div className="search-input-group">
                  <div className="search-dot dest-dot"></div>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="travel-search-input"
                      placeholder="To where? (e.g. Bangalore)"
                      value={destSearch}
                      onChange={e => { setDestSearch(e.target.value); setDestSuggestions([]); }}
                    />
                    {searchingDest && <span className="search-spinner">...</span>}
                  </div>
                </div>

                {destSuggestions.length > 0 && (
                  <div className="place-suggestions">
                    {destSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        className="suggestion-item"
                        onClick={() => {
                          const parts = place.display_name.split(',');
                          setDestSearch(parts.slice(0, 2).join(',').trim());
                          setDestSuggestions([]);
                        }}
                      >
                        <MapPin size={12} color="#ef4444" />
                        <span>{place.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="travel-search-filters">
                <div className="search-filter-group">
                  <Calendar size={14} />
                  <input
                    type="date"
                    className="travel-date-input"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </section>

            {/* Vehicle Type Toggle */}
            <section className="vehicle-type-toggle animate-fade-in-up">
              <button 
                className={`vehicle-toggle-btn ${vehicleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setVehicleFilter('all')}
              >
                <Zap size={14} />
                All
              </button>
              <button 
                className={`vehicle-toggle-btn car-toggle ${vehicleFilter === 'car' ? 'active' : ''}`}
                onClick={() => setVehicleFilter('car')}
              >
                <Car size={14} />
                Cars
              </button>
              <button 
                className={`vehicle-toggle-btn bike-toggle ${vehicleFilter === 'bike' ? 'active' : ''}`}
                onClick={() => setVehicleFilter('bike')}
              >
                <Bike size={14} />
                Bikes
              </button>
            </section>

            {/* Rides Feed */}
            <section className="travel-feed">
              <div className="feed-header">
                <h2 className="feed-title">Available Rides</h2>
                <span className="feed-count">{displayRides.length} found</span>
              </div>

              {displayRides.length > 0 ? (
                <div className="feed-list stagger-children">
                  {displayRides.map(ride => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              ) : (
                <div className="feed-empty">
                  <div className="feed-empty-icon">🚗</div>
                  <h3>No rides available</h3>
                  <p>Be the first to offer a ride or adjust your search!</p>
                  <Link to="/travel/offer" className="btn btn-primary mt-4">
                    Offer a Ride
                  </Link>
                </div>
              )}
            </section>
          </>
        )}

        {/* My Rides Tab */}
        {activeTab === 'myrides' && (
          <section className="travel-my-rides animate-fade-in-up">
            {!user ? (
              <div className="feed-empty">
                <div className="feed-empty-icon">🔒</div>
                <h3>Login Required</h3>
                <p>Please login to see your rides</p>
                <Link to="/login" className="btn btn-primary mt-4">Login</Link>
              </div>
            ) : (
              <>
                {/* Offered Rides */}
                <div className="my-rides-section">
                  <h3 className="my-rides-title">
                    <Car size={18} />
                    Rides I Offered ({myOffered.length})
                  </h3>
                  {myOffered.length > 0 ? (
                    <div className="feed-list">
                      {myOffered.map(ride => (
                        <RideCard key={ride.id} ride={ride} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary text-sm" style={{ padding: 'var(--space-4)' }}>
                      You haven't offered any rides yet.
                    </p>
                  )}
                </div>

                {/* Booked Rides */}
                <div className="my-rides-section">
                  <h3 className="my-rides-title">
                    <Users size={18} />
                    Rides I Booked ({myBooked.length})
                  </h3>
                  {myBooked.length > 0 ? (
                    <div className="feed-list">
                      {myBooked.map(ride => (
                        <RideCard key={ride.id} ride={ride} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary text-sm" style={{ padding: 'var(--space-4)' }}>
                      You haven't booked any rides yet.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Travel;
