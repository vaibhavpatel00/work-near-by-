import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Zap, Navigation, ChevronDown, Check, 
  Users, Plus, Car, Bike, ArrowRight, Sparkles, Wrench, Briefcase, 
  SlidersHorizontal, Lightbulb, X 
} from 'lucide-react';
import { useGigs } from '../../context/GigContext';
import { useWorkers } from '../../context/WorkerContext';
import { useRides } from '../../context/RideContext';
import { useLocation } from '../../context/LocationContext';
import { CATEGORIES } from '../../data/categories';
import { fuzzyMatchText, CATEGORY_KEYWORDS } from '../../utils/helpers';
import GigCard from '../../components/Cards/GigCard';
import WorkerCard from '../../components/Cards/WorkerCard';
import RideCard from '../../components/Cards/RideCard';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [homeFeedTab, setHomeFeedTab] = useState('gigs'); // 'gigs' | 'workers' | 'rides'
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [searchingArea, setSearchingArea] = useState(false);

  const searchBoxRef = useRef(null);

  const { getNearbyGigs } = useGigs();
  const { getNearbyWorkers } = useWorkers();
  const { getAllActiveRides } = useRides();
  const { location, radius, setRadius, requestLocation, locating } = useLocation();

  // Close search suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // 1. Smart Category & Worker Search Suggestions with Spell Correction
  const searchSuggestions = useMemo(() => {
    if (!search.trim() || search.trim().length < 2) {
      return { matchedCategories: [], matchedWorkers: [], didYouMean: null };
    }

    const q = search.trim().toLowerCase();

    // A. Match Categories by name, id, or synonyms/keywords
    const matchedCategories = CATEGORIES.filter(cat => {
      if (fuzzyMatchText(q, cat.name) || fuzzyMatchText(q, cat.id)) return true;
      const keywords = CATEGORY_KEYWORDS[cat.id] || [];
      return keywords.some(k => fuzzyMatchText(q, k));
    });

    // B. Match Workers by Name, Shop Name, Area, or Custom Profession
    const allWorkers = getNearbyWorkers({ radiusKm: 999 });
    const matchedWorkers = allWorkers.filter(w => {
      return (
        fuzzyMatchText(q, w.name) ||
        fuzzyMatchText(q, w.livingArea) ||
        fuzzyMatchText(q, w.customProfession) ||
        fuzzyMatchText(q, w.description)
      );
    }).slice(0, 5);

    // C. Did You Mean Spell Suggestion
    let didYouMean = null;
    if (matchedCategories.length > 0) {
      const topCat = matchedCategories[0];
      if (topCat.name.toLowerCase() !== q) {
        didYouMean = topCat;
      }
    }

    return { matchedCategories, matchedWorkers, didYouMean };
  }, [search, getNearbyWorkers]);

  // 2. Nearby Gigs (Client Work Requirements)
  const nearbyGigs = useMemo(() => {
    let list = getNearbyGigs(selectedCategory);
    if (search.trim()) {
      list = list.filter(g => 
        fuzzyMatchText(search, g.title) ||
        fuzzyMatchText(search, g.description) ||
        fuzzyMatchText(search, g.category) ||
        fuzzyMatchText(search, g.location?.address)
      );
    }
    return list;
  }, [getNearbyGigs, selectedCategory, search]);

  const activeGigs = nearbyGigs.filter(g => g.status === 'active');

  // 3. Nearby Workers (Electricians, Mechanics, etc.)
  const nearbyWorkers = useMemo(() => {
    return getNearbyWorkers({
      profession: selectedCategory || 'all',
      searchQuery: search,
      radiusKm: radius,
    });
  }, [getNearbyWorkers, selectedCategory, search, radius]);

  // 4. Nearby Travel Rides (Car & Bike)
  const allActiveRides = getAllActiveRides();

  // Search places using OpenStreetMap Nominatim
  useEffect(() => {
    if (!areaSearchQuery.trim() || areaSearchQuery.length < 3) {
      setAreaSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingArea(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(areaSearchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setAreaSuggestions(data);
        }
      } catch (err) {
        console.info('Area search failed:', err);
      } finally {
        setSearchingArea(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [areaSearchQuery]);

  const selectSuggestedArea = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const parts = place.display_name.split(',');
    const areaName = parts.slice(0, 2).join(',').trim();

    const newLoc = {
      lat,
      lng,
      address: areaName,
    };

    localStorage.setItem('wikwik_location', JSON.stringify(newLoc));
    window.location.reload();
  };

  const handleSelectCategorySuggestion = (cat) => {
    setSelectedCategory(cat.id);
    setSearch('');
    setShowSearchDropdown(false);
    // Switch to appropriate feed tab
    setHomeFeedTab('workers');
  };

  const handleSelectWorkerSuggestion = (worker) => {
    setShowSearchDropdown(false);
    navigate(`/worker/${worker.id}`);
  };

  const handleApplyDidYouMean = (cat) => {
    setSelectedCategory(cat.id);
    setSearch(cat.name);
    setShowSearchDropdown(false);
  };

  return (
    <div className="page-content">
      <div className="home-page">
        {/* Hero Section */}
        <section className="home-hero animate-fade-in">
          <div className="hero-content">
            <h1 className="hero-title">
              Hyperlocal <span className="hero-highlight">Work & Travel</span>
            </h1>
            <p className="hero-subtitle">
              Hire nearby skilled workers, post your job requirements, or find shared car & bike travel rides.
            </p>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{activeGigs.length}</span>
              <span className="hero-stat-label">Work Posts</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{nearbyWorkers.length}</span>
              <span className="hero-stat-label">Workers</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{allActiveRides.length}</span>
              <span className="hero-stat-label">Travel Rides</span>
            </div>
          </div>
        </section>

        {/* ========================================================
            VISITOR INTENT GATEWAY ("What are you looking for today?")
            ======================================================== */}
        <section className="visitor-gateway-section animate-fade-in-up">
          <h2 className="gateway-heading">What are you looking for today?</h2>
          
          <div className="gateway-grid">
            {/* Card 1: Find Skilled Workers */}
            <Link to="/explore" className="gateway-card workers-card">
              <div className="gateway-icon-box workers-bg">
                <Users size={26} />
              </div>
              <div className="gateway-text-box">
                <span className="gateway-tag">Instant Hire</span>
                <h3>Find Skilled Workers</h3>
                <p>Electricians, Bike Mechanics, Plumbers, Cooks & Technicians nearby</p>
              </div>
              <div className="gateway-action-link">
                <span>Browse Workers</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            {/* Card 2: Post a Job / Need */}
            <Link to="/post" className="gateway-card post-card">
              <div className="gateway-icon-box post-bg">
                <Plus size={26} />
              </div>
              <div className="gateway-text-box">
                <span className="gateway-tag">Hire Helpers</span>
                <h3>Post Work Requirement</h3>
                <p>Need domestic help or custom work? Post and get worker applications</p>
              </div>
              <div className="gateway-action-link">
                <span>Post a Job</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            {/* Card 3: Find or Offer Travel Rides */}
            <Link to="/travel" className="gateway-card travel-card">
              <div className="gateway-icon-box travel-bg">
                <Car size={26} />
              </div>
              <div className="gateway-text-box">
                <span className="gateway-tag">Save Money</span>
                <h3>Travel Together (Car / Bike)</h3>
                <p>Share rides across cities, carpool & bike pool with verified owners</p>
              </div>
              <div className="gateway-action-link">
                <span>Find or Offer Rides</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            {/* Card 4: Join as a Worker */}
            <Link to="/register-worker" className="gateway-card join-card">
              <div className="gateway-icon-box join-bg">
                <Wrench size={26} />
              </div>
              <div className="gateway-text-box">
                <span className="gateway-tag">Earn Income</span>
                <h3>List Your Services as a Worker</h3>
                <p>Register your skills, working hours, and phone to get hired nearby</p>
              </div>
              <div className="gateway-action-link">
                <span>Join as Worker</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>
        </section>

        {/* Location & Smart Search Bar */}
        <section className="home-search animate-fade-in-up" ref={searchBoxRef}>
          <div className="location-header-bar">
            <div className="location-header-info">
              <MapPin size={16} className="location-header-pin" />
              <div>
                <span className="location-header-text">
                  {locating ? 'Locating your GPS...' : (location.address || 'Set your location area')}
                </span>
                <span className="location-header-sub">({radius} km radius)</span>
              </div>
            </div>
            <button
              className="location-header-btn"
              onClick={() => setShowAreaPicker(!showAreaPicker)}
            >
              Change Area <ChevronDown size={12} style={{ display: 'inline', marginLeft: '2px' }} />
            </button>
          </div>

          {/* Area Picker Dropdown / Search Modal */}
          {showAreaPicker && (
            <div className="area-picker-dropdown animate-fade-in">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => { requestLocation(); setShowAreaPicker(false); }}
                  disabled={locating}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Navigation size={14} /> Use Live GPS Location
                </button>
              </div>

              <div className="area-picker-input-wrapper">
                <Search size={14} className="input-icon" />
                <input
                  type="text"
                  className="area-picker-input"
                  placeholder="Type specific area or city (e.g. Kondapur, Hitech City, Hyderabad...)"
                  value={areaSearchQuery}
                  onChange={e => setAreaSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {searchingArea && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Searching places...</p>}

              {areaSuggestions.length > 0 && (
                <div className="area-suggestions">
                  {areaSuggestions.map((place, idx) => (
                    <button
                      key={idx}
                      className="area-suggestion-item"
                      onClick={() => selectSuggestedArea(place)}
                    >
                      <MapPin size={12} color="#818cf8" />
                      <span>{place.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Smart Search Input with Live Dropdown & Spell Suggestion */}
          <div className="search-bar-container">
            <div className="search-bar">
              <div className="input-icon-wrapper">
                <Search size={18} className="input-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by worker name, shop name, or skill (e.g. Electrician, Siri Chandana, Madhapur...)"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                />
                {search && (
                  <button 
                    type="button"
                    className="clear-search-btn"
                    onClick={() => {
                      setSearch('');
                      setShowSearchDropdown(false);
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Smart Search Dropdown */}
            {showSearchDropdown && search.trim().length >= 2 && (
              <div className="smart-search-dropdown glass-card animate-fade-in">
                {/* 1. Category Matches */}
                {searchSuggestions.matchedCategories.length > 0 && (
                  <div className="suggestion-section">
                    <div className="suggestion-section-title">
                      <Zap size={13} className="text-accent" /> Categories / Trades
                    </div>
                    {searchSuggestions.matchedCategories.slice(0, 4).map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className="suggestion-item category-item"
                        onClick={() => handleSelectCategorySuggestion(cat)}
                      >
                        <span className="sugg-icon">{cat.emoji}</span>
                        <div className="sugg-info">
                          <strong>{cat.name}</strong>
                          <span className="sugg-sub">Auto-filter workers & work posts</span>
                        </div>
                        <span className="sugg-action">Select Category →</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Worker / Shop Matches */}
                {searchSuggestions.matchedWorkers.length > 0 && (
                  <div className="suggestion-section mt-2">
                    <div className="suggestion-section-title">
                      <Users size={13} className="text-primary" /> Verified Workers & Local Shops
                    </div>
                    {searchSuggestions.matchedWorkers.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        className="suggestion-item worker-item"
                        onClick={() => handleSelectWorkerSuggestion(w)}
                      >
                        <span className="sugg-icon">👷</span>
                        <div className="sugg-info">
                          <strong>{w.name}</strong>
                          <span className="sugg-sub">{w.customProfession || w.profession} • 📍 {w.livingArea}</span>
                        </div>
                        <span className="sugg-action">View Profile →</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Empty Suggestions */}
                {searchSuggestions.matchedCategories.length === 0 && searchSuggestions.matchedWorkers.length === 0 && (
                  <div className="suggestion-empty">
                    <span>No exact match for "{search}"</span>
                    <p className="text-xs text-tertiary">Searching all posts and workers with fuzzy matching...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spell Correction / Did You Mean Banner */}
          {searchSuggestions.didYouMean && search.trim() && (
            <div className="did-you-mean-banner animate-fade-in">
              <Lightbulb size={14} className="text-warning" />
              <span>Did you mean:</span>
              <button 
                type="button" 
                className="did-you-mean-btn"
                onClick={() => handleApplyDidYouMean(searchSuggestions.didYouMean)}
              >
                {searchSuggestions.didYouMean.emoji} {searchSuggestions.didYouMean.name}
              </button>
            </div>
          )}

          {/* Radius Selector */}
          <div className="radius-selector">
            <span className="radius-label">Search Radius:</span>
            <div className="radius-options">
              {[25, 50, 100, 150].map(r => (
                <button
                  key={r}
                  className={`radius-chip ${radius === r ? 'active' : ''}`}
                  onClick={() => {
                    setRadius(r);
                    localStorage.setItem('wikwik_radius', String(r));
                  }}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Category Pills */}
        <section className="home-categories animate-fade-in-up">
          <div className="categories-scroll">
            <button
              className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <Zap size={14} />
              <span>All Categories</span>
            </button>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Live Marketplace Feed */}
        <section className="home-feed animate-fade-in-up">
          {/* Feed Tabs: Customer Posts vs Nearby Workers vs Travel Rides */}
          <div className="home-feed-tabs">
            <button
              className={`feed-tab-btn ${homeFeedTab === 'gigs' ? 'active' : ''}`}
              onClick={() => setHomeFeedTab('gigs')}
            >
              <Briefcase size={15} />
              Work Requirements ({activeGigs.length})
            </button>
            <button
              className={`feed-tab-btn ${homeFeedTab === 'workers' ? 'active' : ''}`}
              onClick={() => setHomeFeedTab('workers')}
            >
              <Users size={15} />
              Nearby Workers ({nearbyWorkers.length})
            </button>
            <button
              className={`feed-tab-btn ${homeFeedTab === 'rides' ? 'active' : ''}`}
              onClick={() => setHomeFeedTab('rides')}
            >
              <Car size={15} />
              Travel Rides ({allActiveRides.length})
            </button>
          </div>

          {/* TAB 1: WORK REQUIREMENTS */}
          {homeFeedTab === 'gigs' && (
            <div className="feed-tab-content">
              {activeGigs.length > 0 ? (
                <div className="feed-list stagger-children">
                  {activeGigs.map(gig => (
                    <GigCard key={gig.id} gig={gig} />
                  ))}
                </div>
              ) : (
                <div className="feed-empty glass-card">
                  <div className="feed-empty-icon">📭</div>
                  <h3>No active work posts in this area</h3>
                  <p>Be the first to post a requirement within {radius} km radius!</p>
                  <Link to="/post" className="btn btn-primary mt-4">
                    Post Work Requirement
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEARBY SKILLED WORKERS */}
          {homeFeedTab === 'workers' && (
            <div className="feed-tab-content">
              {nearbyWorkers.length > 0 ? (
                <div className="home-workers-grid stagger-children">
                  {nearbyWorkers.map(worker => (
                    <WorkerCard key={worker.id} worker={worker} />
                  ))}
                </div>
              ) : (
                <div className="feed-empty glass-card">
                  <div className="feed-empty-icon">👷</div>
                  <h3>No registered workers found within {radius} km</h3>
                  <p>Are you an Electrician, Mechanic, Plumber, or Driver? Register your profile today!</p>
                  <Link to="/register-worker" className="btn btn-primary mt-4">
                    Register as a Worker
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRAVEL RIDES */}
          {homeFeedTab === 'rides' && (
            <div className="feed-tab-content">
              {allActiveRides.length > 0 ? (
                <div className="feed-list stagger-children">
                  {allActiveRides.map(ride => (
                    <RideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              ) : (
                <div className="feed-empty glass-card">
                  <div className="feed-empty-icon">🚗</div>
                  <h3>No active travel rides nearby</h3>
                  <p>Share empty seats in your car or bike with others traveling your way!</p>
                  <Link to="/travel/offer" className="btn btn-primary mt-4">
                    Offer a Ride
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
