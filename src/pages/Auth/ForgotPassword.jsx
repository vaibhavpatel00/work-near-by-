import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [email, setEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { resetPassword, sendOtp, verifyOtp, updateUserPassword } = useAuth();
  const navigate = useNavigate();

  const formatErr = (err, defaultMsg) => {
    if (!err) return defaultMsg;
    if (typeof err === 'string' && err.trim() && err !== '{}') return err;
    if (err.message && typeof err.message === 'string' && err.message !== '{}') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    return defaultMsg;
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Send reset password email and OTP passcode
      await resetPassword(email.trim()).catch(() => {});
      await sendOtp(email.trim()).catch(() => {});

      setMessage(`Password reset code sent to ${email.trim()}. Check your inbox!`);
      setStep('reset');
    } catch (err) {
      console.error('Reset request error:', err);
      setError(formatErr(err, 'Failed to send reset code. Please check your email address.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpToken || otpToken.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP code first
      await verifyOtp(email.trim(), otpToken.trim());
      // Update password
      await updateUserPassword(newPassword);

      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Password reset confirmation error:', err);
      setError(formatErr(err, 'Invalid or expired code. Please try again.'));
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
          <form className="auth-form" onSubmit={handleRequestReset}>
            <div className="auth-form-header">
              <h2 className="auth-title">Reset Password</h2>
              <p className="auth-desc">Enter your registered email to receive password reset instructions & OTP code</p>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

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
              {loading ? 'Sending Reset Code...' : 'Send Reset Code'}
            </button>

            <Link to="/login" className="btn btn-ghost btn-block mt-2">
              ← Back to Sign In
            </Link>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleConfirmReset}>
            <div className="auth-form-header">
              <h2 className="auth-title">Set New Password</h2>
              <p className="auth-desc">Enter the 6-digit code sent to <strong>{email}</strong> and your new password</p>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            {/* OTP Token */}
            <div className="input-group">
              <label className="input-label">6-Digit Verification Code</label>
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
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-block mt-2"
              onClick={() => setStep('request')}
            >
              ← Resend Code / Change Email
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remembered your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
