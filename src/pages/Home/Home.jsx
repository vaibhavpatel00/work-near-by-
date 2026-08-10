import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Zap, Navigation, ChevronDown, Check } from 'lucide-react';
import { useGigs } from '../../context/GigContext';
import { useLocation } from '../../context/LocationContext';
import { CATEGORIES } from '../../data/categories';
import GigCard from '../../components/Cards/GigCard';
import './Home.css';

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [searchingArea, setSearchingArea] = useState(false);

  const { getNearbyGigs } = useGigs();
  const { location, radius, setRadius, requestLocation, locating } = useLocation();

  const nearbyGigs = useMemo(
    () => getNearbyGigs(selectedCategory, search),
    [getNearbyGigs, selectedCategory, search]
  );

  const activeGigs = nearbyGigs.filter(g => g.status === 'active');

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

  return (
    <div className="page-content">
      <div className="home-page">
        {/* Hero Section */}
        <section className="home-hero animate-fade-in">
          <div className="hero-content">
            <h1 className="hero-title">
              Find <span className="hero-highlight">Local Work</span> Near You
            </h1>
            <p className="hero-subtitle">
              Post requirements, find workers, make money — all on <strong>wikwik</strong>
            </p>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">{activeGigs.length}</span>
              <span className="hero-stat-label">Active Work</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{radius}km</span>
              <span className="hero-stat-label">Radius</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">{CATEGORIES.length}</span>
              <span className="hero-stat-label">Categories</span>
            </div>
          </div>
        </section>

        {/* Search & Location Bar */}
        <section className="home-search animate-fade-in-up">
          {/* Location Area Chip Above Search Bar */}
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
                  placeholder="Type specific area or city (e.g. Hitech City, Madhapur, Ameerpet, Bengaluru...)"
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

          {/* Work Search Input */}
          <div className="search-bar">
            <div className="input-icon-wrapper" style={{ flex: 1 }}>
              <Search size={18} className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Search for work, driver, chef, cleaner..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Radius Slider */}
          <div className="radius-control">
            <div className="radius-label">
              <MapPin size={14} />
              <span>Radius: <strong>{radius} km</strong></span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="radius-slider"
            />
          </div>
        </section>

        {/* Category Chips */}
        <section className="home-categories">
          <div className="category-chips">
            <button
              className={`category-chip ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <Zap size={14} />
              All
            </button>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`category-chip ${cat.cssClass} ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                >
                  <Icon size={14} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Work Feed */}
        <section className="home-feed">
          <div className="feed-header">
            <h2 className="feed-title">
              {selectedCategory
                ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory} Work`
                : 'Nearby Work'}
            </h2>
            <span className="feed-count">{activeGigs.length} found</span>
          </div>

          {activeGigs.length > 0 ? (
            <div className="feed-list stagger-children">
              {activeGigs.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            <div className="feed-empty">
              <div className="feed-empty-icon">📍</div>
              <h3>No active work in this area</h3>
              <p>Be the first to post work on <strong>wikwik</strong> or increase your search radius!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
