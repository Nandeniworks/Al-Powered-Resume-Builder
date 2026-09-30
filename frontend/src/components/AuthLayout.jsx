import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-cream)',
      display: 'flex',
      alignItems: 'stretch',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Soft Organic Shapes */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '550px',
        height: '550px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(216, 196, 172, 0.45) 0%, rgba(238, 228, 218, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '40%',
        width: '650px',
        height: '650px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200, 164, 159, 0.25) 0%, rgba(238, 228, 218, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        width: '100%',
        maxWidth: '1440px',
        margin: '0 auto',
        zIndex: 1,
        minHeight: '100vh',
      }}>
        {/* LEFT COLUMN: Editorial Branding & Layered Resume Preview */}
        <div style={{
          padding: 'clamp(2rem, 5vw, 4.5rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(216, 196, 172, 0.4)',
          position: 'relative',
        }}>
          {/* Top Brand Wordmark */}
          <div>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-burgundy)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}>
                ResumeCraft
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginTop: '0.25rem',
              }}>
                The Editorial Resume Studio
              </div>
            </Link>

            {/* Editorial Headline */}
            <div style={{ marginTop: 'clamp(2rem, 4vw, 3.5rem)' }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.4rem, 4.2vw, 3.8rem)',
                fontWeight: 500,
                lineHeight: 1.08,
                color: 'var(--color-burgundy)',
                letterSpacing: '-0.01em',
                textTransform: 'uppercase',
              }}>
                Your Story.<br />
                Your Career.<br />
                <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Your Way.</span>
              </h1>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'var(--color-text-muted)',
                marginTop: '1.25rem',
                maxWidth: '420px',
                lineHeight: 1.6,
              }}>
                Create a resume that feels like you.
              </p>
            </div>
          </div>

          {/* Layered Resume Visual */}
          <div style={{
            margin: 'clamp(2rem, 4vw, 3rem) 0 1rem',
            position: 'relative',
            maxWidth: '480px',
            width: '100%',
          }}>
            {/* Background Organic/Paper Card (Sand / Dusty Pink) */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '-12px',
              bottom: '-12px',
              backgroundColor: 'var(--color-sand)',
              borderRadius: '14px',
              opacity: 0.65,
              transform: 'rotate(-2deg)',
              zIndex: 1,
            }} />
            <div style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              right: '-6px',
              bottom: '-6px',
              backgroundColor: 'var(--color-dusty-pink)',
              borderRadius: '14px',
              opacity: 0.35,
              transform: 'rotate(1deg)',
              zIndex: 2,
            }} />

            {/* Foreground Realistic Resume Paper Sheet */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              backgroundColor: 'var(--color-white)',
              borderRadius: '12px',
              padding: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              boxShadow: 'var(--shadow-paper)',
              border: '1px solid rgba(216, 196, 172, 0.45)',
            }}>
              {/* Paper Resume Header */}
              <div style={{
                borderBottom: '1.5px solid var(--color-burgundy)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.35rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'var(--color-burgundy)',
                    textTransform: 'uppercase',
                  }}>
                    YOUR RESUME
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}>
                    candidate@example.com • Portfolio & Experience
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  marginTop: '0.2rem',
                  letterSpacing: '0.02em',
                }}>
                  Software Engineer & Systems Architect
                </div>
              </div>

              {/* Section: Experience */}
              <div style={{ marginBottom: '0.9rem' }}>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--color-burgundy)',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}>
                  Experience
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                  }}>
                    <span>Full Stack Engineer • Technology Labs</span>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>2023 — Present</span>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '0.2rem',
                    lineHeight: 1.45,
                  }}>
                    Engineered high-performance web applications and automated microservices with scalable database architectures.
                  </p>
                </div>
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                  }}>
                    <span>Senior Content Strategist • Atelier Media</span>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>2019 — 2022</span>
                  </div>
                </div>
              </div>

              {/* Section: Education & Skills (2-Column Mini Grid) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                borderTop: '1px solid rgba(216, 196, 172, 0.4)',
                paddingTop: '0.75rem',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: 'var(--color-burgundy)',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}>
                    Education
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
                    B.A. Communications & Design
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    Columbia University
                  </div>
                </div>

                <div>
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: 'var(--color-burgundy)',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem',
                  }}>
                    Expertise
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    Editorial Direction • Creative Strategy • Brand Identity • Typography
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Footer Tag */}
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            marginTop: '1rem',
          }}>
            Crafted with editorial precision • 2026
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form Card */}
        <div style={{
          padding: 'clamp(2rem, 5vw, 4.5rem)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            border: '1px solid rgba(216, 196, 172, 0.45)',
            boxShadow: 'var(--shadow-card)',
            padding: 'clamp(2rem, 4vw, 3rem)',
            width: '100%',
            maxWidth: '460px',
            position: 'relative',
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
