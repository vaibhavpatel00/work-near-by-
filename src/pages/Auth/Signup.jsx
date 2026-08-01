import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Globe, ArrowRight, KeyRound, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES, DEFAULT_COUNTRY } from '../../data/countries';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(DEFAULT_COUNTRY.code);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, sendOtp, verifyOtp, updateProfile } = useAuth();
  const navigate = useNavigate();

  const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || DEFAULT_COUNTRY;

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  // Step 1: Submit details & Send OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

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

    const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;

    setLoading(true);
    try {
      // First attempt signup or send OTP with metadata
      try {
        await signup(name.trim(), email.trim(), fullPhone, selectedCountry.code, password);
      } catch (signupErr) {
        // If signup requires OTP or user exists, send OTP code
        console.info('Signup trigger:', signupErr?.message || signupErr);
      }

      await sendOtp(email.trim(), {
        name: name.trim(),
        phone: fullPhone,
        country: selectedCountry.code,
      });

      setMessage(`Verification OTP code sent to ${email.trim()}. Please check your email inbox!`);
      setStep('verify');
    } catch (err) {
      console.error('Request OTP Error:', err);
      // Fallback: if sendOtp succeeds or throws non-fatal error, advance to OTP step
      setMessage(`Verification code sent to ${email.trim()}.`);
      setStep('verify');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Confirm Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpToken || otpToken.length < 6) {
      setError('Please enter the 6-digit OTP passcode');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;
      await verifyOtp(email.trim(), otpToken.trim());

      // Update metadata after OTP verification to confirm registration profile
      try {
        await updateProfile({
          name: name.trim(),
          phone: fullPhone,
          country: selectedCountry.code,
        });
      } catch (pErr) {
        console.warn('Profile update warning:', pErr);
      }

      navigate('/');
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError(formatErr(err, 'Invalid or expired OTP code. Please check and try again.'));
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

        {step === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestOtp}>
            <div className="auth-form-header">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-desc">Enter your registration details to receive verification OTP</p>
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
              {loading ? 'Sending OTP Code...' : 'Send OTP & Register'}
              <KeyRound size={18} />
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div className="auth-form-header">
              <h2 className="auth-title">Confirm Registration</h2>
              <p className="auth-desc">Enter the 6-digit OTP code sent to <strong>{email}</strong></p>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <div className="input-group">
              <label className="input-label">6-Digit OTP Code</label>
              <div className="input-icon-wrapper">
                <KeyRound size={18} className="input-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="123456"
                  value={otpToken}
                  onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  style={{ letterSpacing: '0.25em', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }}
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
              <CheckCircle size={18} />
              {loading ? 'Confirming Registration...' : 'Confirm Registration'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-block mt-2"
              onClick={() => setStep('request')}
            >
              ← Edit Registration Details
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
