import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Authenticate with backend API (validates with Firebase, returns backend JWT & user)
      const data = await api.post('/api/auth/login', { email, password });

      // 2. Store session credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 3. Keep client Firebase Auth state synchronized
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        // Non-blocking if Firebase client state was already active
        console.info('Client Firebase Auth sync:', fbErr.message);
      }

      // 4. Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.2rem',
          fontWeight: 600,
          color: 'var(--color-burgundy)',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          Welcome back
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
          marginTop: '0.5rem',
        }}>
          Continue building your resume.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(77, 14, 19, 0.07)',
          border: '1px solid rgba(77, 14, 19, 0.2)',
          borderRadius: '8px',
          color: 'var(--color-burgundy)',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          lineHeight: 1.4,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-main)',
            marginBottom: '0.45rem',
          }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.45rem',
          }}>
            <label style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-text-main)',
            }}>
              Password
            </label>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="submit"
            className="btn-burgundy"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'SIGN IN'}
          </button>
        </div>
      </form>

      <div style={{
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(216, 196, 172, 0.4)',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: 'var(--color-text-muted)',
      }}>
        Don't have an account?{' '}
        <Link
          to="/register"
          style={{
            color: 'var(--color-burgundy)',
            fontWeight: 600,
            textDecoration: 'none',
            marginLeft: '0.25rem',
          }}
        >
          Create one
        </Link>
      </div>
    </AuthLayout>
  );
}
