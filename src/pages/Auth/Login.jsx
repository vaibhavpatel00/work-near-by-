import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, Lock, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(formatErr(err, 'Invalid email/mobile number or password'));
    } finally {
      setLoading(false);
    }
  };

  const isEmailInput = identifier.includes('@');

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

        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <div className="auth-form-header">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-desc">Sign in with your email or mobile number</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <label className="input-label">Email Address or Mobile Number</label>
            <div className="input-icon-wrapper">
              {isEmailInput ? (
                <Mail size={18} className="input-icon" />
              ) : (
                <Phone size={18} className="input-icon" />
              )}
              <input
                type="text"
                className="input-field"
                placeholder="you@example.com or +1 555-123-4567"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="username"
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

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
