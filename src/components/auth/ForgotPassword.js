import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setSuccess(false);
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">
          Enter your email and we'll send you a link to reset your password
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success">
            Password reset email sent! Check your inbox.
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="auth-button primary"
            onClick={onBackToLogin}
          >
            Back to Sign In
          </button>
        )}

        {!success && (
          <div className="auth-footer">
            <button
              type="button"
              className="auth-link"
              onClick={onBackToLogin}
              disabled={loading}
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

