import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [layout, setLayout] = useState('standard');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/admin/templates');
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (err) {
      setNotification(`Error fetching admin templates: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setNotification('');
    try {
      await api.post('/api/templates', {
        name: name.trim(),
        layout,
        description: description.trim(),
      });
      setName('');
      setDescription('');
      setNotification('Template created successfully.');
      loadTemplates();
    } catch (err) {
      setNotification(`Failed to create template: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
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
        maxWidth: '1100px',
        width: '100%',
        margin: '2.5rem auto',
        padding: '0 clamp(1rem, 3vw, 2.5rem)',
        flex: 1,
      }}>
        {/* Page Header */}
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
            Template Management
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.5rem',
          }}>
            Admin interface to inspect, audit, and provision resume layout templates in MongoDB.
          </p>
        </div>

        {notification && (
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderLeft: '4px solid var(--color-burgundy)',
            borderRadius: '6px',
            padding: '0.85rem 1.25rem',
            marginBottom: '2rem',
            fontSize: '0.88rem',
            color: 'var(--color-burgundy)',
            boxShadow: 'var(--shadow-subtle)',
          }}>
            {notification}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '2.5rem',
          alignItems: 'start',
        }}>
          {/* Create Template Form */}
          <div style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(216, 196, 172, 0.55)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.35rem',
              color: 'var(--color-burgundy)',
              marginBottom: '1.25rem',
            }}>
              Provision New Template
            </h3>

            <form onSubmit={handleCreateTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.4rem' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Modern Minimalist"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.4rem' }}>
                  Layout Classification
                </label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    fontFamily: 'var(--font-sans)',
                    backgroundColor: '#FAF7F4',
                    border: '1px solid rgba(216, 196, 172, 0.7)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    color: 'var(--color-text-main)',
                    outline: 'none',
                  }}
                >
                  <option value="standard">standard (Professional ATS)</option>
                  <option value="creative">creative (Creative Editorial)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.4rem' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe design system and typography characteristics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-burgundy"
                style={{ marginTop: '0.5rem' }}
              >
                {submitting ? 'PROVISIONING...' : 'CREATE TEMPLATE'}
              </button>
            </form>
          </div>

          {/* Existing Templates Table / List */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.35rem',
              color: 'var(--color-burgundy)',
              marginBottom: '1.25rem',
            }}>
              All Templates ({templates.length})
            </h3>

            {loading ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Loading template records...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    style={{
                      backgroundColor: 'var(--color-white)',
                      borderRadius: '12px',
                      border: '1px solid rgba(216, 196, 172, 0.5)',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-burgundy)' }}>
                        {tpl.name}
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: tpl.layout === 'creative' ? 'rgba(77, 14, 19, 0.08)' : 'rgba(216, 196, 172, 0.35)',
                        color: tpl.layout === 'creative' ? 'var(--color-burgundy)' : 'var(--color-text-main)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}>
                        {tpl.layout}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {tpl.description || 'No description provided.'}
                    </p>

                    <div style={{ fontSize: '0.72rem', color: '#8C7A7B' }}>
                      ID: <code>{tpl._id}</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
