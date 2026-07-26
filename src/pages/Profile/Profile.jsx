import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import {
  User, Phone, Mail, FileText, Star, LogOut, Check, ShieldCheck,
  Settings, ChevronRight, HelpCircle, Bell, Lock, CreditCard
} from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  if (!isAuthenticated) {
    return (
      <div className="page-content">
        <div className="profile-guest animate-fade-in text-center p-6">
          <div className="guest-icon-wrapper">
            <User size={48} className="text-tertiary" />
          </div>
          <h2>Welcome to wixwix</h2>
          <p className="text-secondary mt-2">Sign in to manage your profile, post gigs, and track your work history.</p>
          <div className="guest-actions mt-6">
            <a href="/login" className="btn btn-primary btn-lg">Sign In</a>
            <a href="/signup" className="btn btn-outline btn-lg">Create Account</a>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone, bio });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const accountMenuItems = [
    { icon: Bell, label: 'Notifications', desc: 'Manage your alerts' },
    { icon: Lock, label: 'Privacy & Security', desc: 'Password, 2FA settings' },
    { icon: CreditCard, label: 'Payment Methods', desc: 'Add or manage payments' },
    { icon: Settings, label: 'Account Settings', desc: 'Preferences & language' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQs and contact us' },
  ];

  return (
    <div className="page-content">
      <div className="profile-page">
        {/* Profile Card Header */}
        <section className="profile-card glass-card animate-fade-in-up">
          <div className="profile-avatar-wrapper">
            <div className="avatar avatar-xl">
              {getInitials(user.name)}
            </div>
            <div className="verified-badge">
              <ShieldCheck size={16} />
            </div>
          </div>

          <h2 className="profile-name">{user.name}</h2>
          <p className="profile-email">{user.email}</p>

          <div className="profile-rating">
            <Star size={16} className="star-icon" />
            <span>{user.rating || '4.8'} Rating</span>
          </div>

          <div className="profile-stats-row">
            <div className="p-stat">
              <span className="p-stat-num">{user.gigsPosted || 0}</span>
              <span className="p-stat-label">Posted</span>
            </div>
            <div className="p-stat-divider"></div>
            <div className="p-stat">
              <span className="p-stat-num">{user.gigsCompleted || 0}</span>
              <span className="p-stat-label">Completed</span>
            </div>
            <div className="p-stat-divider"></div>
            <div className="p-stat">
              <span className="p-stat-num">₹{user.totalEarned || 0}</span>
              <span className="p-stat-label">Earned</span>
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="profile-details glass-card animate-fade-in-up">
          <div className="section-title-bar">
            <h3>Personal Information</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="profile-form mt-4">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="input-label">Phone Number</label>
                <div className="input-icon-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    className="input-field"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="input-label">Short Bio</label>
                <textarea
                  className="input-field"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell people about yourself and your skills..."
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block mt-6">
                <Check size={18} /> Save Changes
              </button>
            </form>
          ) : (
            <div className="profile-info-list mt-4">
              <div className="info-item">
                <Mail size={16} className="text-tertiary" />
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-val">{user.email}</span>
                </div>
              </div>
              <div className="info-item">
                <Phone size={16} className="text-tertiary" />
                <div>
                  <span className="info-label">Phone</span>
                  <span className="info-val">{user.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="info-item">
                <FileText size={16} className="text-tertiary" />
                <div>
                  <span className="info-label">Bio</span>
                  <span className="info-val">{user.bio || 'No bio added yet.'}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Account Menu */}
        <section className="profile-menu glass-card animate-fade-in-up">
          <h3 className="profile-menu-title">Account</h3>
          <div className="account-menu-list">
            {accountMenuItems.map((item) => (
              <button key={item.label} className="account-menu-item">
                <div className="account-menu-icon">
                  <item.icon size={18} />
                </div>
                <div className="account-menu-info">
                  <span className="account-menu-label">{item.label}</span>
                  <span className="account-menu-desc">{item.desc}</span>
                </div>
                <ChevronRight size={16} className="account-menu-chevron" />
              </button>
            ))}
          </div>
        </section>

        {/* Logout */}
        <button className="btn btn-outline btn-block logout-btn animate-fade-in-up" onClick={handleLogout}>
          <LogOut size={18} />
          Log Out
        </button>

        <p className="profile-version">wixwix v1.0.0</p>
      </div>
    </div>
  );
};

export default Profile;
