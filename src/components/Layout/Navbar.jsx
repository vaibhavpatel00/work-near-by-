import { MapPin, Bell, Navigation } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { location, locating, requestLocation } = useLocation();
  const { user, isAuthenticated } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">wikwik</span>
        </Link>

        <button className="navbar-location" onClick={requestLocation} disabled={locating}>
          <Navigation size={14} className={`location-icon ${locating ? 'locating' : ''}`} />
          <span className="location-text">
            {locating ? 'Locating...' : (location.address || 'Set Location')}
          </span>
          <MapPin size={12} className="location-pin" />
        </button>

        <div className="navbar-actions">
          <button className="navbar-icon-btn" aria-label="Notifications">
            <Bell size={18} />
            <span className="notification-dot"></span>
          </button>

          {isAuthenticated ? (
            <Link to="/profile" className="navbar-avatar">
              <div className="avatar avatar-sm">
                {getInitials(user.name)}
              </div>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
