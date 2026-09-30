import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTemplates() {
      try {
        setLoading(true);
        const data = await api.get('/api/templates');
        if (Array.isArray(data)) {
          setTemplates(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch templates');
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleUseTemplate = (template) => {
    const styleParam = template.layout === 'standard' ? 'professional' : 'creative';
    navigate(`/resume/new?templateId=${template._id}&style=${styleParam}`);
  };

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
        maxWidth: '1280px',
        width: '100%',
        margin: '2.5rem auto',
        padding: '0 clamp(1rem, 3vw, 2.5rem)',
        flex: 1,
      }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: '0.5rem',
          }}>
            Curated Systems
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            color: 'var(--color-burgundy)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            Resume Templates
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.65rem',
            maxWidth: '520px',
            margin: '0.65rem auto 0',
          }}>
            Select a verified typography and layout blueprint from our studio library.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(77, 14, 19, 0.08)',
            border: '1px solid var(--color-burgundy)',
            borderRadius: '8px',
            color: 'var(--color-burgundy)',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            Loading templates library...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
          }}>
            {templates.map((tpl) => {
              const isStandard = tpl.layout === 'standard';
              const styleBadge = isStandard ? 'Professional ATS' : 'Creative Editorial';

              return (
                <div
                  key={tpl._id}
                  style={{
                    backgroundColor: 'var(--color-white)',
                    borderRadius: '16px',
                    border: isStandard ? '1px solid rgba(216, 196, 172, 0.6)' : '1.5px solid var(--color-burgundy)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {/* Style Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    backgroundColor: isStandard ? 'rgba(216, 196, 172, 0.35)' : 'rgba(77, 14, 19, 0.08)',
                    color: isStandard ? 'var(--color-text-main)' : 'var(--color-burgundy)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '20px',
                  }}>
                    {styleBadge}
                  </div>

                  <div>
                    {/* Visual Mock Paper */}
                    <div style={{
                      height: '190px',
                      backgroundColor: '#FAF7F4',
                      borderRadius: '8px',
                      border: '1px solid rgba(216, 196, 172, 0.4)',
                      padding: '1.25rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: '50%', height: '10px', backgroundColor: isStandard ? '#24191A' : 'var(--color-burgundy)', borderRadius: '2px' }} />
                      <div style={{ width: '30%', height: '5px', backgroundColor: '#8C7A7B', borderRadius: '2px', marginBottom: '8px' }} />
                      <div style={{ width: '100%', height: '1.5px', backgroundColor: isStandard ? '#24191A' : 'var(--color-burgundy)', marginBottom: '8px' }} />
                      <div style={{ width: '25%', height: '5px', backgroundColor: isStandard ? '#555' : 'var(--color-burgundy)', borderRadius: '2px' }} />
                      <div style={{ width: '90%', height: '4px', backgroundColor: '#D8C4AC', borderRadius: '2px' }} />
                      <div style={{ width: '80%', height: '4px', backgroundColor: '#EEE4DA', borderRadius: '2px' }} />
                      <div style={{ width: '85%', height: '4px', backgroundColor: '#EEE4DA', borderRadius: '2px' }} />
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.5rem',
                      color: 'var(--color-burgundy)',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                    }}>
                      {tpl.name}
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                      marginBottom: '1.5rem',
                    }}>
                      {tpl.description || (isStandard
                        ? 'Clean, structured layout optimized for standard corporate screenings and applicant tracking systems.'
                        : 'Distinctive typography, asymmetric layouts, and signature editorial styling.')}
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className="btn-burgundy"
                      style={{ fontSize: '0.84rem' }}
                    >
                      USE THIS TEMPLATE →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
