import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function TailorPage() {
  const [resumes, setResumes] = useState([]);
  const [tailorRecords, setTailorRecords] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // AI Tailoring states
  const [tailoredData, setTailoredData] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resumesList, tailorsList] = await Promise.all([
        api.get('/api/resumes').catch(() => []),
        api.get('/api/ai/tailor').catch(() => []),
      ]);

      if (Array.isArray(resumesList)) {
        setResumes(resumesList);
        if (resumesList.length > 0 && !selectedResumeId) {
          setSelectedResumeId(resumesList[0]._id);
        }
      }
      if (Array.isArray(tailorsList)) {
        setTailorRecords(tailorsList);
      }
    } catch (err) {
      setNotification({ type: 'error', message: `Failed to load data: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Generate Tailored Resume via Gemini
  const handleTailorWithAI = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedResumeId) {
      setNotification({ type: 'error', message: 'Please select an existing base resume first.' });
      return;
    }

    if (!jobDescription.trim()) {
      setNotification({ type: 'error', message: 'Please enter or paste the target job description.' });
      return;
    }

    setTailoring(true);
    setNotification(null);
    setTailoredData(null);

    try {
      const response = await api.post('/api/ai/tailor', {
        resume: selectedResumeId,
        jobDescription: jobDescription.trim(),
        action: 'tailor',
      });

      if (response && response.tailoredResume) {
        setTailoredData(response);
        setEditedTitle(response.suggestedTitle || `${response.originalTitle} - ${response.targetRole}`);
        setNotification({
          type: 'success',
          message: '✦ Tailored preview generated successfully! Review the tailored version below before saving.',
        });
      } else {
        throw new Error('AI tailoring response was empty.');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to tailor resume with AI. Please check your network and Gemini API key.',
      });
    } finally {
      setTailoring(false);
    }
  };

  // 2. Save as NEW Resume (preserving original untouched)
  const handleSaveAsNewResume = async () => {
    if (!tailoredData || !tailoredData.tailoredResume) return;

    setSaving(true);
    setNotification(null);

    try {
      const origResume = resumes.find((r) => r._id === selectedResumeId);
      const templateId =
        origResume?.template?._id ||
        (typeof origResume?.template === 'string' ? origResume.template : null) ||
        tailoredData.template?._id ||
        tailoredData.template;

      const finalTitle = editedTitle.trim() || tailoredData.suggestedTitle || `${origResume?.title || 'Resume'} - Tailored`;

      // 1. Create a brand NEW Resume document in MongoDB
      const newResumePayload = {
        title: finalTitle,
        template: templateId,
        style: origResume?.style || tailoredData.style || 'professional',
        personalDetails: tailoredData.tailoredResume.personalDetails || {},
        education: tailoredData.tailoredResume.education || [],
        experience: tailoredData.tailoredResume.experience || [],
        projects: tailoredData.tailoredResume.projects || [],
        skills: tailoredData.tailoredResume.skills || [],
        certifications: tailoredData.tailoredResume.certifications || [],
        achievements: tailoredData.tailoredResume.achievements || [],
        additionalInfo: tailoredData.tailoredResume.additionalInfo || {},
      };

      const createdResume = await api.post('/api/resumes', newResumePayload);

      // 2. Save Tailor record in MongoDB referencing original resume and new resume
      await api.post('/api/ai/tailor', {
        resume: selectedResumeId,
        jobDescription: jobDescription.trim(),
        tailoredResult: tailoredData.tailoringSummary || `Tailored for ${tailoredData.targetRole}`,
        newResume: createdResume._id,
      });

      // 3. Clear preview & notify user
      setTailoredData(null);
      setJobDescription('');
      setNotification({
        type: 'success',
        message: `Saved "${finalTitle}" as a new resume in MongoDB! Original resume "${origResume?.title}" remains unchanged.`,
        newResumeId: createdResume._id,
        newResumeTitle: finalTitle,
      });

      // 4. Reload resumes and records
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: `Error saving new resume: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // 3. Discard preview and keep original
  const handleKeepOriginal = () => {
    setTailoredData(null);
    setNotification({
      type: 'info',
      message: 'Original resume kept unchanged. Tailored preview was discarded.',
    });
  };

  const selectedBaseResume = resumes.find((r) => r._id === selectedResumeId);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-cream, #EEE4DA)',
        fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />

      <main
        style={{
          maxWidth: '1180px',
          width: '100%',
          margin: '2rem auto',
          padding: '0 clamp(1rem, 3vw, 2.5rem)',
          flex: 1,
        }}
      >
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #7A6F6D)',
              marginBottom: '0.4rem',
            }}
          >
            Position Targeting & Optimization
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: 'clamp(2.1rem, 3.8vw, 2.9rem)',
              color: 'var(--color-burgundy, #4D0E13)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Resume Tailoring Studio
          </h1>
          <p
            style={{
              fontSize: '0.98rem',
              color: 'var(--color-text-muted, #7A6F6D)',
              marginTop: '0.5rem',
              maxWidth: '680px',
              lineHeight: 1.55,
            }}
          >
            Select an existing resume and paste a target job description. Gemini AI realigns your genuine experience and keywords to target the role without fabricating facts or modifying your original resume.
          </p>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            style={{
              backgroundColor: notification.type === 'error' ? '#FFF2F2' : '#FFFFFF',
              borderLeft: `4px solid ${
                notification.type === 'error'
                  ? '#D32F2F'
                  : notification.type === 'info'
                  ? 'var(--color-sand, #D8C4AC)'
                  : 'var(--color-burgundy, #4D0E13)'
              }`,
              borderRadius: '6px',
              padding: '1rem 1.35rem',
              marginBottom: '2rem',
              fontSize: '0.9rem',
              color: notification.type === 'error' ? '#C62828' : 'var(--color-text-main, #24191A)',
              boxShadow: 'var(--shadow-subtle, 0 2px 8px rgba(36, 25, 26, 0.05))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>{notification.message}</div>
            {notification.newResumeId && (
              <Link
                to={`/builder/${notification.newResumeId}`}
                style={{
                  color: 'var(--color-burgundy, #4D0E13)',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  textDecoration: 'underline',
                }}
              >
                Open New Resume in Studio →
              </Link>
            )}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: Input Form & AI Tailored Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Input Form Card */}
            <div
              style={{
                backgroundColor: 'var(--color-white, #FFFFFF)',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid rgba(216, 196, 172, 0.55)',
                boxShadow: 'var(--shadow-card, 0 4px 20px rgba(36, 25, 26, 0.06))',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                  fontSize: '1.35rem',
                  color: 'var(--color-burgundy, #4D0E13)',
                  margin: '0 0 1.25rem 0',
                  fontWeight: 600,
                }}
              >
                Target Position Inputs
              </h2>

              {resumes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted, #7A6F6D)', marginBottom: '1rem' }}>
                    You don't have any resumes in your studio yet.
                  </p>
                  <Link
                    to="/create"
                    className="btn-burgundy"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    + Create Your First Resume
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleTailorWithAI} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Base Resume Selection */}
                  <div>
                    <label
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-main, #24191A)',
                        display: 'block',
                        marginBottom: '0.45rem',
                      }}
                    >
                      Base Resume
                    </label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => {
                        setSelectedResumeId(e.target.value);
                        setTailoredData(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)',
                        backgroundColor: '#FAF7F4',
                        border: '1px solid rgba(216, 196, 172, 0.7)',
                        borderRadius: '8px',
                        fontSize: '0.92rem',
                        color: 'var(--color-text-main, #24191A)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.title} {r.personalDetails?.professionalTitle ? `(${r.personalDetails.professionalTitle})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedBaseResume && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #7A6F6D)', marginTop: '0.35rem' }}>
                        Original candidate: <strong>{selectedBaseResume.personalDetails?.fullName || 'Untitled'}</strong> • {selectedBaseResume.experience?.length || 0} work positions • {selectedBaseResume.skills?.length || 0} skills
                      </div>
                    )}
                  </div>

                  {/* Target Job Description */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.45rem' }}>
                      <label
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--color-text-main, #24191A)',
                        }}
                      >
                        Target Job Description
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                        Paste posting requirements & keywords
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      placeholder="Paste the target job description, key responsibilities, preferred technologies, and company requirements here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)',
                        backgroundColor: '#FAF7F4',
                        border: '1px solid rgba(216, 196, 172, 0.7)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        color: 'var(--color-text-main, #24191A)',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {/* Action Button: Tailor with AI */}
                  <button
                    type="submit"
                    disabled={tailoring || !selectedResumeId || !jobDescription.trim()}
                    className="btn-burgundy"
                    style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.95rem 1.5rem',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      cursor: tailoring ? 'wait' : 'pointer',
                      opacity: tailoring ? 0.75 : 1,
                    }}
                  >
                    {tailoring ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid #FFFFFF',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        ALIGNING WITH GEMINI AI...
                      </>
                    ) : (
                      '✦ TAILOR WITH AI'
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* AI TAILORED PREVIEW (Shown after AI generation, before saving) */}
            {tailoredData && (
              <div
                style={{
                  backgroundColor: 'var(--color-white, #FFFFFF)',
                  borderRadius: '16px',
                  padding: '2rem',
                  border: '2px solid var(--color-burgundy, #4D0E13)',
                  boxShadow: '0 8px 30px rgba(77, 14, 19, 0.12)',
                  animation: 'fadeIn 0.3s ease-in-out',
                }}
              >
                {/* Preview Header & Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    borderBottom: '1px solid rgba(216, 196, 172, 0.5)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        backgroundColor: 'var(--color-burgundy, #4D0E13)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '4px',
                        display: 'inline-block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      ✦ AI TAILORED PREVIEW
                    </span>
                    <h3
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '1.5rem',
                        color: 'var(--color-burgundy, #4D0E13)',
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      Review Targeted Version
                    </h3>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                    Original: <strong>{tailoredData.originalTitle}</strong> (Unchanged)
                  </div>
                </div>

                {/* Tailoring Summary Notice */}
                {tailoredData.tailoringSummary && (
                  <div
                    style={{
                      backgroundColor: '#FAF5F1',
                      borderLeft: '3px solid var(--color-burgundy, #4D0E13)',
                      padding: '0.85rem 1.15rem',
                      borderRadius: '6px',
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      color: 'var(--color-text-main, #24191A)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <strong>Tailoring Strategy: </strong>
                    {tailoredData.tailoringSummary}
                  </div>
                )}

                {/* Editable New Resume Title Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-burgundy, #4D0E13)',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    New Resume Title
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--color-burgundy, #4D0E13)',
                      backgroundColor: '#FAF7F4',
                      border: '1px solid rgba(216, 196, 172, 0.8)',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #7A6F6D)', marginTop: '0.25rem' }}>
                    This will be saved as a separate document in MongoDB without altering the original.
                  </div>
                </div>

                {/* Section Preview: Professional Title & Summary */}
                <div
                  style={{
                    backgroundColor: '#FAF7F4',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em' }}>
                    Target Role / Professional Title
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-burgundy, #4D0E13)', margin: '0.25rem 0 0.85rem' }}>
                    {tailoredData.tailoredResume?.personalDetails?.professionalTitle || tailoredData.targetRole}
                  </div>

                  <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em' }}>
                    Tailored Professional Summary
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#24191A', margin: '0.25rem 0 0' }}>
                    {tailoredData.tailoredResume?.personalDetails?.summary}
                  </p>
                </div>

                {/* Section Preview: Prioritized Skills */}
                {Array.isArray(tailoredData.tailoredResume?.skills) && tailoredData.tailoredResume.skills.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                      Prioritized Skills (Genuine candidate skills ordered for target job)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {tailoredData.tailoredResume.skills.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: 'rgba(216, 196, 172, 0.4)',
                            color: 'var(--color-text-main, #24191A)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '4px',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Preview: Tailored Experience Highlights */}
                {Array.isArray(tailoredData.tailoredResume?.experience) && tailoredData.tailoredResume.experience.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
                      Tailored Experience Descriptions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {tailoredData.tailoredResume.experience.map((exp, idx) => (
                        <div key={idx} style={{ borderLeft: '2px solid rgba(216, 196, 172, 0.7)', paddingLeft: '0.75rem' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main, #24191A)' }}>
                            {exp.role} <span style={{ fontWeight: 500, color: '#666' }}>| {exp.company}</span>
                          </div>
                          <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#3A3A3A', margin: '0.25rem 0 0' }}>
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons: Save as New Resume vs Keep Original */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(216, 196, 172, 0.6)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSaveAsNewResume}
                    disabled={saving}
                    className="btn-burgundy"
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '0.9rem 1.5rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      cursor: saving ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {saving ? 'SAVING TO MONGODB...' : '✦ SAVE AS NEW RESUME'}
                  </button>

                  <button
                    type="button"
                    onClick={handleKeepOriginal}
                    disabled={saving}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1.5px solid var(--color-sand, #D8C4AC)',
                      color: 'var(--color-text-main, #24191A)',
                      padding: '0.9rem 1.5rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(216, 196, 172, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    KEEP ORIGINAL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Existing Tailoring Records Archive */}
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '1.35rem',
                color: 'var(--color-burgundy, #4D0E13)',
                margin: '0 0 1.25rem 0',
                fontWeight: 600,
              }}
            >
              Tailored Versions Archive ({tailorRecords.length})
            </h2>

            {loading ? (
              <p style={{ color: 'var(--color-text-muted, #7A6F6D)' }}>Loading tailoring records...</p>
            ) : tailorRecords.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--color-white, #FFFFFF)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(216, 196, 172, 0.7)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--color-text-muted, #7A6F6D)',
                }}
              >
                No tailored resumes generated yet. Select a base resume and paste a job description above to tailor your credentials.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {tailorRecords.map((item, idx) => {
                  const baseTitle = item.resume?.title || 'Base Resume';
                  const createdDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={item._id || idx}
                      style={{
                        backgroundColor: 'var(--color-white, #FFFFFF)',
                        borderRadius: '12px',
                        border: '1px solid rgba(216, 196, 172, 0.5)',
                        padding: '1.25rem',
                        boxShadow: 'var(--shadow-subtle, 0 2px 8px rgba(36, 25, 26, 0.05))',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--color-burgundy, #4D0E13)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Base: {baseTitle}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                          {createdDate}
                        </span>
                      </div>

                      {/* Target Job snippet */}
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted, #7A6F6D)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Target Job Description:
                      </div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: '#555',
                          marginBottom: '0.75rem',
                          backgroundColor: '#FAF7F4',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          maxHeight: '80px',
                          overflowY: 'auto',
                          lineHeight: 1.45,
                        }}
                      >
                        {item.jobDescription}
                      </div>

                      {/* Tailored Result / Summary */}
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-burgundy, #4D0E13)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Alignment Strategy:
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--color-text-main, #24191A)', lineHeight: 1.5, fontWeight: 500 }}>
                        {item.tailoredResult}
                      </div>

                      {/* If new resume was created, show link */}
                      {item.newResume && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(216, 196, 172, 0.4)' }}>
                          <Link
                            to={`/builder/${item.newResume._id || item.newResume}`}
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--color-burgundy, #4D0E13)',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            ✦ Open "{item.newResume.title || 'Tailored Resume'}" in Studio →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--color-text-muted, #7A6F6D)',
          fontSize: '0.8rem',
          borderTop: '1px solid rgba(216, 196, 172, 0.35)',
        }}
      >
        ResumeCraft • The Editorial Resume Studio • 2026
      </footer>

      {/* Embedded CSS for keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
