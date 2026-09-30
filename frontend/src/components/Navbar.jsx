import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rawUser = localStorage.getItem('user');
  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    user = null;
  }

  const handleSignOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout:', e.message);
    }
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: isActive(path) ? 700 : 500,
    color: isActive(path) ? 'var(--color-burgundy)' : 'var(--color-text-main)',
    borderBottom: isActive(path) ? '2px solid var(--color-burgundy)' : '2px solid transparent',
    paddingBottom: '0.25rem',
    letterSpacing: '0.02em',
    transition: 'all 0.2s ease',
  });

  const displayName = user ? (user.name || user.email?.split('@')[0]) : 'User';
  const isAdmin = user && user.role === 'admin';

  return (
    <header style={{
      backgroundColor: 'var(--color-cream)',
      borderBottom: '1px solid rgba(216, 196, 172, 0.5)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '1rem clamp(1rem, 3vw, 2.5rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
      }}>
        {/* Branding */}
        <Link to="/dashboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.65rem',
            color: 'var(--color-burgundy)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            ResumeCraft
          </div>
          <div style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginTop: '0.15rem',
          }}>
            The Editorial Resume Studio
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
          flexWrap: 'wrap',
        }} className="desktop-nav">
          <Link to="/dashboard" style={navLinkStyle('/dashboard')}>My Resumes</Link>
          <Link to="/templates" style={navLinkStyle('/templates')}>Templates</Link>
          <Link to="/tailor" style={navLinkStyle('/tailor')}>Tailor Resume</Link>
          <Link to="/analytics" style={navLinkStyle('/analytics')}>Analytics</Link>

          {/* Admin Links */}
          {isAdmin && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              paddingLeft: '1rem',
              borderLeft: '1px solid rgba(216, 196, 172, 0.7)',
            }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--color-burgundy)',
                backgroundColor: 'rgba(77, 14, 19, 0.08)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
              }}>
                ADMIN
              </span>
              <Link to="/admin/templates" style={navLinkStyle('/admin/templates')}>Tpl Admin</Link>
              <Link to="/admin/analytics" style={navLinkStyle('/admin/analytics')}>Metrics Admin</Link>
            </div>
          )}
        </nav>

        {/* Right Side: User Greeting & Sign Out */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: '0.82rem',
            color: 'var(--color-text-muted)',
            display: 'none',
          }} className="user-greeting-desk">
            Welcome, <strong style={{ color: 'var(--color-text-main)' }}>{displayName}</strong>
          </span>

          <button
            onClick={handleSignOut}
            style={{
              padding: '0.45rem 0.95rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-burgundy)',
              color: 'var(--color-burgundy)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-burgundy)';
              e.currentTarget.style.color = 'var(--color-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-burgundy)';
            }}
          >
            SIGN OUT
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              color: 'var(--color-burgundy)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
            className="mobile-nav-toggle"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderTop: '1px solid rgba(216, 196, 172, 0.4)',
          padding: '1.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle('/dashboard')}>My Resumes</Link>
          <Link to="/templates" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle('/templates')}>Templates</Link>
          <Link to="/tailor" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle('/tailor')}>Tailor Resume</Link>
          <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle('/analytics')}>Analytics</Link>
          {isAdmin && (
            <>
              <div style={{ height: '1px', backgroundColor: 'rgba(216, 196, 172, 0.4)', margin: '0.25rem 0' }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-burgundy)' }}>ADMINISTRATION</div>
              <Link to="/admin/templates" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle('/admin/templates')}>Admin: Templates</Link>
              <Link to="/admin/analytics" onClick={() => setMobileMenuOpen(false)} style={navLinkStyle('/admin/analytics')}>Admin: Analytics</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
