import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES, DEFAULT_COUNTRY } from '../../data/countries';
import './Auth.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(DEFAULT_COUNTRY.code);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || DEFAULT_COUNTRY;

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setError('Please enter a valid mobile number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Combine dial code with phone number (e.g. +1 5551234567)
    const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;

    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), fullPhone, selectedCountry.code, password);
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setError(formatErr(err, 'Failed to create account. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/wikwik-logo.png" alt="wikwik" className="auth-logo-img" />
            <h1 className="auth-logo-text">wikwik</h1>
          </div>
          <p className="auth-subtitle">Global Hyperlocal Work Marketplace</p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <div className="auth-form-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-desc">Register to post & find work anywhere in the world</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* Full Name */}
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Country Selection */}
          <div className="input-group">
            <label className="input-label">Country</label>
            <div className="input-icon-wrapper">
              <Globe size={18} className="input-icon" />
              <select
                className="input-field select-field"
                value={selectedCountryCode}
                onChange={e => setSelectedCountryCode(e.target.value)}
                required
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Phone Number */}
          <div className="input-group">
            <label className="input-label">Mobile Number</label>
            <div className="input-icon-wrapper phone-input-wrapper">
              <Phone size={18} className="input-icon" />
              <div className="country-dial-badge">
                <span>{selectedCountry.flag}</span>
                <span className="dial-code">{selectedCountry.dialCode}</span>
              </div>
              <input
                type="tel"
                className="input-field phone-input-field"
                placeholder="98765 43210"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ''))}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: '2.75rem' }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-toggle-pass"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showConfirmPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ paddingRight: '2.75rem' }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-toggle-pass"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register & Create Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
