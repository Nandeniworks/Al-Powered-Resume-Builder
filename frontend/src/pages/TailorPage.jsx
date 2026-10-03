import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../services/api';

export default function TailorPage() {
  const [resumes, setResumes] = useState([]);
  const [tailorRecords, setTailorRecords] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  // ATS Scoring states
  const [atsData, setAtsData] = useState(null);
  const [calculatingATS, setCalculatingATS] = useState(false);

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

  // 0. Calculate Deterministic ATS Score
  const handleCalculateATS = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedResumeId) {
      setNotification({ type: 'error', message: 'Please select an existing base resume first.' });
      return;
    }

    if (!jobDescription.trim()) {
      setNotification({ type: 'error', message: 'Please enter or paste the target job description.' });
      return;
    }

    setCalculatingATS(true);
    setNotification(null);

    try {
      const response = await api.post('/api/ai/ats-score', {
        resume: selectedResumeId,
        jobDescription: jobDescription.trim(),
      });

      if (response && typeof response.score === 'number') {
        setAtsData(response);
        setNotification({
          type: 'success',
          message: `✦ ATS Analysis Complete: ${response.score}% match (${response.matchedKeywords.length}/${response.totalKeywords} target keywords matched).`,
        });
      } else {
        throw new Error('ATS calculation response was incomplete.');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to calculate ATS score.',
      });
    } finally {
      setCalculatingATS(false);
    }
  };

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
          message: `✦ AI tailored version generated for "${response.targetRole}"! Review the substantive content enhancements below before saving.`,
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

      const finalTitle = editedTitle.trim() || tailoredData.suggestedTitle || `${origResume?.title || 'Resume'} - ${tailoredData.targetRole}`;

      // 1. Create brand NEW Resume document in MongoDB
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

      // 2. Save Tailor record in MongoDB referencing original resume, target role, and new resume
      await api.post('/api/ai/tailor', {
        resume: selectedResumeId,
        jobDescription: jobDescription.trim(),
        targetRole: tailoredData.targetRole,
        tailoredResult: tailoredData.tailoringSummary || `Tailored for ${tailoredData.targetRole}`,
        newResume: createdResume._id,
      });

      // 3. Clear preview & notify user
      setTailoredData(null);
      setJobDescription('');
      setNotification({
        type: 'success',
        message: `Saved "${finalTitle}" as a new resume in MongoDB! Original resume "${origResume?.title}" remains completely unchanged.`,
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
      message: 'Original resume kept completely unchanged. Tailored preview was discarded.',
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
              maxWidth: '720px',
              lineHeight: 1.55,
            }}
          >
            Select an existing resume and paste a target job description. Gemini AI thoroughly tailors your professional title, summary, experience descriptions, project highlights, and skills to target the role — without inventing facts or modifying your original resume.
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
                Open New Tailored Resume in Studio →
              </Link>
            )}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: Input Form & Detailed AI Tailored Preview */}
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
                        Candidate: <strong>{selectedBaseResume.personalDetails?.fullName || 'Untitled'}</strong> • Current Title: <strong>{selectedBaseResume.personalDetails?.professionalTitle || 'None'}</strong> • {selectedBaseResume.experience?.length || 0} work positions • {selectedBaseResume.projects?.length || 0} projects
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
                      placeholder="e.g. UI/UX Developer looking for experience with interactive interfaces, responsive design, frontend development, user-focused applications, and collaborative design implementation..."
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

                  {/* Action Buttons: Calculate ATS Score & Tailor with AI */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleCalculateATS}
                      disabled={calculatingATS || !selectedResumeId || !jobDescription.trim()}
                      style={{
                        flex: '1 1 200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.95rem 1.25rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: calculatingATS ? 'wait' : 'pointer',
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid var(--color-burgundy, #4D0E13)',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        opacity: calculatingATS || !selectedResumeId || !jobDescription.trim() ? 0.6 : 1,
                      }}
                    >
                      {calculatingATS ? (
                        <>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '14px',
                              height: '14px',
                              border: '2px solid rgba(77,14,19,0.3)',
                              borderTop: '2px solid var(--color-burgundy, #4D0E13)',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                            }}
                          />
                          CALCULATING ATS SCORE...
                        </>
                      ) : (
                        '✦ CALCULATE ATS SCORE'
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={tailoring || !selectedResumeId || !jobDescription.trim()}
                      className="btn-burgundy"
                      style={{
                        flex: '1 1 200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.95rem 1.25rem',
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
                          ANALYZING & TAILORING RESUME...
                        </>
                      ) : (
                        '✦ TAILOR WITH AI'
                      )}
                    </button>
                  </div>

                  {/* ATS ANALYSIS RESULTS PANEL */}
                  {atsData && (
                    <div
                      style={{
                        marginTop: '1.5rem',
                        backgroundColor: '#FAF7F4',
                        border: '1.5px solid rgba(77, 14, 19, 0.25)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: 'var(--shadow-subtle, 0 2px 8px rgba(36, 25, 26, 0.05))',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: 'var(--color-burgundy, #4D0E13)',
                            }}
                          >
                            ATS Compatibility Score
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                            Deterministic keyword analysis ({atsData.totalKeywords} target keywords found)
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.45rem 1.15rem',
                            borderRadius: '999px',
                            backgroundColor:
                              atsData.score >= 80 ? '#E8F5E9' : atsData.score >= 60 ? '#FFF8E1' : '#FFEBEE',
                            color: atsData.score >= 80 ? '#2E7D32' : atsData.score >= 60 ? '#B78103' : '#C62828',
                            fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            border: `1px solid ${
                              atsData.score >= 80 ? '#A5D6A7' : atsData.score >= 60 ? '#FFE082' : '#FFCDD2'
                            }`,
                          }}
                        >
                          <span>{atsData.score}%</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {atsData.score >= 80 ? 'Strong Match' : atsData.score >= 60 ? 'Moderate' : 'Low Match'}
                          </span>
                        </div>
                      </div>

                      {/* Matched Keywords */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: '#2E7D32',
                            marginBottom: '0.4rem',
                          }}
                        >
                          ✓ Matched Keywords ({atsData.matchedKeywords.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {atsData.matchedKeywords.length > 0 ? (
                            atsData.matchedKeywords.map((kw, i) => (
                              <span
                                key={i}
                                style={{
                                  backgroundColor: '#E8F5E9',
                                  color: '#1B5E20',
                                  border: '1px solid #C8E6C9',
                                  borderRadius: '6px',
                                  padding: '0.2rem 0.6rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                ✓ {kw}
                              </span>
                            ))
                          ) : (
                            <span
                              style={{
                                fontSize: '0.82rem',
                                color: 'var(--color-text-muted, #7A6F6D)',
                                fontStyle: 'italic',
                              }}
                            >
                              No target keywords matched yet.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Missing Keywords */}
                      <div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: 'var(--color-burgundy, #4D0E13)',
                            marginBottom: '0.4rem',
                          }}
                        >
                          ✕ Missing Keywords ({atsData.missingKeywords.length})
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {atsData.missingKeywords.length > 0 ? (
                            atsData.missingKeywords.map((kw, i) => (
                              <span
                                key={i}
                                style={{
                                  backgroundColor: 'rgba(77, 14, 19, 0.08)',
                                  color: 'var(--color-burgundy, #4D0E13)',
                                  border: '1px solid rgba(77, 14, 19, 0.2)',
                                  borderRadius: '6px',
                                  padding: '0.2rem 0.6rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                ✕ {kw}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.82rem', color: '#2E7D32', fontWeight: 600 }}>
                              ✦ Excellent! All target job keywords are covered in your resume.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                      Tailored for {tailoredData.targetRole}
                    </h3>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                    Original: <strong>{tailoredData.originalTitle}</strong> (Unchanged)
                  </div>
                </div>

                {/* Tailoring Summary Strategy */}
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
                    Will be created as a new document in MongoDB. The original resume is never overwritten.
                  </div>
                </div>

                {/* 1. PROFESSIONAL TITLE COMPARISON */}
                <div
                  style={{
                    backgroundColor: '#FAF7F4',
                    borderRadius: '8px',
                    padding: '1.15rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em' }}>
                      Professional Title
                    </span>
                    {tailoredData.originalContent?.professionalTitle && (
                      <span style={{ fontSize: '0.72rem', color: '#888' }}>
                        Original: {tailoredData.originalContent.professionalTitle}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-burgundy, #4D0E13)' }}>
                    {tailoredData.tailoredResume?.personalDetails?.professionalTitle || tailoredData.targetRole}
                  </div>
                </div>

                {/* 2. PROFESSIONAL SUMMARY COMPARISON */}
                <div
                  style={{
                    backgroundColor: '#FAF7F4',
                    borderRadius: '8px',
                    padding: '1.15rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                    Tailored Professional Summary (Repositioned for target job)
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#24191A', margin: 0, fontWeight: 500 }}>
                    {tailoredData.tailoredResume?.personalDetails?.summary}
                  </p>
                  {tailoredData.originalContent?.summary && (
                    <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(216, 196, 172, 0.6)', fontSize: '0.78rem', color: '#777', lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 600 }}>Original Summary: </span>
                      {tailoredData.originalContent.summary}
                    </div>
                  )}
                </div>

                {/* 3. PRIORITIZED SKILLS */}
                {Array.isArray(tailoredData.tailoredResume?.skills) && tailoredData.tailoredResume.skills.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                      Prioritized Skills (Ordered for relevance to {tailoredData.targetRole})
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

                {/* 4. TAILORED EXPERIENCE */}
                {Array.isArray(tailoredData.tailoredResume?.experience) && tailoredData.tailoredResume.experience.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
                      Tailored Experience (Enhanced with relevant action verbs & responsibilities)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {tailoredData.tailoredResume.experience.map((exp, idx) => (
                        <div key={idx} style={{ borderLeft: '2.5px solid var(--color-burgundy, #4D0E13)', paddingLeft: '0.85rem', backgroundColor: '#FAF7F4', padding: '0.75rem', borderRadius: '4px' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main, #24191A)' }}>
                            {exp.role} <span style={{ fontWeight: 500, color: '#666' }}>| {exp.company}</span>
                            {exp.duration && <span style={{ float: 'right', fontSize: '0.76rem', color: '#888' }}>{exp.duration}</span>}
                          </div>
                          <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#3A3A3A', margin: '0.35rem 0 0' }}>
                            {exp.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. TAILORED PROJECTS */}
                {Array.isArray(tailoredData.tailoredResume?.projects) && tailoredData.tailoredResume.projects.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #7A6F6D)', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
                      Tailored Projects (Emphasizing relevant design, features & technologies)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {tailoredData.tailoredResume.projects.map((proj, idx) => (
                        <div key={idx} style={{ borderLeft: '2.5px solid var(--color-sand, #D8C4AC)', paddingLeft: '0.85rem', backgroundColor: '#FAF7F4', padding: '0.75rem', borderRadius: '4px' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main, #24191A)' }}>
                            {proj.name}
                            {proj.technologies && <span style={{ fontSize: '0.76rem', color: 'var(--color-burgundy, #4D0E13)', marginLeft: '0.4rem', fontWeight: 600 }}>({proj.technologies})</span>}
                          </div>
                          <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#3A3A3A', margin: '0.35rem 0 0' }}>
                            {proj.description}
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
                          marginBottom: '0.45rem',
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

                      {/* Target Role Tag */}
                      {item.targetRole && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(77, 14, 19, 0.08)',
                              color: 'var(--color-burgundy, #4D0E13)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            🎯 Target: {item.targetRole}
                          </span>
                        </div>
                      )}

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
