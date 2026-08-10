import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, TrendingUp, Users, Wrench, Zap, Plus, 
  MapPin, SlidersHorizontal, ArrowRight, ShieldCheck, Sparkles, Filter, Lightbulb, X
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
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchBoxRef = useRef(null);

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

  // Search filtered categories for category tab
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    return CATEGORIES.filter(c => 
      fuzzyMatchText(search, c.name) ||
      fuzzyMatchText(search, c.id)
    );
  }, [search]);

  // Nearby workers list
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

  const handleSelectCategorySuggestion = (cat) => {
    setSelectedProfession(cat.id);
    setSearch('');
    setShowSearchDropdown(false);
    setActiveTab('workers');
  };

  const handleSelectWorkerSuggestion = (worker) => {
    setShowSearchDropdown(false);
    navigate(`/worker/${worker.id}`);
  };

  const handleApplyDidYouMean = (cat) => {
    setSelectedProfession(cat.id);
    setSearch(cat.name);
    setShowSearchDropdown(false);
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

        {/* Smart Search Bar Container */}
        <div className="explore-search animate-fade-in-up" ref={searchBoxRef}>
          <div className="search-bar-container">
            <div className="input-icon-wrapper">
              <Search size={18} className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder={activeTab === 'workers' 
                  ? "Search by worker name, shop name, or skill (e.g. Electrician, Siri Chandana, Madhapur...)"
                  : "Search work categories..."
                }
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
                          <span className="sugg-sub">Auto-filter workers</span>
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
                    <p className="text-xs text-tertiary">Searching all workers with fuzzy matching...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spell Correction / Did You Mean Banner */}
          {searchSuggestions.didYouMean && search.trim() && (
            <div className="did-you-mean-banner animate-fade-in mt-2">
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
                {CATEGORIES.slice(0, 10).map(cat => (
                  <button
                    key={cat.id}
                    className={`prof-pill ${selectedProfession === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedProfession(cat.id)}
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
                  <h3>No workers registered in this category within {radiusFilter} km</h3>
                  <p>Be the first professional to list your services in this area!</p>
                  <div className="empty-actions-row mt-4">
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
