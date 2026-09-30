import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

// Miniature Realistic Resume Paper Preview Component using Genuine Saved Data
function MiniatureResumePreview({ resume, styleType = 'creative' }) {
  const name = resume?.personalDetails?.fullName || resume?.title || 'Untitled Document';
  const role = resume?.personalDetails?.professionalTitle || resume?.personalDetails?.title || '';
  const location = resume?.personalDetails?.location || resume?.personalDetails?.email || '';
  const summary = resume?.personalDetails?.summary || '';
  const experienceList = Array.isArray(resume?.experience) ? resume.experience.slice(0, 2) : [];
  const educationList = Array.isArray(resume?.education) ? resume.education.slice(0, 2) : [];
  const skillsList = Array.isArray(resume?.skills) && resume.skills.length > 0
    ? resume.skills.slice(0, 4).join(' • ')
    : '';

  const isCreative = styleType === 'creative';

  return (
    <div style={{
      width: '100%',
      aspectRatio: '1 / 1.3',
      backgroundColor: 'var(--color-white)',
      borderRadius: '8px',
      border: isCreative ? '1.5px solid var(--color-burgundy)' : '1px solid rgba(216, 196, 172, 0.45)',
      boxShadow: '0 6px 18px rgba(36, 25, 26, 0.06)',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top Document Header */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: isCreative ? '1.5px solid var(--color-burgundy)' : '1px solid #24191A',
          paddingBottom: '0.4rem',
          marginBottom: '0.6rem',
        }}>
          <div>
            <div style={{
              fontFamily: isCreative ? 'var(--font-serif)' : 'var(--font-sans)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: isCreative ? 'var(--color-burgundy)' : 'var(--color-text-main)',
              letterSpacing: isCreative ? '0.02em' : '0.01em',
              textTransform: 'uppercase',
              lineHeight: 1.15,
            }}>
              {name}
            </div>
            {role && (
              <div style={{
                fontSize: '0.55rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.15rem',
              }}>
                {role}
              </div>
            )}
          </div>
          {location && (
            <div style={{ fontSize: '0.5rem', color: '#8C7A7B' }}>
              {location}
            </div>
          )}
        </div>

        {/* Section: Profile / Summary (only if exists) */}
        {summary ? (
          <div style={{ marginBottom: '0.55rem' }}>
            <div style={{
              fontSize: '0.5rem',
              fontFamily: isCreative ? 'var(--font-serif)' : 'var(--font-sans)',
              fontWeight: 700,
              color: isCreative ? 'var(--color-burgundy)' : 'var(--color-text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.2rem',
            }}>
              Summary
            </div>
            <p style={{
              fontSize: '0.48rem',
              lineHeight: 1.35,
              color: 'var(--color-text-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
            }}>
              {summary}
            </p>
          </div>
        ) : null}

        {/* Section: Genuine Experience (only if exists) */}
        {experienceList.length > 0 ? (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{
              fontSize: '0.5rem',
              fontFamily: isCreative ? 'var(--font-serif)' : 'var(--font-sans)',
              fontWeight: 700,
              color: isCreative ? 'var(--color-burgundy)' : 'var(--color-text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}>
              Experience
            </div>

            {experienceList.map((exp, i) => (
              <div key={i} style={{ marginBottom: '0.3rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                }}>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {exp.role || 'Role'} • {exp.company || 'Company'}
                  </span>
                  <span style={{ color: '#8C7A7B', fontWeight: 400 }}>{exp.duration || ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Section: Genuine Education (only if exists) */}
        {educationList.length > 0 ? (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{
              fontSize: '0.5rem',
              fontFamily: isCreative ? 'var(--font-serif)' : 'var(--font-sans)',
              fontWeight: 700,
              color: isCreative ? 'var(--color-burgundy)' : 'var(--color-text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}>
              Education
            </div>
            {educationList.map((edu, i) => (
              <div key={i} style={{ fontSize: '0.48rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                <strong style={{ color: 'var(--color-text-main)' }}>{edu.degree || 'Degree'}</strong>, {edu.institution || ''}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom Skills Footer (only if exists) */}
      {skillsList ? (
        <div style={{
          borderTop: '1px solid rgba(216, 196, 172, 0.4)',
          paddingTop: '0.35rem',
        }}>
          <div style={{
            fontSize: '0.46rem',
            fontFamily: isCreative ? 'var(--font-serif)' : 'var(--font-sans)',
            fontWeight: 700,
            color: isCreative ? 'var(--color-burgundy)' : 'var(--color-text-main)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.1rem',
          }}>
            Skills
          </div>
          <div style={{
            fontSize: '0.45rem',
            color: 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {skillsList}
          </div>
        </div>
      ) : (
        <div style={{
          borderTop: '1px solid rgba(216, 196, 172, 0.3)',
          paddingTop: '0.3rem',
          fontSize: '0.45rem',
          color: '#A39394',
          textAlign: 'center',
        }}>
          ResumeCraft Document
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [downloadsCount, setDownloadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [shareData, setShareData] = useState(null);

  // Dynamic greeting based on current local hour
  const getGreeting = (name) => {
    const hour = new Date().getHours();
    let timeStr = 'Good evening';
    if (hour >= 4 && hour < 12) timeStr = 'Good morning';
    else if (hour >= 12 && hour < 17) timeStr = 'Good afternoon';
    return name ? `${timeStr}, ${name}.` : `${timeStr}.`;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [resumesData, viewsData, downloadsData] = await Promise.all([
        api.get('/api/resumes').catch(() => []),
        api.get('/api/analytics/views').catch(() => []),
        api.get('/api/analytics/downloads').catch(() => []),
      ]);

      if (Array.isArray(resumesData)) {
        setResumes(resumesData);
      }
      if (Array.isArray(viewsData)) {
        setViewsCount(viewsData.length);
      }
      if (Array.isArray(downloadsData)) {
        setDownloadsCount(downloadsData.length);
      }
    } catch (err) {
      if (err.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    try {
      setUser(rawUser ? JSON.parse(rawUser) : null);
    } catch (e) {
      setUser(null);
    }
    loadDashboardData();
  }, [navigate]);

  // Download PDF Action
  const handleDownloadPDF = async (resumeId, resumeTitle) => {
    try {
      setDownloadingId(resumeId);
      setActionNotice(`Generating PDF for "${resumeTitle}"...`);
      const blob = await api.get(`/api/resumes/${resumeId}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeTitle || 'resume').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setActionNotice(`PDF downloaded successfully for "${resumeTitle}".`);
    } catch (err) {
      setActionNotice(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Share Action
  const handleShare = async (resumeId, resumeTitle) => {
    try {
      setActionNotice(`Generating share link for "${resumeTitle}"...`);
      const data = await api.post('/api/share', { resume: resumeId });
      const publicUrl = `${window.location.origin}/share/${data.shareId}`;
      setShareData({
        title: resumeTitle,
        shareId: data.shareId,
        url: publicUrl,
      });
      navigator.clipboard?.writeText(publicUrl);
      setActionNotice(`Share link copied to clipboard: ${publicUrl}`);
    } catch (err) {
      setActionNotice(`Could not generate share link: ${err.message}`);
    }
  };

  // Delete Action
  const handleDelete = async (resumeId, resumeTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${resumeTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/api/resumes/${resumeId}`);
      setActionNotice(`Resume "${resumeTitle}" was deleted.`);
      loadDashboardData();
    } catch (err) {
      setActionNotice(`Delete failed: ${err.message}`);
    }
  };

  const displayName = user ? (user.name || user.email?.split('@')[0]) : 'User';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-cream)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Navbar />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '2.5rem auto',
        padding: '0 clamp(1rem, 3vw, 2.5rem)',
        flex: 1,
      }}>
        {/* Toast / Notification Banner */}
        {actionNotice && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderLeft: '4px solid var(--color-burgundy)',
            borderRadius: '6px',
            padding: '0.85rem 1.25rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.88rem',
            color: 'var(--color-burgundy)',
          }}>
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text-muted)' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Share Dialog / Modal */}
        {shareData && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(36, 25, 26, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}>
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '14px',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-paper)',
              border: '1px solid rgba(216, 196, 172, 0.6)',
            }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--color-burgundy)', marginBottom: '0.5rem' }}>
                Share Document
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                Anyone with this public link can view "{shareData.title}".
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={shareData.url}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '0.6rem 0.8rem' }}
                />
                <button
                  type="button"
                  className="btn-burgundy"
                  style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.8rem' }}
                  onClick={() => {
                    navigator.clipboard?.writeText(shareData.url);
                    alert('Link copied to clipboard!');
                  }}
                >
                  COPY
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <a
                  href={shareData.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: '#FAF7F4',
                    border: '1px solid rgba(216, 196, 172, 0.7)',
                    color: 'var(--color-text-main)',
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  OPEN LINK ↗
                </a>
                <button
                  type="button"
                  onClick={() => setShareData(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '6px',
                    backgroundColor: 'var(--color-burgundy)',
                    border: 'none',
                    color: 'var(--color-white)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Main Greeting & Call to Action */}
        <section style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(216, 196, 172, 0.45)',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
              color: 'var(--color-burgundy)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}>
              {getGreeting(displayName)}
            </h1>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--color-text-muted)',
              marginTop: '0.65rem',
              maxWidth: '520px',
            }}>
              Build something worth being remembered for.
            </p>
          </div>

          <div>
            <Link
              to="/create-resume"
              className="btn-burgundy"
              style={{
                textDecoration: 'none',
                padding: '0.95rem 1.75rem',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 24px rgba(77, 14, 19, 0.2)',
                width: 'auto',
              }}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> CREATE NEW RESUME
            </Link>
          </div>
        </section>

        {/* 4 & 5. QUICK TOOLS & ACTIVITY ROW */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {/* Quick Tools */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '14px',
            border: '1px solid rgba(216, 196, 172, 0.45)',
            padding: '1.5rem 1.75rem',
            boxShadow: 'var(--shadow-subtle)',
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '1rem',
            }}>
              Quick Tools
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link
                to="/templates"
                style={{
                  padding: '0.65rem 1.1rem',
                  backgroundColor: '#FAF7F4',
                  border: '1px solid rgba(216, 196, 172, 0.65)',
                  borderRadius: '6px',
                  color: 'var(--color-text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Templates
              </Link>

              <Link
                to="/create-resume"
                style={{
                  padding: '0.65rem 1.1rem',
                  backgroundColor: '#FAF7F4',
                  border: '1px solid rgba(216, 196, 172, 0.65)',
                  borderRadius: '6px',
                  color: 'var(--color-text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                + New Resume
              </Link>

              <Link
                to="/tailor"
                style={{
                  padding: '0.65rem 1.1rem',
                  backgroundColor: '#FAF7F4',
                  border: '1px solid rgba(216, 196, 172, 0.65)',
                  borderRadius: '6px',
                  color: 'var(--color-text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Tailor Resume
              </Link>
            </div>
          </div>

          {/* Activity Metrics (Real Data) */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '14px',
            border: '1px solid rgba(216, 196, 172, 0.45)',
            padding: '1.5rem 1.75rem',
            boxShadow: 'var(--shadow-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.75rem',
            }}>
              Activity
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
              <Link to="/analytics" style={{ textDecoration: 'none' }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}>
                  Views
                </div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.1rem',
                  fontWeight: 700,
                  color: 'var(--color-burgundy)',
                  lineHeight: 1.1,
                  marginTop: '0.2rem',
                }}>
                  {viewsCount}
                </div>
              </Link>

              <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(216, 196, 172, 0.5)' }} />

              <Link to="/analytics" style={{ textDecoration: 'none' }}>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}>
                  Downloads
                </div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2.1rem',
                  fontWeight: 700,
                  color: 'var(--color-burgundy)',
                  lineHeight: 1.1,
                  marginTop: '0.2rem',
                }}>
                  {downloadsCount}
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 3. YOUR RESUMES SECTION */}
        <section>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '1.5rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(216, 196, 172, 0.35)',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.45rem',
              color: 'var(--color-burgundy)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              YOUR RESUMES
            </h2>

            <span style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}>
              {resumes.length} DOCUMENT{resumes.length === 1 ? '' : 'S'}
            </span>
          </div>

          {/* Resumes Grid / Empty State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
              Loading your studio documents...
            </div>
          ) : resumes.length === 0 ? (
            /* Elegant Empty State */
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '16px',
              border: '1px dashed rgba(216, 196, 172, 0.75)',
              padding: 'clamp(3rem, 6vw, 4.5rem) 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-subtle)',
            }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.85rem',
                fontWeight: 600,
                color: 'var(--color-burgundy)',
                marginBottom: '0.75rem',
              }}>
                No resumes yet.
              </div>
              <p style={{
                fontSize: '1rem',
                color: 'var(--color-text-muted)',
                marginBottom: '2rem',
                maxWidth: '460px',
                margin: '0 auto 2rem',
              }}>
                Create your first resume and bring your experience to life.
              </p>
              <Link
                to="/create-resume"
                className="btn-burgundy"
                style={{
                  display: 'inline-flex',
                  width: 'auto',
                  textDecoration: 'none',
                  padding: '0.9rem 2rem',
                }}
              >
                + CREATE NEW RESUME
              </Link>
            </div>
          ) : (
            /* Clean Resume Cards Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '2rem',
            }}>
              {resumes.map((resItem, idx) => {
                const updatedDate = resItem.updatedAt
                  ? new Date(resItem.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recently';
                const styleType = resItem.style || (resItem.template?.layout === 'creative' ? 'creative' : 'professional');
                const resumeLabel = styleType === 'creative' ? 'Creative Editorial' : 'Professional';

                return (
                  <div
                    key={resItem._id || idx}
                    style={{
                      backgroundColor: 'var(--color-white)',
                      borderRadius: '14px',
                      border: '1px solid rgba(216, 196, 172, 0.5)',
                      boxShadow: 'var(--shadow-subtle)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(77, 14, 19, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
                    }}
                  >
                    {/* Miniature Realistic Preview */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <MiniatureResumePreview resume={resItem} styleType={styleType} />
                    </div>

                    {/* Resume Card Info */}
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.4rem',
                      }}>
                        <h3 style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          color: 'var(--color-burgundy)',
                          lineHeight: 1.25,
                        }}>
                          {resItem.title || 'Untitled Document'}
                        </h3>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.74rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '1rem',
                      }}>
                        <span style={{
                          backgroundColor: styleType === 'creative' ? 'rgba(200, 164, 159, 0.25)' : 'rgba(216, 196, 172, 0.35)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          color: 'var(--color-text-main)',
                          fontWeight: 600,
                        }}>
                          {resumeLabel}
                        </span>
                        <span>•</span>
                        <span>Edited {updatedDate}</span>
                      </div>

                      {/* Card Action Buttons (Edit, Download PDF, Share, Delete) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button
                          onClick={() => navigate(`/resume/${resItem._id}/edit`)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-burgundy)',
                            borderRadius: '6px',
                            color: 'var(--color-burgundy)',
                            fontWeight: 600,
                            fontSize: '0.76rem',
                            cursor: 'pointer',
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
                          EDIT
                        </button>

                        <button
                          disabled={downloadingId === resItem._id}
                          onClick={() => handleDownloadPDF(resItem._id, resItem.title)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#FAF7F4',
                            border: '1px solid rgba(216, 196, 172, 0.7)',
                            borderRadius: '6px',
                            color: 'var(--color-text-main)',
                            fontWeight: 600,
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                          }}
                        >
                          {downloadingId === resItem._id ? 'DOWNLOADING...' : 'PDF'}
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleShare(resItem._id, resItem.title)}
                          style={{
                            padding: '0.45rem',
                            backgroundColor: '#FAF7F4',
                            border: '1px solid rgba(216, 196, 172, 0.5)',
                            borderRadius: '6px',
                            color: 'var(--color-text-main)',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          SHARE
                        </button>

                        <button
                          onClick={() => handleDelete(resItem._id, resItem.title)}
                          style={{
                            padding: '0.45rem',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(77, 14, 19, 0.3)',
                            borderRadius: '6px',
                            color: 'var(--color-burgundy)',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                          }}
                        >
                          DELETE
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '2rem auto 0',
        padding: '2rem clamp(1rem, 3vw, 2.5rem)',
        borderTop: '1px solid rgba(216, 196, 172, 0.35)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        ResumeCraft • The Editorial Resume Studio • 2026
      </footer>
    </div>
  );
}
