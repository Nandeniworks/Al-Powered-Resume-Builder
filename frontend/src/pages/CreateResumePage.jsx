import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function CreateResumePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await api.get('/api/templates');
        if (Array.isArray(data)) {
          setTemplates(data);
        }
      } catch (err) {
        console.warn('Could not fetch templates:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  // Match actual MongoDB templates to style options
  const professionalTemplate = templates.find((t) => t.layout === 'standard') || templates[0];
  const creativeTemplate = templates.find((t) => t.layout === 'creative') || templates[1] || templates[0];

  const handleSelectStyle = (styleName, templateObj) => {
    const templateId = templateObj?._id || '';
    navigate(`/resume/new?style=${styleName}&templateId=${templateId}`);
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

      {/* Main Content: Choose Your Resume Style */}
      <main style={{
        maxWidth: '1060px',
        width: '100%',
        margin: '3rem auto',
        padding: '0 clamp(1rem, 3vw, 2.5rem)',
        flex: 1,
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            fontSize: '0.8rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}>
            New Document
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
            color: 'var(--color-burgundy)',
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}>
            Choose your resume style
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.75rem',
            maxWidth: '520px',
            margin: '0.75rem auto 0',
          }}>
            Select a design system tailored to your industry and voice.
          </p>
        </div>

        {/* Style Selection Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          textAlign: 'left',
        }}>
          {/* Card 1: Professional */}
          <div
            onClick={() => handleSelectStyle('professional', professionalTemplate)}
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              border: '1px solid rgba(216, 196, 172, 0.55)',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--color-burgundy)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(216, 196, 172, 0.55)';
            }}
          >
            <div>
              {/* Miniature Preview Representation */}
              <div style={{
                height: '180px',
                backgroundColor: '#FAF7F4',
                borderRadius: '8px',
                border: '1px solid rgba(216, 196, 172, 0.4)',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ width: '45%', height: '10px', backgroundColor: '#24191A', borderRadius: '2px' }} />
                <div style={{ width: '30%', height: '6px', backgroundColor: '#8C7A7B', borderRadius: '2px', marginBottom: '8px' }} />
                <div style={{ width: '100%', height: '1.5px', backgroundColor: '#D8C4AC', marginBottom: '6px' }} />
                <div style={{ width: '25%', height: '6px', backgroundColor: '#4D0E13', borderRadius: '2px' }} />
                <div style={{ width: '90%', height: '4px', backgroundColor: '#D8C4AC', borderRadius: '2px' }} />
                <div style={{ width: '80%', height: '4px', backgroundColor: '#EEE4DA', borderRadius: '2px' }} />
                <div style={{ width: '85%', height: '4px', backgroundColor: '#EEE4DA', borderRadius: '2px' }} />
                <div style={{ width: '25%', height: '6px', backgroundColor: '#4D0E13', borderRadius: '2px', marginTop: '6px' }} />
                <div style={{ width: '95%', height: '4px', backgroundColor: '#D8C4AC', borderRadius: '2px' }} />
              </div>

              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '0.4rem',
              }}>
                Structured Format
              </div>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'var(--color-burgundy)',
                marginBottom: '0.65rem',
              }}>
                PROFESSIONAL
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}>
                Clean, structured and ATS-friendly.
              </p>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="btn-burgundy"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.8rem 1.25rem',
                  letterSpacing: '0.06em',
                }}
              >
                SELECT PROFESSIONAL →
              </button>
            </div>
          </div>

          {/* Card 2: Creative Editorial */}
          <div
            onClick={() => handleSelectStyle('creative', creativeTemplate)}
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              border: '1.5px solid var(--color-burgundy)',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(77, 14, 19, 0.16)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            }}
          >
            {/* Signature Badge */}
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'rgba(77, 14, 19, 0.08)',
              color: 'var(--color-burgundy)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
            }}>
              Signature
            </div>

            <div>
              {/* Miniature Preview Representation */}
              <div style={{
                height: '180px',
                backgroundColor: '#FAF7F4',
                borderRadius: '8px',
                border: '1px solid rgba(216, 196, 172, 0.4)',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-burgundy)',
                    letterSpacing: '0.04em',
                  }}>
                    CREATIVE RESUME
                  </div>
                  <div style={{ width: '20%', height: '4px', backgroundColor: '#8C7A7B', borderRadius: '2px' }} />
                </div>
                <div style={{ width: '100%', height: '2px', backgroundColor: '#4D0E13', marginBottom: '4px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <div>
                    <div style={{ width: '50%', height: '5px', backgroundColor: '#4D0E13', borderRadius: '2px', marginBottom: '4px' }} />
                    <div style={{ width: '90%', height: '4px', backgroundColor: '#D8C4AC', borderRadius: '2px', marginBottom: '3px' }} />
                    <div style={{ width: '80%', height: '4px', backgroundColor: '#EEE4DA', borderRadius: '2px' }} />
                  </div>
                  <div>
                    <div style={{ width: '50%', height: '5px', backgroundColor: '#4D0E13', borderRadius: '2px', marginBottom: '4px' }} />
                    <div style={{ width: '85%', height: '4px', backgroundColor: '#D8C4AC', borderRadius: '2px', marginBottom: '3px' }} />
                    <div style={{ width: '75%', height: '4px', backgroundColor: '#EEE4DA', borderRadius: '2px' }} />
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '0.4rem',
              }}>
                Editorial Typography
              </div>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'var(--color-burgundy)',
                marginBottom: '0.65rem',
              }}>
                CREATIVE EDITORIAL
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}>
                Bold, expressive and visually distinctive.
              </p>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="btn-burgundy"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.8rem 1.25rem',
                  letterSpacing: '0.06em',
                }}
              >
                SELECT EDITORIAL →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem clamp(1rem, 3vw, 2.5rem)',
        borderTop: '1px solid rgba(216, 196, 172, 0.35)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        ResumeCraft • Crafted with editorial precision
      </footer>
    </div>
  );
}
