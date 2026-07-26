import { useState, useMemo } from 'react';
import { Search, MapPin, Zap } from 'lucide-react';
import { useGigs } from '../../context/GigContext';
import { useLocation } from '../../context/LocationContext';
import { CATEGORIES } from '../../data/categories';
import GigCard from '../../components/Cards/GigCard';
import './Home.css';

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { getNearbyGigs } = useGigs();
  const { location, radius, setRadius } = useLocation();

  const nearbyGigs = useMemo(
    () => getNearbyGigs(selectedCategory, search),
    [getNearbyGigs, selectedCategory, search]
  );

  const activeGigs = nearbyGigs.filter(g => g.status === 'active');

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
              Post requirements, find workers, make money — all within your neighborhood
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

        {/* Search Bar */}
        <section className="home-search animate-fade-in-up">
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
              max="50"
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
              <div className="feed-empty-icon">🔍</div>
              <h3>No work found nearby</h3>
              <p>Try increasing your radius or changing the category filter</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
