import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, Clock, MessageSquare, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/explore', icon: Compass, label: 'Explore' },
    { to: '/post', icon: PlusCircle, label: 'Post', isCenter: true },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/chats', icon: MessageSquare, label: 'Chats' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''} ${item.isCenter ? 'center-btn' : ''}`
            }
            end={item.to === '/'}
          >
            {item.isCenter ? (
              <div className="center-btn-icon">
                <item.icon size={24} />
              </div>
            ) : (
              <>
                <item.icon size={20} />
                <span className="nav-label">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
