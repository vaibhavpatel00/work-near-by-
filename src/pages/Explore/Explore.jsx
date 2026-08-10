import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, TrendingUp, Users, Wrench, Zap, Plus, 
  MapPin, SlidersHorizontal, ArrowRight, ShieldCheck, Sparkles, Filter, X, Lightbulb
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import { useWorkers } from '../../context/WorkerContext';
import { useLocation } from '../../context/LocationContext';
import { fuzzyMatchText, CATEGORY_KEYWORDS } from '../../utils/helpers';
import GigCard from '../../components/Cards/GigCard';
import WorkerCard from '../../components/Cards/WorkerCard';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();
  const { getNearbyGigs } = useGigs();
  const { getNearbyWorkers, myWorkerProfile } = useWorkers();
  const { location } = useLocation();

  const [activeTab, setActiveTab] = useState('workers'); // 'workers' | 'categories'
  const [search, setSearch] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [radiusFilter, setRadiusFilter] = useState(100); // 100 km radius default
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Check if search matches any specific category fuzzily / by synonyms
  const matchedCategory = useMemo(() => {
    if (!search.trim() || search.trim().length < 2) return null;
    const q = search.trim().toLowerCase();
    
    return CATEGORIES.find(cat => {
      if (fuzzyMatchText(q, cat.name) || fuzzyMatchText(q, cat.id)) return true;
      const keywords = CATEGORY_KEYWORDS[cat.id] || [];
      return keywords.some(k => fuzzyMatchText(q, k));
    }) || null;
  }, [search]);

  // Search filtered categories for category tab
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    return CATEGORIES.filter(c => 
      fuzzyMatchText(search, c.name) ||
      fuzzyMatchText(search, c.id)
    );
  }, [search]);

  // Nearby workers list (searches by worker name, shop name, profession, description, area)
  const nearbyWorkers = useMemo(() => {
    return getNearbyWorkers({
      profession: selectedProfession,
      searchQuery: search,
      radiusKm: radiusFilter,
    });
  }, [getNearbyWorkers, selectedProfession, search, radiusFilter]);

  // Category specific gigs
  const categoryGigs = selectedCategory
    ? getNearbyGigs(selectedCategory).filter(g => g.status === 'active')
    : [];

  const handleSelectSuggestedCategory = (cat) => {
    setSelectedProfession(cat.id);
    setSearch('');
  };

  return (
    <div className="page-content">
      <div className="explore-page">
        {/* Header */}
        <header className="explore-header animate-fade-in">
          <div className="explore-header-row">
            <div>
              <h1>Explore & Connect</h1>
              <p className="text-secondary">Find skilled workers & browse work opportunities nearby</p>
            </div>
            <Link to="/register-worker" className="btn btn-primary btn-sm register-worker-btn">
              <Wrench size={15} /> {myWorkerProfile ? 'My Worker Profile' : 'Join as Worker'}
            </Link>
          </div>
        </header>

        {/* Top Dual Tabs: Find Workers vs Browse Work */}
        <div className="explore-main-tabs animate-fade-in-up">
          <button
            className={`explore-tab-btn ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('workers'); setSelectedCategory(null); }}
          >
            <Users size={16} />
            Find Workers Nearby ({nearbyWorkers.length})
          </button>
          <button
            className={`explore-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <TrendingUp size={16} />
            Browse Work Categories
          </button>
        </div>

        {/* Clean, Fast Search Bar */}
        <div className="explore-search animate-fade-in-up">
          <div className="input-icon-wrapper">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="input-field search-input"
              placeholder={activeTab === 'workers' 
                ? "Search by worker name, shop name, or skill (e.g. Electrician, Siri Chandana, Madhapur...)"
                : "Search work categories..."
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Category Auto-Match Chip (Shows cleanly under search if category is detected) */}
          {matchedCategory && selectedProfession !== matchedCategory.id && (
            <div className="search-match-chip-row animate-fade-in">
              <span className="text-xs text-secondary">Matching Category:</span>
              <button
                type="button"
                className="search-match-pill"
                onClick={() => handleSelectSuggestedCategory(matchedCategory)}
              >
                {matchedCategory.emoji} Filter by {matchedCategory.name} →
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: FIND WORKERS NEARBY */}
        {activeTab === 'workers' && (
          <section className="explore-workers-view animate-fade-in-up">
            {/* Filter Pills Bar */}
            <div className="workers-filter-bar">
              <div className="profession-pills-scroll">
                <button
                  className={`prof-pill ${selectedProfession === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedProfession('all')}
                >
                  All Skills ({nearbyWorkers.length})
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`prof-pill ${selectedProfession === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedProfession(selectedProfession === cat.id ? 'all' : cat.id)}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>

              {/* Radius Filter */}
              <div className="radius-pill-box">
                <SlidersHorizontal size={13} />
                <span>Radius:</span>
                <select
                  className="radius-select"
                  value={radiusFilter}
                  onChange={e => setRadiusFilter(Number(e.target.value))}
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km (Default)</option>
                  <option value={999}>All Distances</option>
                </select>
              </div>
            </div>

            {/* Worker Callout Promo */}
            {!myWorkerProfile && (
              <div className="worker-join-banner glass-card mt-3">
                <div className="banner-icon-circle">
                  <Zap size={22} />
                </div>
                <div className="banner-text">
                  <strong>Are you an Electrician, Mechanic, Plumber, or Driver?</strong>
                  <p className="text-xs text-secondary">
                    List your contact number, working hours, and living area to get direct work requests from people nearby.
                  </p>
                </div>
                <Link to="/register-worker" className="btn btn-accent btn-sm">
                  List Your Service
                </Link>
              </div>
            )}

            {/* Workers Grid */}
            <div className="workers-feed-section mt-4">
              <div className="feed-header mb-3">
                <h3>
                  {selectedProfession === 'all' ? 'All Verified Workers' : `${CATEGORIES.find(c => c.id === selectedProfession)?.name || selectedProfession}s`}
                </h3>
                <span className="text-xs text-tertiary">
                  Within {radiusFilter} km of {location.address || 'your location'}
                </span>
              </div>

              {nearbyWorkers.length > 0 ? (
                <div className="workers-cards-grid stagger-children">
                  {nearbyWorkers.map(worker => (
                    <WorkerCard key={worker.id} worker={worker} />
                  ))}
                </div>
              ) : (
                <div className="feed-empty glass-card">
                  <div className="feed-empty-icon">👷</div>
                  <h3>No workers found matching "{search || selectedProfession}" within {radiusFilter} km</h3>
                  <p>Try searching for a different skill, area, or expand your search radius.</p>
                  <div className="empty-actions-row mt-4">
                    {search && (
                      <button className="btn btn-outline" onClick={() => setSearch('')}>
                        Clear Search
                      </button>
                    )}
                    {radiusFilter < 999 && (
                      <button className="btn btn-outline" onClick={() => setRadiusFilter(999)}>
                        Expand Radius to All
                      </button>
                    )}
                    <Link to="/register-worker" className="btn btn-primary">
                      Register as a Worker
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: BROWSE WORK CATEGORIES */}
        {activeTab === 'categories' && (
          <>
            {selectedCategory ? (
              <div className="explore-category-view animate-fade-in-up">
                <div className="explore-category-header">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    ← All Categories
                  </button>
                  <h2>{CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory} Work</h2>
                  <span className="feed-count">{categoryGigs.length} available</span>
                </div>

                {categoryGigs.length > 0 ? (
                  <div className="feed-list stagger-children">
                    {categoryGigs.map(gig => (
                      <GigCard key={gig.id} gig={gig} />
                    ))}
                  </div>
                ) : (
                  <div className="feed-empty glass-card">
                    <div className="feed-empty-icon">📭</div>
                    <h3>No open work in this category</h3>
                    <p>Be the first person to post a requirement!</p>
                    <Link to="/post" className="btn btn-primary mt-4">Post Work</Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <section className="explore-section animate-fade-in-up">
                  <div className="section-header">
                    <TrendingUp size={18} className="text-accent" />
                    <h3>Popular Work Categories</h3>
                  </div>
                </section>

                <div className="category-grid stagger-children">
                  {filteredCategories.map(cat => {
                    const Icon = cat.icon;
                    const workCount = getNearbyGigs(cat.id).filter(g => g.status === 'active').length;
                    return (
                      <button
                        key={cat.id}
                        className={`category-card glass-card ${cat.cssClass}`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <div className="category-card-icon">
                          <Icon size={28} />
                        </div>
                        <span className="category-card-name">{cat.name}</span>
                        <span className="category-card-count">{workCount} post{workCount !== 1 ? 's' : ''}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
