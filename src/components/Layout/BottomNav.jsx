import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Compass, Plus, Clock, MessageSquare, User, Navigation, 
  X, Briefcase, Car, Wrench, ArrowRight, Sparkles 
} from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPublishModal, setShowPublishModal] = useState(false);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/explore', icon: Compass, label: 'Explore' },
    { to: '/travel', icon: Navigation, label: 'Travel' },
    { type: 'publish_trigger', icon: Plus, label: 'Publish', isCenter: true },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/chats', icon: MessageSquare, label: 'Chats' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const handleSelectPublishOption = (path) => {
    setShowPublishModal(false);
    navigate(path);
  };

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {navItems.map((item, idx) => {
            if (item.isCenter) {
              return (
                <button
                  key="center-publish-btn"
                  type="button"
                  className={`bottom-nav-item center-btn ${showPublishModal ? 'active-open' : ''}`}
                  onClick={() => setShowPublishModal(true)}
                  aria-label="Publish New"
                  title="Publish Requirement or Services"
                >
                  <div className="center-btn-icon">
                    <Plus size={26} className={showPublishModal ? 'rotate-plus' : ''} />
                  </div>
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `bottom-nav-item ${isActive ? 'active' : ''}`
                }
                end={item.to === '/'}
                title={item.label}
              >
                <item.icon size={20} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ========================================================
          PUBLISH INTENT SELECTION MODAL ("What are you publishing?")
          ======================================================== */}
      {showPublishModal && (
        <div className="publish-modal-overlay animate-fade-in" onClick={() => setShowPublishModal(false)}>
          <div 
            className="publish-modal-card glass-card animate-fade-in-up" 
            onClick={e => e.stopPropagation()}
          >
            <div className="publish-modal-header">
              <div>
                <span className="text-xs text-accent uppercase font-bold">Publish on Wikwik</span>
                <h2>What would you like to publish?</h2>
              </div>
              <button 
                type="button" 
                className="publish-close-btn" 
                onClick={() => setShowPublishModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="publish-modal-subtitle">
              Choose the service you want to list so we can connect you with people nearby.
            </p>

            <div className="publish-options-list mt-4">
              {/* Option 1: Hire a Worker / Post Need */}
              <button 
                type="button"
                className="publish-option-item hire-option"
                onClick={() => handleSelectPublishOption('/post')}
              >
                <div className="pub-option-icon-box hire-bg">
                  <Briefcase size={24} />
                </div>
                <div className="pub-option-info">
                  <div className="pub-title-row">
                    <strong>1. Need to Hire a Worker (Post Job)</strong>
                    <span className="badge badge-success">Hire Helpers</span>
                  </div>
                  <p>Need a driver, cook, cleaner, electrician, or custom help? Post your job and receive worker applications.</p>
                </div>
                <ArrowRight size={18} className="pub-arrow" />
              </button>

              {/* Option 2: Offer a Travel Ride */}
              <button 
                type="button"
                className="publish-option-item travel-option"
                onClick={() => handleSelectPublishOption('/travel/offer')}
              >
                <div className="pub-option-icon-box travel-bg">
                  <Car size={24} />
                </div>
                <div className="pub-option-info">
                  <div className="pub-title-row">
                    <strong>2. Offer a Travel Ride (Car / Bike)</strong>
                    <span className="badge badge-warning">Carpool / Bike</span>
                  </div>
                  <p>Driving to another city or area? Share empty seats in your car or bike and split fuel costs.</p>
                </div>
                <ArrowRight size={18} className="pub-arrow" />
              </button>

              {/* Option 3: List Services as Worker */}
              <button 
                type="button"
                className="publish-option-item worker-option"
                onClick={() => handleSelectPublishOption('/register-worker')}
              >
                <div className="pub-option-icon-box worker-bg">
                  <Wrench size={24} />
                </div>
                <div className="pub-option-info">
                  <div className="pub-title-row">
                    <strong>3. List My Services as a Worker</strong>
                    <span className="badge badge-primary">Get Direct Calls</span>
                  </div>
                  <p>Are you an Electrician, Bike Mechanic, Plumber, Driver, or Technician? List your profile, rates, and working hours.</p>
                </div>
                <ArrowRight size={18} className="pub-arrow" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
