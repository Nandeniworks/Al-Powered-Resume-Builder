import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAdminAnalytics() {
      try {
        setLoading(true);
        const data = await api.get('/api/admin/analytics');
        if (Array.isArray(data)) {
          setAnalytics(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    }

    loadAdminAnalytics();
  }, []);

  const totalViews = analytics.filter((a) => a.action === 'view').length;
  const totalDownloads = analytics.filter((a) => a.action === 'download').length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-cream)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Navbar />

      <main style={{
        maxWidth: '1100px',
        width: '100%',
        margin: '2.5rem auto',
        padding: '0 clamp(1rem, 3vw, 2.5rem)',
        flex: 1,
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-burgundy)',
            marginBottom: '0.5rem',
          }}>
            Platform Administration
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            color: 'var(--color-burgundy)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            Global Platform Analytics
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.5rem',
          }}>
            Platform-wide audit of all resume interaction events, views, and downloads across MongoDB.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(77, 14, 19, 0.08)',
            border: '1px solid var(--color-burgundy)',
            borderRadius: '8px',
            color: 'var(--color-burgundy)',
            marginBottom: '2rem',
          }}>
            {error}
          </div>
        )}

        {/* Global Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Platform Total Views
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 700, color: 'var(--color-burgundy)', lineHeight: 1 }}>
              {totalViews}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Platform Total Downloads
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 700, color: 'var(--color-burgundy)', lineHeight: 1 }}>
              {totalDownloads}
            </div>
          </div>
        </div>

        {/* Global Event Logs */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: '16px',
          border: '1px solid rgba(216, 196, 172, 0.5)',
          padding: '2rem',
          boxShadow: 'var(--shadow-subtle)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            color: 'var(--color-burgundy)',
            marginBottom: '1.5rem',
          }}>
            Global Event Records ({analytics.length})
          </h3>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Loading platform events...</p>
          ) : analytics.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No platform event records found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-burgundy)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Action</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Resume</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Record ID</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid rgba(216, 196, 172, 0.4)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: item.action === 'view' ? 'rgba(216, 196, 172, 0.35)' : 'rgba(77, 14, 19, 0.08)',
                          color: item.action === 'view' ? 'var(--color-text-main)' : 'var(--color-burgundy)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                        }}>
                          {item.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {item.resume?.title || item.resume || 'Document'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#8C7A7B' }}>
                        <code>{item._id}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--color-text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid rgba(216, 196, 172, 0.35)',
      }}>
        ResumeCraft • The Editorial Resume Studio • 2026
      </footer>
    </div>
  );
}
