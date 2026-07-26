import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const [authMode, setAuthMode] = useState('otp'); // 'otp' or 'password'
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  // Password Registration
  const handlePasswordSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
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

    setLoading(true);
    try {
      await signup(name, email, phone, password);
      navigate('/');
    } catch (err) {
      setError(formatErr(err, 'Failed to create account. Check Supabase credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name || !email) {
      setError('Please enter your full name and email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email, { name, phone });
      setMessage(`OTP passcode sent to ${email}. Check your email inbox!`);
      setStep('verify');
    } catch (err) {
      console.error('OTP Send error:', err);
      setError(formatErr(err, 'Failed to send OTP. Please ensure Email provider and OTP are enabled in Supabase Auth settings.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpToken || otpToken.length < 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otpToken);
      navigate('/');
    } catch (err) {
      console.error('OTP Verify error:', err);
      setError(formatErr(err, 'Invalid or expired OTP code. Please try again.'));
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
          <p className="auth-subtitle">Hyperlocal Work Marketplace</p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'otp' ? 'active' : ''}`}
            onClick={() => { setAuthMode('otp'); setStep('request'); setError(''); setMessage(''); }}
          >
            <KeyRound size={15} /> Email OTP
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'password' ? 'active' : ''}`}
            onClick={() => { setAuthMode('password'); setError(''); setMessage(''); }}
          >
            <Lock size={15} /> Password
          </button>
        </div>

        {/* --- EMAIL OTP REGISTRATION --- */}
        {authMode === 'otp' && (
          <>
            {step === 'request' ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="auth-form-header">
                  <h2 className="auth-title">Create Account via OTP</h2>
                  <p className="auth-desc">No password needed. We'll send a 6-digit code to your email</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success" style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</div>}

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

                <div className="input-group">
                  <label className="input-label">Phone Number (Optional)</label>
                  <div className="input-icon-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
                  <KeyRound size={18} />
                  {loading ? 'Sending OTP...' : 'Send Registration OTP'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="auth-form-header">
                  <h2 className="auth-title">Verify Registration</h2>
                  <p className="auth-desc">Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success" style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</div>}

                <div className="input-group">
                  <label className="input-label">6-Digit Code</label>
                  <div className="input-icon-wrapper">
                    <KeyRound size={18} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="123456"
                      value={otpToken}
                      onChange={e => setOtpToken(e.target.value)}
                      maxLength={6}
                      style={{ letterSpacing: '0.25em', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
                  <ArrowRight size={18} />
                  {loading ? 'Verifying Account...' : 'Complete Registration'}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-block mt-2"
                  onClick={() => setStep('request')}
                >
                  ← Back to Details
                </button>
              </form>
            )}
          </>
        )}

        {/* --- PASSWORD REGISTRATION --- */}
        {authMode === 'password' && (
          <form className="auth-form" onSubmit={handlePasswordSignup}>
            <div className="auth-form-header">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-desc">Join the community and start posting/finding local work</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

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

            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Min. 6 characters"
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

            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
