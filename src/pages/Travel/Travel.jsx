import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Car, Bike, MapPin, Calendar, Navigation, 
  Plus, ArrowRight, Route, Users, Zap, Globe, SlidersHorizontal, 
  Map as MapIcon, Compass, X
} from 'lucide-react';
import { useRides } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { COUNTRIES } from '../../data/countries';
import RideCard from '../../components/Cards/RideCard';
import MapLocationPicker from '../../components/Map/MapLocationPicker';
import './Travel.css';

const Travel = () => {
  const { searchRides, getAllActiveRides, getMyOfferedRides, getMyBookedRides } = useRides();
  const { user } = useAuth();
  const { location } = useLocation();

  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'myrides'
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all' | 'car' | 'bike'
  const [selectedCountry, setSelectedCountry] = useState('ALL'); // 'ALL' or country code like 'IN', 'US', etc.
  
  // Origin
  const [originSearch, setOriginSearch] = useState('');
  const [originCoords, setOriginCoords] = useState(null); // { lat, lng }
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);

  // Destination
  const [destSearch, setDestSearch] = useState('');
  const [destCoords, setDestCoords] = useState(null); // { lat, lng }
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchingDest, setSearchingDest] = useState(false);

  // Date & Radius
  const [dateFilter, setDateFilter] = useState('');
  const [matchRadius, setMatchRadius] = useState(60); // 50-60 km radius

  // Map Picker Modal State
  const [mapPickerTarget, setMapPickerTarget] = useState(null); // 'origin' | 'dest' | null

  // Search places using OpenStreetMap Nominatim with spelling tolerance & country filter
  const searchPlaces = async (query, countryCode, setSuggestions, setSearching) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`;
      if (countryCode && countryCode !== 'ALL') {
        url += `&countrycodes=${countryCode.toLowerCase()}`;
      }

      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.info('Place search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Debounced origin search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(originSearch, selectedCountry, setOriginSuggestions, setSearchingOrigin);
    }, 350);
    return () => clearTimeout(timer);
  }, [originSearch, selectedCountry]);

  // Debounced destination search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(destSearch, selectedCountry, setDestSuggestions, setSearchingDest);
    }, 350);
    return () => clearTimeout(timer);
  }, [destSearch, selectedCountry]);

  // Handle map selection
  const handleMapLocationSelect = (loc) => {
    if (mapPickerTarget === 'origin') {
      setOriginSearch(loc.address);
      setOriginCoords({ lat: loc.lat, lng: loc.lng });
      setOriginSuggestions([]);
    } else if (mapPickerTarget === 'dest') {
      setDestSearch(loc.address);
      setDestCoords({ lat: loc.lat, lng: loc.lng });
      setDestSuggestions([]);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setOriginSearch('');
    setOriginCoords(null);
    setDestSearch('');
    setDestCoords(null);
    setDateFilter('');
    setVehicleFilter('all');
  };

  // Get filtered rides with 50-60 km radius matching
  const hasActiveFilters = Boolean(originSearch || destSearch || dateFilter || (vehicleFilter !== 'all'));

  const filteredRides = searchRides({
    vehicleType: vehicleFilter === 'all' ? null : vehicleFilter,
    originQuery: originSearch,
    originCoords,
    destQuery: destSearch,
    destCoords,
    date: dateFilter || null,
    radiusKm: matchRadius,
  });

  const allActiveRides = getAllActiveRides();
  const myOffered = getMyOfferedRides();
  const myBooked = getMyBookedRides();

  const displayRides = activeTab === 'find' 
    ? (hasActiveFilters ? filteredRides : allActiveRides)
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
              Share rides, save money — book a <strong>car</strong> or <strong>bike</strong> ride nearby across all cities & countries
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

        {/* Quick Action: Offer Ride */}
        <section className="travel-quick-actions animate-fade-in-up">
          <Link to="/travel/offer" className="travel-action-card offer-card">
            <div className="action-icon-circle">
              <Plus size={24} />
            </div>
            <div className="action-text">
              <strong>Offer a Ride</strong>
              <span>Share empty seats in your car or bike</span>
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
            My Rides ({myOffered.length + myBooked.length})
          </button>
        </section>

        {/* Find Rides Tab */}
        {activeTab === 'find' && (
          <>
            {/* Search Card */}
            <section className="travel-search-card glass-card animate-fade-in-up">
              {/* Country Selector Header */}
              <div className="search-country-bar">
                <div className="country-select-wrapper">
                  <Globe size={15} className="text-accent" />
                  <span className="country-label">Country:</span>
                  <select
                    className="country-dropdown"
                    value={selectedCountry}
                    onChange={e => setSelectedCountry(e.target.value)}
                  >
                    <option value="ALL">🌍 All Countries (Global)</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <X size={13} /> Reset
                  </button>
                )}
              </div>

              {/* Route Search Inputs */}
              <div className="travel-search-route">
                {/* 1. Origin Input */}
                <div className="search-input-group">
                  <div className="search-dot origin-dot"></div>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="travel-search-input"
                      placeholder="From where? (Starting location, city, area...)"
                      value={originSearch}
                      onChange={e => {
                        setOriginSearch(e.target.value);
                        setOriginCoords(null);
                      }}
                    />
                    {searchingOrigin && <span className="search-spinner">Searching...</span>}
                  </div>
                  <button
                    type="button"
                    className="map-pick-trigger-btn"
                    onClick={() => setMapPickerTarget('origin')}
                    title="Pinpoint starting location on map"
                  >
                    <MapIcon size={16} />
                    <span className="btn-label">Map</span>
                  </button>
                </div>

                {/* Origin Autocomplete Suggestions */}
                {originSuggestions.length > 0 && (
                  <div className="place-suggestions animate-fade-in">
                    {originSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        className="suggestion-item"
                        onClick={() => {
                          const parts = place.display_name.split(',');
                          const shortName = parts.slice(0, 3).join(',').trim();
                          setOriginSearch(shortName);
                          setOriginCoords({
                            lat: parseFloat(place.lat),
                            lng: parseFloat(place.lon),
                          });
                          setOriginSuggestions([]);
                        }}
                      >
                        <MapPin size={14} color="#22c55e" />
                        <div className="suggestion-text">
                          <strong>{place.display_name.split(',')[0]}</strong>
                          <span>{place.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="search-connector-line"></div>

                {/* 2. Destination Input */}
                <div className="search-input-group">
                  <div className="search-dot dest-dot"></div>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      className="travel-search-input"
                      placeholder="To where? (Destination city, drop location...)"
                      value={destSearch}
                      onChange={e => {
                        setDestSearch(e.target.value);
                        setDestCoords(null);
                      }}
                    />
                    {searchingDest && <span className="search-spinner">Searching...</span>}
                  </div>
                  <button
                    type="button"
                    className="map-pick-trigger-btn dest-map-btn"
                    onClick={() => setMapPickerTarget('dest')}
                    title="Pinpoint destination on map"
                  >
                    <MapIcon size={16} />
                    <span className="btn-label">Map</span>
                  </button>
                </div>

                {/* Destination Autocomplete Suggestions */}
                {destSuggestions.length > 0 && (
                  <div className="place-suggestions animate-fade-in">
                    {destSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        className="suggestion-item"
                        onClick={() => {
                          const parts = place.display_name.split(',');
                          const shortName = parts.slice(0, 3).join(',').trim();
                          setDestSearch(shortName);
                          setDestCoords({
                            lat: parseFloat(place.lat),
                            lng: parseFloat(place.lon),
                          });
                          setDestSuggestions([]);
                        }}
                      >
                        <MapPin size={14} color="#ef4444" />
                        <div className="suggestion-text">
                          <strong>{place.display_name.split(',')[0]}</strong>
                          <span>{place.display_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Radius & Date Filters */}
              <div className="travel-search-filters">
                <div className="search-filter-group date-picker-group">
                  <Calendar size={15} />
                  <input
                    type="date"
                    className="travel-date-input"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* 50-60 km Radius Filter Selector */}
                <div className="radius-selector-pill">
                  <SlidersHorizontal size={14} />
                  <span>Radius:</span>
                  <select
                    className="radius-dropdown"
                    value={matchRadius}
                    onChange={e => setMatchRadius(Number(e.target.value))}
                  >
                    <option value={30}>30 km</option>
                    <option value={50}>50 km</option>
                    <option value={60}>60 km (Recommended)</option>
                    <option value={80}>80 km</option>
                    <option value={100}>100 km</option>
                  </select>
                </div>

                <button 
                  className="btn btn-primary travel-search-btn"
                  onClick={() => {
                    setOriginSuggestions([]);
                    setDestSuggestions([]);
                  }}
                >
                  <Search size={18} />
                  Search Rides
                </button>
              </div>

              {/* 50-60km Radius Helper Notice */}
              <div className="search-radius-notice">
                <span>🎯 Matching rides within <strong>{matchRadius} km</strong> of both starting & ending points</span>
              </div>
            </section>

            {/* Vehicle Type Toggle */}
            <section className="vehicle-type-toggle animate-fade-in-up">
              <button 
                className={`vehicle-toggle-btn ${vehicleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setVehicleFilter('all')}
              >
                <Zap size={14} />
                All Rides ({displayRides.length})
              </button>
              <button 
                className={`vehicle-toggle-btn car-toggle ${vehicleFilter === 'car' ? 'active' : ''}`}
                onClick={() => setVehicleFilter('car')}
              >
                <Car size={14} />
                Cars ({displayRides.filter(r => r.vehicleType === 'car').length})
              </button>
              <button 
                className={`vehicle-toggle-btn bike-toggle ${vehicleFilter === 'bike' ? 'active' : ''}`}
                onClick={() => setVehicleFilter('bike')}
              >
                <Bike size={14} />
                Bikes ({displayRides.filter(r => r.vehicleType === 'bike').length})
              </button>
            </section>

            {/* Rides Feed */}
            <section className="travel-feed">
              <div className="feed-header">
                <h2 className="feed-title">
                  {hasActiveFilters ? 'Search Results' : 'Available Rides'}
                </h2>
                <span className="feed-count">{displayRides.length} rides found</span>
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
                  <h3>No rides match your criteria</h3>
                  <p>Try broadening your location, increasing search radius, or be the first to offer a ride!</p>
                  <div className="empty-actions mt-4">
                    {hasActiveFilters && (
                      <button className="btn btn-outline" onClick={clearFilters}>
                        Clear Filters
                      </button>
                    )}
                    <Link to="/travel/offer" className="btn btn-primary">
                      Offer a Ride
                    </Link>
                  </div>
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
                <p>Please login to see your offered and booked rides</p>
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
                    <div className="empty-tab-sub">
                      <p className="text-secondary text-sm">You haven't offered any rides yet.</p>
                      <Link to="/travel/offer" className="btn btn-primary btn-sm mt-3">
                        Offer a Ride Now
                      </Link>
                    </div>
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
                    <div className="empty-tab-sub">
                      <p className="text-secondary text-sm">You haven't booked any seats yet.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* Interactive OpenStreetMap Location Picker Modal */}
        {mapPickerTarget && (
          <MapLocationPicker
            isOpen={Boolean(mapPickerTarget)}
            onClose={() => setMapPickerTarget(null)}
            onSelectLocation={handleMapLocationSelect}
            title={mapPickerTarget === 'origin' ? '📍 Select Starting Location (Origin)' : '🏁 Select Drop Location (Destination)'}
            pinColor={mapPickerTarget === 'origin' ? '#22c55e' : '#ef4444'}
            initialLat={mapPickerTarget === 'origin' ? (originCoords?.lat || location.lat) : (destCoords?.lat || location.lat)}
            initialLng={mapPickerTarget === 'origin' ? (originCoords?.lng || location.lng) : (destCoords?.lng || location.lng)}
            initialAddress={mapPickerTarget === 'origin' ? originSearch : destSearch}
            showRadius={matchRadius}
          />
        )}
      </div>
    </div>
  );
};

export default Travel;
