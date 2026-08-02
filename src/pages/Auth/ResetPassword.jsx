import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, KeyRound, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateUserPassword, verifyOtp, user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Parse any parameters from URL hash or search if available
    const hashParams = new URLSearchParams(location.hash.substring(1));
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email') || hashParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [location]);

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // If user came via email link, session is active; otherwise verify OTP if entered
      if (!session && otpToken && email) {
        await verifyOtp(email.trim(), otpToken.trim(), 'recovery');
      }

      await updateUserPassword(newPassword);
      setMessage('Your password has been updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Update Password Error:', err);
      setError(formatErr(err, 'Failed to update password. Please check your link or OTP code.'));
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

        <form className="auth-form" onSubmit={handleUpdatePassword}>
          <div className="auth-form-header">
            <h2 className="auth-title">Set New Password</h2>
            <p className="auth-desc">Create a new password for your account</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          {/* Optional Email & OTP inputs if opened without session link */}
          {!session && (
            <>
              <div className="input-group">
                <label className="input-label">Email Address (Optional if clicked link)</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">6-Digit Code (Optional if clicked link)</label>
                <div className="input-icon-wrapper">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="123456"
                    value={otpToken}
                    onChange={e => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    style={{ letterSpacing: '0.25em', fontSize: '1.1rem', textAlign: 'center' }}
                  />
                </div>
              </div>
            </>
          )}

          {/* New Password */}
          <div className="input-group">
            <label className="input-label">New Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
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

          {/* Confirm New Password */}
          <div className="input-group">
            <label className="input-label">Confirm New Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block mt-4" disabled={loading}>
            <CheckCircle size={18} />
            {loading ? 'Saving Password...' : 'Save New Password'}
          </button>

          <Link to="/login" className="btn btn-ghost btn-block mt-2">
            ← Back to Sign In
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
