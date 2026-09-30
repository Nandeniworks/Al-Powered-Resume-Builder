import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import A4ResumePreview from '../components/A4ResumePreview';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SharePage() {
  const { shareId } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSharedResume() {
      try {
        setLoading(true);
        // Public endpoint - does NOT require JWT
        const res = await fetch(`${BASE_URL}/api/share/${shareId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Shared document not found');
        }
        setShareData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      loadSharedResume();
    }
  }, [shareId]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading shared document...</p>
      </div>
    );
  }

  if (error || !shareData?.resume) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-cream)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-burgundy)', marginBottom: '1rem' }}>
          Document Unavailable
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: '400px' }}>
          This shared resume link may have expired or does not exist.
        </p>
        <Link to="/" className="btn-burgundy" style={{ width: 'auto', textDecoration: 'none', padding: '0.8rem 1.75rem' }}>
          VISIT RESUMECRAFT
        </Link>
      </div>
    );
  }

  const resume = shareData.resume;
  const styleType = resume?.style || (resume?.template?.layout === 'standard' ? 'professional' : 'creative');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-cream)',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Public Bar */}
      <header style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid rgba(216, 196, 172, 0.5)',
        padding: '1rem clamp(1rem, 3vw, 2.5rem)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-burgundy)', fontWeight: 700 }}>
                ResumeCraft
              </div>
            </Link>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Public Document Viewer
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleCopy}
              className="btn-burgundy"
              style={{
                width: 'auto',
                padding: '0.55rem 1.25rem',
                fontSize: '0.8rem',
              }}
            >
              {copied ? 'LINK COPIED ✓' : 'COPY LINK'}
            </button>
            <Link
              to="/register"
              style={{
                padding: '0.55rem 1.1rem',
                backgroundColor: '#FAF7F4',
                border: '1px solid rgba(216, 196, 172, 0.7)',
                color: 'var(--color-text-main)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              CREATE YOUR OWN
            </Link>
          </div>
        </div>
      </header>

      {/* Main A4 Document View */}
      <main style={{
        maxWidth: '850px',
        width: '100%',
        margin: '3rem auto',
        padding: '0 1rem',
        flex: 1,
      }}>
        <A4ResumePreview data={resume} styleType={styleType} />
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
