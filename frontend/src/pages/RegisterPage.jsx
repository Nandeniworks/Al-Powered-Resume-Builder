import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../services/api';
import AuthLayout from '../components/AuthLayout';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms & Privacy Policy to continue.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Call backend registration endpoint (creates Firebase auth user + MongoDB record)
      await api.post('/api/auth/register', { name, email, password });

      // 2. Automatically log the user in to receive backend JWT
      const loginData = await api.post('/api/auth/login', { email, password });

      // 3. Store session credentials
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify(loginData.user));

      // 4. Keep client Firebase Auth state synchronized
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        console.info('Client Firebase Auth sync:', fbErr.message);
      }

      // 5. Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          Create your account
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.95rem',
          color: 'var(--color-text-muted)',
          marginTop: '0.5rem',
        }}>
          Start building a resume that feels like you.
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
            Full Name
          </label>
          <input
            type="text"
            placeholder="Your Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

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
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-main)',
            marginBottom: '0.45rem',
          }}>
            Password
          </label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginTop: '0.25rem' }}>
          <input
            type="checkbox"
            id="termsCheckbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              marginTop: '2px',
              accentColor: 'var(--color-burgundy)',
              cursor: 'pointer',
            }}
          />
          <label
            htmlFor="termsCheckbox"
            style={{
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              lineHeight: 1.45,
            }}
          >
            I agree to the Terms & Privacy Policy
          </label>
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="submit"
            className="btn-burgundy"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
          </button>
        </div>
      </form>

      <div style={{
        marginTop: '1.75rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid rgba(216, 196, 172, 0.4)',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: 'var(--color-text-muted)',
      }}>
        Already have an account?{' '}
        <Link
          to="/login"
          style={{
            color: 'var(--color-burgundy)',
            fontWeight: 600,
            textDecoration: 'none',
            marginLeft: '0.25rem',
          }}
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
