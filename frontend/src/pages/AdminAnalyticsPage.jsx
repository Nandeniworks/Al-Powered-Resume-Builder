import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState([]);
  const [atsAnalytics, setAtsAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAdminAnalytics() {
      try {
        setLoading(true);
        const data = await api.get('/api/admin/analytics');
        if (Array.isArray(data)) {
          setAnalytics(data);
        } else if (data && typeof data === 'object') {
          setAnalytics(Array.isArray(data.analytics) ? data.analytics : []);
          setAtsAnalytics(data.atsAnalytics || data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    }

    loadAdminAnalytics();
  }, []);

  const totalViews = Array.isArray(analytics)
    ? analytics.reduce((sum, item) => sum + (item.views !== undefined ? item.views : item.action === 'view' ? 1 : 0), 0)
    : 0;
  const totalDownloads = Array.isArray(analytics)
    ? analytics.reduce((sum, item) => sum + (item.downloads !== undefined ? item.downloads : item.action === 'download' ? 1 : 0), 0)
    : 0;

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
            Global Platform & ATS Analytics
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.5rem',
          }}>
            Platform-wide audit of ATS score simulations, resume views, downloads, and candidate compatibility metrics.
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

        {/* ATS Analytics Section Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            color: 'var(--color-burgundy)',
            margin: 0,
          }}>
            ATS Scoring Analytics
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Deterministic keyword matching simulation statistics across all resumes and job postings.
          </p>
        </div>

        {/* ATS Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem',
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Total ATS Analyses
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.6rem', fontWeight: 700, color: 'var(--color-burgundy)', lineHeight: 1 }}>
              {atsAnalytics?.totalAnalyses || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Average ATS Score
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.6rem', fontWeight: 700, color: '#2E7D32', lineHeight: 1 }}>
              {atsAnalytics?.averageScore !== undefined ? `${atsAnalytics.averageScore}%` : '0%'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Highest Score
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.6rem', fontWeight: 700, color: 'var(--color-burgundy)', lineHeight: 1 }}>
              {atsAnalytics?.highestScore !== undefined ? `${atsAnalytics.highestScore}%` : '0%'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Lowest Score
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.6rem', fontWeight: 700, color: 'var(--color-text-muted)', lineHeight: 1 }}>
              {atsAnalytics?.lowestScore !== undefined ? `${atsAnalytics.lowestScore}%` : '0%'}
            </div>
          </div>
        </div>

        {/* ATS Score Distribution Bar */}
        {atsAnalytics?.scoreDistribution && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            border: '1px solid rgba(216, 196, 172, 0.5)',
            padding: '1.75rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-subtle)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: 'var(--color-burgundy)',
              marginBottom: '1rem',
            }}>
              ATS Score Distribution
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#FFEBEE', borderRadius: '8px', border: '1px solid #FFCDD2' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C62828' }}>Below 60%</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#C62828' }}>{atsAnalytics.scoreDistribution.below60 || 0}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#FFF8E1', borderRadius: '8px', border: '1px solid #FFE082' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#B78103' }}>60% - 79% (Moderate)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#B78103' }}>{atsAnalytics.scoreDistribution.between60And79 || 0}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#E8F5E9', borderRadius: '8px', border: '1px solid #A5D6A7' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#2E7D32' }}>80% - 100% (Strong)</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2E7D32' }}>{atsAnalytics.scoreDistribution.between80And100 || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent ATS Analyses Table */}
        {atsAnalytics?.recentAnalyses && atsAnalytics.recentAnalyses.length > 0 && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            border: '1px solid rgba(216, 196, 172, 0.5)',
            padding: '2rem',
            marginBottom: '3rem',
            boxShadow: 'var(--shadow-subtle)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              color: 'var(--color-burgundy)',
              marginBottom: '1.5rem',
            }}>
              Recent ATS Analyses ({atsAnalytics.recentAnalyses.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-burgundy)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Score</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Resume</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Candidate / User</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Matched</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Missing</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {atsAnalytics.recentAnalyses.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid rgba(216, 196, 172, 0.4)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: item.score >= 80 ? '#E8F5E9' : item.score >= 60 ? '#FFF8E1' : '#FFEBEE',
                          color: item.score >= 80 ? '#2E7D32' : item.score >= 60 ? '#B78103' : '#C62828',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          display: 'inline-block',
                        }}>
                          {item.score}%
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {item.resume?.title || item.resume || 'Document'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {item.user?.name || item.user?.email || 'User'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#2E7D32', fontSize: '0.82rem' }}>
                        {Array.isArray(item.matchedKeywords) ? item.matchedKeywords.slice(0, 3).join(', ') + (item.matchedKeywords.length > 3 ? '...' : '') : 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-burgundy)', fontSize: '0.82rem' }}>
                        {Array.isArray(item.missingKeywords) ? item.missingKeywords.slice(0, 3).join(', ') + (item.missingKeywords.length > 3 ? '...' : '') : 'None'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Global Views & Downloads Summary Cards */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            color: 'var(--color-burgundy)',
            margin: 0,
          }}>
            Resume Interaction Analytics
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
            Platform-wide metrics on resume document views and PDF downloads.
          </p>
        </div>

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

        {/* Global Interaction Records */}
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
            Resume Interaction Records ({analytics.length})
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
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Resume</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Views</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Downloads</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)' }}>Record ID</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((item) => (
                    <tr key={item._id} style={{ borderBottom: '1px solid rgba(216, 196, 172, 0.4)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {item.resume?.title || item.resume || 'Document'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: 'rgba(216, 196, 172, 0.35)',
                          color: 'var(--color-text-main)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                        }}>
                          {item.views !== undefined ? `${item.views} views` : item.action === 'view' ? '1 view' : '0 views'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: 'rgba(77, 14, 19, 0.08)',
                          color: 'var(--color-burgundy)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                        }}>
                          {item.downloads !== undefined ? `${item.downloads} downloads` : item.action === 'download' ? '1 download' : '0 downloads'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)' }}>
                        {item.createdAt || item.updatedAt ? new Date(item.updatedAt || item.createdAt).toLocaleString() : 'N/A'}
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
