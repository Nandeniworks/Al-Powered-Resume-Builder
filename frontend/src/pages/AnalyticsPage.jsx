import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [viewsData, downloadsData, resumesData] = await Promise.all([
          api.get('/api/analytics/views').catch(() => []),
          api.get('/api/analytics/downloads').catch(() => []),
          api.get('/api/resumes').catch(() => []),
        ]);

        if (Array.isArray(viewsData)) setViews(viewsData);
        if (Array.isArray(downloadsData)) setDownloads(downloadsData);
        if (Array.isArray(resumesData)) setResumes(resumesData);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

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
        maxWidth: '1060px',
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
            color: 'var(--color-text-muted)',
            marginBottom: '0.5rem',
          }}>
            Studio Engagement Metrics
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            color: 'var(--color-burgundy)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            Document Analytics
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.5rem',
            maxWidth: '560px',
          }}>
            Real-time reader engagement and PDF download activity recorded across your portfolio.
          </p>
        </div>

        {/* Top Level Metric Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {/* Card 1: Views */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}>
              Total Resume Views
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--color-burgundy)',
              lineHeight: 1.1,
            }}>
              {views.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
              Authenticated and public link inspections
            </div>
          </div>

          {/* Card 2: Downloads */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}>
              Total PDF Downloads
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '3rem',
              fontWeight: 700,
              color: 'var(--color-burgundy)',
              lineHeight: 1.1,
            }}>
              {downloads.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
              Generated PDF document exports
            </div>
          </div>
        </div>

        {/* Breakdown by Resume Document */}
        <section style={{
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
            Performance by Document
          </h3>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Loading document breakdown...</p>
          ) : resumes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No resumes created yet to track activity.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-burgundy)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--color-burgundy)' }}>Document Title</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--color-burgundy)' }}>Views</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--color-burgundy)' }}>Downloads</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--color-burgundy)' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((r) => {
                    const resumeViews = views.filter((v) => v.resume === r._id || v.resume?._id === r._id).length;
                    const resumeDownloads = downloads.filter((d) => d.resume === r._id || d.resume?._id === r._id).length;
                    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent';

                    return (
                      <tr key={r._id} style={{ borderBottom: '1px solid rgba(216, 196, 172, 0.4)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{r.title}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-burgundy)', fontWeight: 700 }}>{resumeViews}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-burgundy)', fontWeight: 700 }}>{resumeDownloads}</td>
                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{dateStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
