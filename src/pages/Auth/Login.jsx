import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [authMode, setAuthMode] = useState('otp'); // 'otp' or 'password'
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  // Password submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(formatErr(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email);
      setMessage(`OTP passcode sent to ${email}. Check your inbox!`);
      setStep('verify');
    } catch (err) {
      console.error('Login Send OTP Error:', err);
      setError(formatErr(err, 'Failed to send OTP code. Please check Supabase Auth settings.'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP Token
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
      console.error('Login Verify OTP Error:', err);
      setError(formatErr(err, 'Invalid or expired OTP code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">⚡</span>
            <h1 className="auth-logo-text">WorkNearby</h1>
          </div>
          <p className="auth-subtitle">Real-Time Local Work Marketplace</p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="auth-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.75rem' }}>
          <button
            type="button"
            className={`btn btn-block ${authMode === 'otp' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.875rem' }}
            onClick={() => { setAuthMode('otp'); setStep('request'); setError(''); setMessage(''); }}
          >
            <KeyRound size={16} /> Email OTP (Instant)
          </button>
          <button
            type="button"
            className={`btn btn-block ${authMode === 'password' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.875rem' }}
            onClick={() => { setAuthMode('password'); setError(''); setMessage(''); }}
          >
            <Lock size={16} /> Password
          </button>
        </div>

        {/* --- EMAIL OTP MODE --- */}
        {authMode === 'otp' && (
          <>
            {step === 'request' ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="auth-form-header">
                  <h2 className="auth-title">Real-Time OTP Sign In</h2>
                  <p className="auth-desc">We will send a 6-digit code to your email</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success" style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>{message}</div>}

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

                <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
                  <KeyRound size={18} />
                  {loading ? 'Sending OTP...' : 'Get 6-Digit OTP Code'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="auth-form-header">
                  <h2 className="auth-title">Verify OTP Code</h2>
                  <p className="auth-desc">Enter the 6-digit passcode sent to <strong>{email}</strong></p>
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
                  <LogIn size={18} />
                  {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-block mt-2"
                  onClick={() => setStep('request')}
                >
                  ← Change Email / Resend Code
                </button>
              </form>
            )}
          </>
        )}

        {/* --- PASSWORD MODE --- */}
        {authMode === 'password' && (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <div className="auth-form-header">
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-desc">Sign in with your email and password</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

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
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '2.75rem' }}
                  autoComplete="current-password"
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

            <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
              <LogIn size={18} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
