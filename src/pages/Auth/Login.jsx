import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [authMode, setAuthMode] = useState('otp');
  const [step, setStep] = useState('request');
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(formatErr(err, 'Invalid email or password'));
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!email) { setError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return; }
    setLoading(true);
    try {
      await sendOtp(email);
      setMessage(`OTP sent to ${email}. Check your inbox!`);
      setStep('verify');
    } catch (err) {
      console.error('Send OTP Error:', err);
      setError(formatErr(err, 'Failed to send OTP. Check Supabase Auth settings.'));
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otpToken || otpToken.length < 6) { setError('Enter the 6-digit OTP code'); return; }
    setLoading(true);
    try {
      await verifyOtp(email, otpToken);
      navigate('/');
    } catch (err) {
      console.error('Verify OTP Error:', err);
      setError(formatErr(err, 'Invalid or expired OTP code'));
    } finally { setLoading(false); }
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

        {/* Mode Toggle */}
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

        {/* OTP Mode */}
        {authMode === 'otp' && (
          <>
            {step === 'request' ? (
              <form className="auth-form" onSubmit={handleSendOtp}>
                <div className="auth-form-header">
                  <h2 className="auth-title">Sign In with OTP</h2>
                  <p className="auth-desc">We'll send a 6-digit code to your email</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success">{message}</div>}

                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <div className="input-icon-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input type="email" className="input-field" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                  <KeyRound size={18} />
                  {loading ? 'Sending OTP...' : 'Get OTP Code'}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleVerifyOtp}>
                <div className="auth-form-header">
                  <h2 className="auth-title">Verify OTP</h2>
                  <p className="auth-desc">Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success">{message}</div>}

                <div className="input-group">
                  <label className="input-label">6-Digit Code</label>
                  <div className="input-icon-wrapper">
                    <KeyRound size={18} className="input-icon" />
                    <input type="text" className="input-field" placeholder="123456"
                      value={otpToken} onChange={e => setOtpToken(e.target.value)} maxLength={6}
                      style={{ letterSpacing: '0.3em', fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center' }}
                      autoComplete="one-time-code" required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                  <LogIn size={18} />
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep('request')}>
                  ← Change Email / Resend
                </button>
              </form>
            )}
          </>
        )}

        {/* Password Mode */}
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
                <input type="email" className="input-field" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} className="input-field" placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '2.75rem' }} autoComplete="current-password" required />
                <button type="button" className="input-toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
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
