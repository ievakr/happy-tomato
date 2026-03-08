import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TomatoBackground from './TomatoBackground';
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container d-flex align-items-center justify-content-center">
      <TomatoBackground />
      <div className="auth-card card shadow-lg border-0">
        <div className="card-body">
          <div className="text-center mb-4">
            <h2 className="auth-title h3 fw-bold mb-1">Reset Password</h2>
            <p className="auth-subtitle mb-0">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {error && <div className="auth-error alert alert-danger">{error}</div>}
          {success && (
            <div className="auth-success alert alert-success">
              Password reset email sent! Check your inbox.
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="auth-form d-grid gap-3">
              <div>
                <label htmlFor="email" className="form-label fw-semibold">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-control form-control-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg w-100"
              onClick={onBackToLogin}
            >
              Back to Sign In
            </button>
          )}

          {!success && (
            <div className="auth-footer text-center mt-4">
              <button
                type="button"
                className="btn btn-link p-0 fw-semibold text-decoration-none"
                onClick={onBackToLogin}
                disabled={loading}
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

