import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, TrendingUp, ArrowLeft, Plus, MapPin, Clock, 
  Users, Check, Send, Loader2, Sparkles, Filter, SlidersHorizontal,
  Car, Bike, ShieldCheck, CheckCircle
} from 'lucide-react';
import { CATEGORIES, getCategoryById } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import { useRides } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { formatDistance, timeAgo, formatDate, formatAmount, truncateText, getInitials, calculateDistance } from '../../utils/helpers';
import RideCard from '../../components/Cards/RideCard';
import './Explore.css';

const Explore = () => {
  const navigate = useNavigate();
  const { gigs, applyForGig, showToast } = useGigs();
  const { rides } = useRides();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [radiusFilter, setRadiusFilter] = useState(50); // Default 50 km
  const [driverTab, setDriverTab] = useState('jobs'); // 'jobs' | 'rides' (Only for driver category)
  
  // Quick Apply Modal State
  const [applyingGig, setApplyingGig] = useState(null);
  const [applyNote, setApplyNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    return CATEGORIES.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Compute category active gigs within radius
  const categoryGigs = useMemo(() => {
    if (!selectedCategory) return [];

    return gigs
      .filter(g => {
        if (g.status !== 'active') return false;
        if (g.category !== selectedCategory) return false;

        // Radius filter
        if (g.location && typeof g.location.lat === 'number' && typeof g.location.lng === 'number') {
          const dist = calculateDistance(location.lat, location.lng, g.location.lat, g.location.lng);
          if (radiusFilter < 200 && dist > radiusFilter) return false;
        }
        return true;
      })
      .map(gig => ({
        ...gig,
        distance: (gig.location && typeof gig.location.lat === 'number')
          ? calculateDistance(location.lat, location.lng, gig.location.lat, gig.location.lng)
          : 0,
      }))
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  }, [gigs, selectedCategory, location, radiusFilter]);

  // Nearby travel rides for Driver category
  const driverTravelRides = useMemo(() => {
    if (selectedCategory !== 'driver') return [];
    return rides
      .filter(r => r.status === 'active')
      .map(r => ({
        ...r,
        distanceToOrigin: (r.origin && typeof r.origin.lat === 'number')
          ? calculateDistance(location.lat, location.lng, r.origin.lat, r.origin.lng)
          : 0,
      }))
      .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  }, [rides, selectedCategory, location]);

  const activeCategoryObj = selectedCategory ? getCategoryById(selectedCategory) : null;
  const ActiveIcon = activeCategoryObj?.icon;

  // Handle in-page Apply
  const handleOpenApplyModal = (gig, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Please login to apply for this work requirement', 'info');
      navigate('/login');
      return;
    }
    setApplyingGig(gig);
    setApplyNote('');
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!applyingGig || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const ok = await applyForGig(applyingGig.id, applyNote);
      if (ok) {
        setApplyingGig(null);
        setApplyNote('');
      }
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="explore-page">
        {/* If NO category selected: Show Explore Hub */}
        {!selectedCategory ? (
          <>
            <header className="explore-header animate-fade-in">
              <div className="explore-title-row">
                <div>
                  <h1>Explore Work & Services</h1>
                  <p className="text-secondary">Discover nearby work requirements and apply directly</p>
                </div>
                <Link to="/post" className="btn btn-primary btn-sm">
                  <Plus size={16} /> Post Work
                </Link>
              </div>
            </header>

            {/* Search Categories */}
            <div className="explore-search animate-fade-in-up">
              <div className="input-icon-wrapper">
                <Search size={18} className="input-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search categories (Driver, Cook, Electrician, Plumber...)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Popular Section */}
            <section className="explore-section animate-fade-in-up">
              <div className="section-header">
                <TrendingUp size={18} className="text-accent" />
                <h3>All Work Categories ({filteredCategories.length})</h3>
              </div>
            </section>

            {/* Category Grid */}
            <div className="category-grid stagger-children">
              {filteredCategories.map(cat => {
                const Icon = cat.icon;
                const activeCount = gigs.filter(g => g.category === cat.id && g.status === 'active').length;
                const isDriverCat = cat.id === 'driver';
                const totalCount = isDriverCat ? (activeCount + rides.filter(r => r.status === 'active').length) : activeCount;

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
                    <span className="category-card-count">
                      {totalCount} {totalCount === 1 ? 'post' : 'posts'} nearby
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* When a Category IS Selected: Show Dedicated In-Page Feed with Apply */
          <div className="category-detail-feed animate-fade-in-up">
            {/* Category Banner Header */}
            <div className="category-view-banner glass-card">
              <div className="cat-banner-top">
                <button
                  className="btn btn-ghost btn-sm back-to-cats-btn"
                  onClick={() => setSelectedCategory(null)}
                >
                  <ArrowLeft size={16} /> All Categories
                </button>
                <Link to={`/post`} className="btn btn-outline btn-sm">
                  <Plus size={14} /> Post {activeCategoryObj?.name} Need
                </Link>
              </div>

              <div className="cat-banner-content mt-3">
                <div className="cat-large-icon">
                  {ActiveIcon && <ActiveIcon size={32} />}
                </div>
                <div>
                  <h2>{activeCategoryObj?.name} Opportunities & Work</h2>
                  <p className="text-secondary text-sm">
                    Showing available {activeCategoryObj?.name} work near <strong>{location.address || 'your location'}</strong>
                  </p>
                </div>
              </div>

              {/* Filter Controls Bar */}
              <div className="cat-filters-bar mt-4">
                <div className="radius-filter-pill">
                  <SlidersHorizontal size={14} />
                  <span>Radius:</span>
                  <select
                    className="radius-select"
                    value={radiusFilter}
                    onChange={e => setRadiusFilter(Number(e.target.value))}
                  >
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km (Recommended)</option>
                    <option value={100}>100 km</option>
                    <option value={999}>All Distances</option>
                  </select>
                </div>

                <span className="feed-count-badge">
                  {selectedCategory === 'driver' && driverTab === 'rides' 
                    ? `${driverTravelRides.length} rides available`
                    : `${categoryGigs.length} work posts available`
                  }
                </span>
              </div>

              {/* Driver Special Sub-tabs */}
              {selectedCategory === 'driver' && (
                <div className="driver-subtabs mt-3">
                  <button
                    className={`driver-tab-btn ${driverTab === 'jobs' ? 'active' : ''}`}
                    onClick={() => setDriverTab('jobs')}
                  >
                    🚗 Driver Job Posts ({categoryGigs.length})
                  </button>
                  <button
                    className={`driver-tab-btn ${driverTab === 'rides' ? 'active' : ''}`}
                    onClick={() => setDriverTab('rides')}
                  >
                    🏍️ Travel Rides & Carpool ({driverTravelRides.length})
                  </button>
                </div>
              )}
            </div>

            {/* If Driver Category and on 'Rides' tab: Show Travel Rides */}
            {selectedCategory === 'driver' && driverTab === 'rides' ? (
              <div className="category-rides-list mt-4">
                {driverTravelRides.length > 0 ? (
                  <div className="feed-list stagger-children">
                    {driverTravelRides.map(ride => (
                      <RideCard key={ride.id} ride={ride} />
                    ))}
                  </div>
                ) : (
                  <div className="feed-empty glass-card">
                    <div className="feed-empty-icon">🚗</div>
                    <h3>No travel rides nearby</h3>
                    <p>Be the first to offer a car or bike ride for this route!</p>
                    <Link to="/travel/offer" className="btn btn-primary mt-4">
                      Offer a Ride
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* Work Requirements Feed with Direct In-Page Apply Button */
              <div className="category-gigs-list mt-4">
                {categoryGigs.length > 0 ? (
                  <div className="explore-gigs-grid stagger-children">
                    {categoryGigs.map(gig => {
                      const isOwner = user && String(user.id) === String(gig.postedBy);
                      const myRequest = (gig.requests || []).find(r => user && String(r.workerId) === String(user.id));
                      const appCount = (gig.requests || []).length;
                      const maxApps = gig.maxApplications || 5;

                      return (
                        <div key={gig.id} className="explore-gig-card glass-card">
                          <div className="explore-card-top">
                            <div className="card-cat-badge">
                              {ActiveIcon && <ActiveIcon size={14} />}
                              <span>{activeCategoryObj?.name}</span>
                            </div>
                            <span className="card-time-ago">{timeAgo(gig.postedAt)}</span>
                          </div>

                          <Link to={`/gig/${gig.id}`} className="explore-card-title-link">
                            <h3 className="explore-card-title">{gig.title}</h3>
                          </Link>
                          <p className="explore-card-desc">{truncateText(gig.description, 110)}</p>

                          <div className="explore-card-meta">
                            <div className="explore-card-amount">
                              {formatAmount(gig.amount, gig.currency || gig.currencySymbol || '₹')}
                            </div>
                            <div className="explore-meta-items">
                              <span className="meta-item">
                                <Clock size={12} /> {formatDate(gig.date)}
                              </span>
                              <span className="meta-item distance-item">
                                <MapPin size={12} /> {formatDistance(gig.distance)} away
                              </span>
                            </div>
                          </div>

                          {/* Quick Card Footer with Direct Apply Action */}
                          <div className="explore-card-footer">
                            <div className="card-poster-info">
                              <div className="avatar avatar-sm">
                                {getInitials(gig.contactDetails?.name || 'Client')}
                              </div>
                              <span className="poster-label text-xs">
                                {gig.location?.address?.split(',')[0] || 'Nearby'}
                              </span>
                            </div>

                            <div className="card-actions-area">
                              {isOwner ? (
                                <span className="badge badge-primary">👑 Your Post</span>
                              ) : myRequest ? (
                                <span className={`badge ${myRequest.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                                  {myRequest.status === 'approved' ? '🎉 Approved' : '⏳ Applied (Pending)'}
                                </span>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm quick-apply-btn"
                                  onClick={(e) => handleOpenApplyModal(gig, e)}
                                >
                                  <Sparkles size={14} /> Apply Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="feed-empty glass-card">
                    <div className="feed-empty-icon">💼</div>
                    <h3>No {activeCategoryObj?.name} work posts within {radiusFilter} km</h3>
                    <p>Try increasing your search radius or post a requirement for workers nearby!</p>
                    <div className="empty-actions-row mt-4">
                      {radiusFilter < 999 && (
                        <button className="btn btn-outline" onClick={() => setRadiusFilter(999)}>
                          Show All Distances
                        </button>
                      )}
                      <Link to="/post" className="btn btn-primary">
                        Post {activeCategoryObj?.name} Need
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Direct In-Page Quick Apply Modal */}
        {applyingGig && (
          <div className="apply-modal-overlay animate-fade-in">
            <div className="apply-modal glass-card animate-fade-in-up">
              <div className="apply-modal-header">
                <div>
                  <span className="text-xs text-accent uppercase font-bold">Apply for Work</span>
                  <h3>{applyingGig.title}</h3>
                </div>
                <div className="modal-pay-badge">
                  {formatAmount(applyingGig.amount, applyingGig.currency || applyingGig.currencySymbol || '₹')}
                </div>
              </div>

              <p className="text-xs text-secondary mt-1">
                📍 Location: {applyingGig.location?.address || 'Nearby'} • 📅 Date: {formatDate(applyingGig.date)}
              </p>

              <form onSubmit={handleSubmitApplication} className="mt-4">
                <label className="input-label">Message to Client / Publisher</label>
                <textarea
                  className="input-field"
                  placeholder="Introduce yourself, mention your experience, availability, or any vehicle/tools you have..."
                  value={applyNote}
                  onChange={e => setApplyNote(e.target.value)}
                  rows={4}
                  autoFocus
                  required
                />

                <div className="modal-actions mt-4">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setApplyingGig(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="spin" /> Sending Application...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
