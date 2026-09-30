import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import A4ResumePreview from '../components/A4ResumePreview';
import { api } from '../services/api';

// Helper to resize and convert uploaded image files to lightweight Base64 data URLs
function processImageFile(file, maxWidth = 350, maxHeight = 350, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ResumeBuilderPage() {
  const { id } = useParams(); // If present, editing existing resume
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get current logged-in user to prefill name/email only
  const getInitialUser = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };
  const currentUser = getInitialUser();

  const [activeSection, setActiveSection] = useState('personal');
  const [styleType, setStyleType] = useState(searchParams.get('style') || 'professional');

  // New resumes start EMPTY except for the authenticated user's known name/email
  const [formData, setFormData] = useState({
    title: 'Untitled Resume',
    template: '',
    personalDetails: {
      fullName: currentUser?.name || '',
      professionalTitle: '',
      email: currentUser?.email || '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: '',
      photo: '',
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    additionalInfo: {
      languages: '',
      interests: '',
    },
    style: searchParams.get('style') || 'professional',
  });

  const [templates, setTemplates] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(!!id);

  // AI Suggestion State for inline modal/card
  const [aiState, setAiState] = useState({
    isOpen: false,
    sectionKey: '',
    sectionLabel: '',
    originalText: '',
    suggestedText: '',
    isLoading: false,
    errorMessage: '',
    targetSetter: null,
  });

  // =========================================================================
  // 1. DATA INITIALIZATION EFFECT (Separated from styleType to prevent reset bugs)
  // =========================================================================
  useEffect(() => {
    async function initBuilder() {
      try {
        setLoading(true);
        const tpls = await api.get('/api/templates');
        if (Array.isArray(tpls)) {
          setTemplates(tpls);
        }

        if (id) {
          // Edit Mode: fetch complete existing resume from MongoDB
          const existing = await api.get(`/api/resumes/${id}`);
          if (existing) {
            const savedStyle = existing.style === 'creative' ? 'creative' : 'professional';
            setStyleType(savedStyle);

            setFormData({
              title: existing.title || 'Untitled Resume',
              template: existing.template?._id || existing.template || '',
              personalDetails: {
                fullName: existing.personalDetails?.fullName || '',
                professionalTitle: existing.personalDetails?.professionalTitle || '',
                email: existing.personalDetails?.email || '',
                phone: existing.personalDetails?.phone || '',
                location: existing.personalDetails?.location || '',
                linkedin: existing.personalDetails?.linkedin || '',
                github: existing.personalDetails?.github || '',
                portfolio: existing.personalDetails?.portfolio || '',
                summary: existing.personalDetails?.summary || '',
                photo: existing.personalDetails?.photo || '',
              },
              education: Array.isArray(existing.education) ? existing.education : [],
              experience: Array.isArray(existing.experience) ? existing.experience : [],
              projects: Array.isArray(existing.projects) ? existing.projects : [],
              skills: Array.isArray(existing.skills) ? existing.skills : [],
              certifications: Array.isArray(existing.certifications) ? existing.certifications : [],
              achievements: Array.isArray(existing.achievements) ? existing.achievements : [],
              additionalInfo: {
                languages: existing.additionalInfo?.languages || '',
                interests: existing.additionalInfo?.interests || '',
              },
              style: savedStyle,
            });
          }
        } else {
          // New Mode: assign template from query or default template
          const queryTemplateId = searchParams.get('templateId');
          if (queryTemplateId) {
            setFormData((prev) => ({ ...prev, template: queryTemplateId }));
          } else if (Array.isArray(tpls) && tpls.length > 0) {
            const preferred = (searchParams.get('style') || 'professional') === 'creative'
              ? tpls.find((t) => t.layout === 'creative') || tpls[0]
              : tpls.find((t) => t.layout === 'standard') || tpls[0];
            setFormData((prev) => ({ ...prev, template: preferred._id }));
          }
        }
      } catch (err) {
        setNotification(`Error loading document: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    initBuilder();
    // Intentionally run only when ID changes; NEVER depend on styleType so switching styles does not reload/reset form data!
  }, [id]);

  // =========================================================================
  // STYLE SWITCHER HANDLER (Fix Bug 4: Changes style without resetting data)
  // =========================================================================
  const handleStyleChange = (newStyle) => {
    setStyleType(newStyle);
    setFormData((prev) => ({
      ...prev,
      style: newStyle,
    }));
  };

  // Personal Info change handler
  const handlePersonalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [field]: value,
      },
    }));
  };

  // Education list handlers
  const handleEduChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };
  const addEdu = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }],
    }));
  };
  const removeEdu = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Experience list handlers
  const handleExpChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };
  const addExp = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', duration: '', description: '' }],
    }));
  };
  const removeExp = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Projects list handlers
  const handleProjChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.projects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projects: updated };
    });
  };
  const addProj = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: '', technologies: '', description: '', link: '' }],
    }));
  };
  const removeProj = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  // Skills handlers
  const addSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      skills: [...new Set([...prev.skills, skillInput.trim()])],
    }));
    setSkillInput('');
  };
  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Certifications handlers
  const handleCertChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
  };
  const addCert = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', year: '', image: '' }],
    }));
  };
  const removeCert = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  // Image Upload Handlers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 350, 350, 0.85);
      handlePersonalChange('photo', dataUrl);
    } catch (err) {
      alert('Could not process the selected image. Please try another image.');
    }
  };

  const handleCertImageUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 400, 300, 0.85);
      handleCertChange(idx, 'image', dataUrl);
    } catch (err) {
      alert('Could not process the selected certificate image. Please try another image.');
    }
  };

  // Achievements handlers
  const handleAchChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.achievements];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, achievements: updated };
    });
  };
  const addAch = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, { title: '', description: '' }],
    }));
  };
  const removeAch = (index) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
  };

  // Additional Info handlers
  const handleAdditionalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        [field]: value,
      },
    }));
  };

  // =========================================================================
  // REAL INLINE AI SUGGESTION TRIGGER
  // =========================================================================
  const triggerAiImprovement = async ({ sectionKey, sectionLabel, currentText, onAccept }) => {
    const textToImprove = (currentText || '').trim();
    if (!textToImprove) {
      alert(`Please enter some text in ${sectionLabel} first, so AI can improve it.`);
      return;
    }

    setAiState({
      isOpen: true,
      sectionKey,
      sectionLabel,
      originalText: textToImprove,
      suggestedText: '',
      isLoading: true,
      errorMessage: '',
      targetSetter: onAccept,
    });

    try {
      const res = await api.post('/api/ai/suggestions', {
        text: textToImprove,
        section: sectionLabel,
      });

      if (res && res.suggestion) {
        setAiState((prev) => ({
          ...prev,
          suggestedText: res.suggestion,
          isLoading: false,
        }));
      } else {
        throw new Error(res?.message || 'AI suggestion could not be generated. Please try again.');
      }
    } catch (err) {
      setAiState((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err.message || 'AI suggestion could not be generated. Please try again.',
      }));
    }
  };

  const handleAcceptAiSuggestion = async () => {
    if (aiState.targetSetter && aiState.suggestedText) {
      // 1. Update form field state
      aiState.targetSetter(aiState.suggestedText);

      // 2. Save accepted suggestion record to backend if resume ID exists
      if (id) {
        try {
          await api.post('/api/ai/suggestions', {
            resume: id,
            input: aiState.originalText,
            suggestion: aiState.suggestedText,
          });
        } catch (e) {
          console.warn('Suggestion logging notice:', e.message);
        }
      }

      setNotification(`✦ Improved ${aiState.sectionLabel} with AI`);
    }

    // Close panel
    setAiState({
      isOpen: false,
      sectionKey: '',
      sectionLabel: '',
      originalText: '',
      suggestedText: '',
      isLoading: false,
      errorMessage: '',
      targetSetter: null,
    });
  };

  const handleRejectAiSuggestion = () => {
    setAiState({
      isOpen: false,
      sectionKey: '',
      sectionLabel: '',
      originalText: '',
      suggestedText: '',
      isLoading: false,
      errorMessage: '',
      targetSetter: null,
    });
  };

  // =========================================================================
  // SAVE COMPLETE RESUME DIRECTLY TO MONGODB (NO LOCALSTORAGE FOR PERSISTENCE)
  // =========================================================================
  const handleSave = async () => {
    setSaving(true);
    setNotification('');

    let currentTemplate = formData.template;
    if (!currentTemplate && templates.length > 0) {
      currentTemplate = templates[0]._id;
    }

    // Complete payload storing all sections in MongoDB
    const payload = {
      title: (formData.title || 'Untitled Resume').trim(),
      template: currentTemplate,
      personalDetails: {
        fullName: formData.personalDetails.fullName || '',
        professionalTitle: formData.personalDetails.professionalTitle || '',
        email: formData.personalDetails.email || '',
        phone: formData.personalDetails.phone || '',
        location: formData.personalDetails.location || '',
        linkedin: formData.personalDetails.linkedin || '',
        github: formData.personalDetails.github || '',
        portfolio: formData.personalDetails.portfolio || '',
        summary: formData.personalDetails.summary || '',
        photo: formData.personalDetails.photo || '',
      },
      education: formData.education.filter((e) => e.institution || e.degree || e.year),
      experience: formData.experience.filter((e) => e.company || e.role || e.duration || e.description),
      projects: formData.projects.filter((p) => p.name || p.technologies || p.description || p.link),
      skills: formData.skills.filter((s) => typeof s === 'string' && s.trim()),
      certifications: formData.certifications
        .filter((c) => c.name || c.issuer || c.year || c.image)
        .map((c) => ({
          name: c.name || '',
          issuer: c.issuer || '',
          year: c.year || '',
          image: c.image || '',
        })),
      achievements: formData.achievements.filter((a) => a.title || a.description),
      additionalInfo: {
        languages: formData.additionalInfo?.languages || '',
        interests: formData.additionalInfo?.interests || '',
      },
      style: styleType,
    };

    try {
      if (id) {
        // Update existing resume in MongoDB
        await api.put(`/api/resumes/${id}`, payload);
        setNotification('Complete resume saved successfully to MongoDB');
      } else {
        // Create new resume in MongoDB
        const created = await api.post('/api/resumes', payload);
        setNotification('Complete resume saved successfully to MongoDB');
        navigate(`/resume/${created._id}/edit`, { replace: true });
      }
    } catch (err) {
      setNotification(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // DOWNLOAD PDF
  const handleDownloadPDF = async () => {
    if (!id) {
      alert('Please save the resume first to generate the PDF.');
      return;
    }
    setDownloading(true);
    setNotification('Generating complete PDF...');
    try {
      const blob = await api.get(`/api/resumes/${id}/pdf`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(formData.title || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setNotification('PDF downloaded successfully.');
    } catch (err) {
      setNotification(`PDF download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const sectionsList = [
    { id: 'personal', label: '1. Personal Information' },
    { id: 'summary', label: '2. Professional Summary' },
    { id: 'education', label: '3. Education' },
    { id: 'experience', label: '4. Experience' },
    { id: 'projects', label: '5. Projects' },
    { id: 'skills', label: '6. Skills' },
    { id: 'certifications', label: '7. Certifications' },
    { id: 'achievements', label: '8. Achievements' },
    { id: 'additional', label: '9. Additional Information' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading Studio Document...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Top Action Bar */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderBottom: '1px solid rgba(216, 196, 172, 0.5)',
          padding: '0.75rem clamp(1rem, 3vw, 2.5rem)',
          position: 'sticky',
          top: '64px',
          zIndex: 90,
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Left: Document Title Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
            <Link to="/dashboard" style={{ color: 'var(--color-burgundy)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
              ← My Resumes
            </Link>
            <span style={{ color: 'rgba(216, 196, 172, 0.7)' }}>|</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Software Engineer Resume"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--color-burgundy)',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                width: 'auto',
                maxWidth: '340px',
              }}
              onFocus={(e) => (e.target.style.backgroundColor = '#FAF7F4')}
              onBlur={(e) => (e.target.style.backgroundColor = 'transparent')}
            />
          </div>

          {/* Center: Style Switcher (Does not reset form data) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FAF7F4',
              borderRadius: '6px',
              border: '1px solid rgba(216, 196, 172, 0.6)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => handleStyleChange('professional')}
              style={{
                padding: '0.4rem 0.95rem',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: styleType === 'professional' ? 'var(--color-burgundy)' : 'transparent',
                color: styleType === 'professional' ? 'var(--color-white)' : 'var(--color-text-main)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Professional (ATS)
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('creative')}
              style={{
                padding: '0.4rem 0.95rem',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: styleType === 'creative' ? 'var(--color-burgundy)' : 'transparent',
                color: styleType === 'creative' ? 'var(--color-white)' : 'var(--color-text-main)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Creative Editorial
            </button>
          </div>

          {/* Right: Save & Download Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-burgundy"
              style={{
                width: 'auto',
                padding: '0.55rem 1.4rem',
                fontSize: '0.82rem',
              }}
            >
              {saving ? 'SAVING...' : 'SAVE RESUME'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{
                padding: '0.55rem 1.1rem',
                backgroundColor: '#FAF7F4',
                border: '1px solid rgba(216, 196, 172, 0.7)',
                color: 'var(--color-text-main)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {downloading ? 'GENERATING...' : 'DOWNLOAD PDF'}
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            style={{
              maxWidth: '1440px',
              margin: '0.5rem auto 0',
              fontSize: '0.82rem',
              color: 'var(--color-burgundy)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>●</span> {notification}
          </div>
        )}
      </div>

      {/* Main 3-Column Desktop Layout */}
      <div
        style={{
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '1.5rem clamp(1rem, 2vw, 2rem)',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '220px minmax(360px, 500px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* ================= COLUMN 1: Left Sections Sidebar ================= */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '12px',
            border: '1px solid rgba(216, 196, 172, 0.5)',
            padding: '1.25rem 0.75rem',
            boxShadow: 'var(--shadow-subtle)',
            position: 'sticky',
            top: '140px',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              padding: '0 0.75rem 0.75rem',
              borderBottom: '1px solid rgba(216, 196, 172, 0.4)',
              marginBottom: '0.5rem',
            }}
          >
            Resume Sections
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sectionsList.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeSection === sec.id ? 'rgba(77, 14, 19, 0.08)' : 'transparent',
                  color: activeSection === sec.id ? 'var(--color-burgundy)' : 'var(--color-text-main)',
                  fontWeight: activeSection === sec.id ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= COLUMN 2: Middle Form Editor ================= */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: '12px',
            border: '1px solid rgba(216, 196, 172, 0.5)',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          {/* ========================================================================= */}
          {/* SECTION 1: Personal Information                                            */}
          {/* ========================================================================= */}
          {activeSection === 'personal' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', marginBottom: '1.25rem' }}>
                Personal Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Profile Photo Upload */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1rem',
                    backgroundColor: '#FAF7F4',
                    border: '1px dashed rgba(216, 196, 172, 0.8)',
                    borderRadius: '10px',
                    marginBottom: '0.25rem',
                  }}
                >
                  {formData.personalDetails.photo ? (
                    <img
                      src={formData.personalDetails.photo}
                      alt="Profile preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--color-burgundy, #4D0E13)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#EFEAE4',
                        border: '1.5px dashed #C8A49F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7A6F6D',
                        fontSize: '1.5rem',
                        flexShrink: 0,
                      }}
                    >
                      📷
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-burgundy, #4D0E13)', marginBottom: '0.2rem' }}>
                      Profile Photo
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #7A6F6D)', marginBottom: '0.5rem' }}>
                      Add a professional headshot to your resume preview and PDF.
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <label
                        style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.85rem',
                          backgroundColor: 'var(--color-burgundy, #4D0E13)',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        {formData.personalDetails.photo ? 'Change Photo' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          onChange={handlePhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {formData.personalDetails.photo && (
                        <button
                          type="button"
                          onClick={() => handlePersonalChange('photo', '')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#991B1B',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '0.35rem 0.5rem',
                          }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.personalDetails.fullName}
                    onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                    placeholder="e.g. Nandeni Tiwari"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    Target Role / Professional Title
                  </label>
                  <input
                    type="text"
                    value={formData.personalDetails.professionalTitle}
                    onChange={(e) => handlePersonalChange('professionalTitle', e.target.value)}
                    placeholder="e.g. Full Stack Developer / Software Engineer"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.personalDetails.email}
                      onChange={(e) => handlePersonalChange('email', e.target.value)}
                      placeholder="e.g. candidate@example.com"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.phone}
                      onChange={(e) => handlePersonalChange('phone', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    Location (City, Country)
                  </label>
                  <input
                    type="text"
                    value={formData.personalDetails.location}
                    onChange={(e) => handlePersonalChange('location', e.target.value)}
                    placeholder="e.g. Mumbai, India"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.linkedin}
                      onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                      GitHub
                    </label>
                    <input
                      type="text"
                      value={formData.personalDetails.github}
                      onChange={(e) => handlePersonalChange('github', e.target.value)}
                      placeholder="github.com/username"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    Portfolio / Website
                  </label>
                  <input
                    type="text"
                    value={formData.personalDetails.portfolio}
                    onChange={(e) => handlePersonalChange('portfolio', e.target.value)}
                    placeholder="portfolio.dev"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: Professional Summary                                            */}
          {/* ========================================================================= */}
          {activeSection === 'summary' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Professional Summary
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    triggerAiImprovement({
                      sectionKey: 'summary',
                      sectionLabel: 'Professional Summary',
                      currentText: formData.personalDetails.summary,
                      onAccept: (improved) => handlePersonalChange('summary', improved),
                    })
                  }
                  style={{
                    backgroundColor: 'rgba(77, 14, 19, 0.08)',
                    color: 'var(--color-burgundy)',
                    border: '1px solid rgba(77, 14, 19, 0.25)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  ✦ Improve with AI
                </button>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Write your summary naturally. Click <strong>[ ✦ Improve with AI ]</strong> to polish clarity, grammar, and professional impact while preserving your true facts.
              </p>

              <div>
                <textarea
                  rows={6}
                  value={formData.personalDetails.summary}
                  onChange={(e) => handlePersonalChange('summary', e.target.value)}
                  placeholder="e.g. Enthusiastic Computer Science student with hands-on experience building scalable web applications and REST APIs using React and Node.js. Passionate about clean code and modern system architecture..."
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: Education                                                       */}
          {/* ========================================================================= */}
          {activeSection === 'education' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Education
                </h3>
                <button
                  type="button"
                  onClick={addEdu}
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'rgba(77, 14, 19, 0.08)',
                    color: 'var(--color-burgundy)',
                    border: '1px solid rgba(77, 14, 19, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Degree
                </button>
              </div>

              {formData.education.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px dashed rgba(216, 196, 172, 0.8)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                    No education entries added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addEdu}
                    className="btn-burgundy"
                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    + Add Degree
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {formData.education.map((edu, idx) => (
                    <div key={idx} style={{ padding: '1.15rem', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px solid rgba(216, 196, 172, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Entry #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeEdu(idx)}
                          style={{ background: 'none', border: 'none', color: '#A33', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Degree / Major (e.g. B.Tech Computer Science)"
                          value={edu.degree}
                          onChange={(e) => handleEduChange(idx, 'degree', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Institution / University (e.g. ITM Skills University)"
                          value={edu.institution}
                          onChange={(e) => handleEduChange(idx, 'institution', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Year / Duration (e.g. 2025–2029)"
                          value={edu.year}
                          onChange={(e) => handleEduChange(idx, 'year', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: Experience                                                      */}
          {/* ========================================================================= */}
          {activeSection === 'experience' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Work Experience
                </h3>
                <button
                  type="button"
                  onClick={addExp}
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'rgba(77, 14, 19, 0.08)',
                    color: 'var(--color-burgundy)',
                    border: '1px solid rgba(77, 14, 19, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Experience
                </button>
              </div>

              {formData.experience.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px dashed rgba(216, 196, 172, 0.8)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                    No experience records added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addExp}
                    className="btn-burgundy"
                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    + Add Experience
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {formData.experience.map((exp, idx) => (
                    <div key={idx} style={{ padding: '1.15rem', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px solid rgba(216, 196, 172, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Role #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeExp(idx)}
                          style={{ background: 'none', border: 'none', color: '#A33', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Job Title / Role (e.g. Software Developer Intern)"
                          value={exp.role}
                          onChange={(e) => handleExpChange(idx, 'role', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Company / Organization (e.g. Tech Labs)"
                          value={exp.company}
                          onChange={(e) => handleExpChange(idx, 'company', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Duration / Dates (e.g. June 2024 – Present)"
                          value={exp.duration}
                          onChange={(e) => handleExpChange(idx, 'duration', e.target.value)}
                        />

                        {/* Description with Inline AI Improve Button */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                              Description / Key Responsibilities
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                triggerAiImprovement({
                                  sectionKey: `experience-${idx}`,
                                  sectionLabel: `Experience (${exp.role || 'Role'})`,
                                  currentText: exp.description,
                                  onAccept: (improved) => handleExpChange(idx, 'description', improved),
                                })
                              }
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-burgundy)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              ✦ Improve with AI
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="e.g. Built RESTful APIs using Express and Node.js. Implemented authentication and optimized database queries."
                            value={exp.description}
                            onChange={(e) => handleExpChange(idx, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: Projects                                                        */}
          {/* ========================================================================= */}
          {activeSection === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Featured Projects
                </h3>
                <button
                  type="button"
                  onClick={addProj}
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'rgba(77, 14, 19, 0.08)',
                    color: 'var(--color-burgundy)',
                    border: '1px solid rgba(77, 14, 19, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Project
                </button>
              </div>

              {formData.projects.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px dashed rgba(216, 196, 172, 0.8)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                    No projects added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addProj}
                    className="btn-burgundy"
                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    + Add Project
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {formData.projects.map((proj, idx) => (
                    <div key={idx} style={{ padding: '1.15rem', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px solid rgba(216, 196, 172, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Project #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeProj(idx)}
                          style={{ background: 'none', border: 'none', color: '#A33', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Project Name (e.g. ResumeCraft Studio)"
                          value={proj.name}
                          onChange={(e) => handleProjChange(idx, 'name', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Technologies (e.g. React, Node.js, Express, MongoDB)"
                          value={proj.technologies}
                          onChange={(e) => handleProjChange(idx, 'technologies', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Project Link (e.g. github.com/user/project or live demo)"
                          value={proj.link}
                          onChange={(e) => handleProjChange(idx, 'link', e.target.value)}
                        />

                        {/* Description with Inline AI Improve Button */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                              Project Outcome / Description
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                triggerAiImprovement({
                                  sectionKey: `project-${idx}`,
                                  sectionLabel: `Project (${proj.name || 'Project'})`,
                                  currentText: proj.description,
                                  onAccept: (improved) => handleProjChange(idx, 'description', improved),
                                })
                              }
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-burgundy)',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              ✦ Improve with AI
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            placeholder="e.g. Built an editorial resume platform with real-time A4 preview and inline AI assistance."
                            value={proj.description}
                            onChange={(e) => handleProjChange(idx, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 6: Skills                                                          */}
          {/* ========================================================================= */}
          {activeSection === 'skills' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Core Skills
                </h3>
              </div>

              <form onSubmit={addSkill} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Enter a skill (e.g. JavaScript, React, Node.js)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                />
                <button type="submit" className="btn-burgundy" style={{ width: 'auto', padding: '0.6rem 1.25rem', fontSize: '0.8rem' }}>
                  Add
                </button>
              </form>

              {formData.skills.length === 0 ? (
                <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  No skills entered yet. Type a skill above and press Add.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#FAF7F4',
                        border: '1px solid rgba(216, 196, 172, 0.7)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        style={{ background: 'none', border: 'none', color: '#A33', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 7: Certifications                                                  */}
          {/* ========================================================================= */}
          {activeSection === 'certifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Certifications
                </h3>
                <button
                  type="button"
                  onClick={addCert}
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'rgba(77, 14, 19, 0.08)',
                    color: 'var(--color-burgundy)',
                    border: '1px solid rgba(77, 14, 19, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Certification
                </button>
              </div>

              {formData.certifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px dashed rgba(216, 196, 172, 0.8)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                    No certifications added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addCert}
                    className="btn-burgundy"
                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    + Add Certification
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.certifications.map((cert, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px solid rgba(216, 196, 172, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Certification #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCert(idx)}
                          style={{ background: 'none', border: 'none', color: '#A33', cursor: 'pointer', fontSize: '0.78rem' }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Certification Name (e.g. AWS Certified Solutions Architect)"
                          value={cert.name || ''}
                          onChange={(e) => handleCertChange(idx, 'name', e.target.value)}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Issuing Organization (e.g. Amazon Web Services)"
                            value={cert.issuer || ''}
                            onChange={(e) => handleCertChange(idx, 'issuer', e.target.value)}
                          />
                          <input
                            type="text"
                            placeholder="Year (e.g. 2024)"
                            value={cert.year || ''}
                            onChange={(e) => handleCertChange(idx, 'year', e.target.value)}
                          />
                        </div>

                        {/* Certificate Image / Badge Upload */}
                        <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {cert.image ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <img
                                src={cert.image}
                                alt="Certificate thumbnail"
                                style={{
                                  maxHeight: '36px',
                                  maxWidth: '80px',
                                  objectFit: 'contain',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(216, 196, 172, 0.8)',
                                  backgroundColor: '#FFFFFF',
                                  padding: '2px',
                                }}
                              />
                              <label
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--color-burgundy, #4D0E13)',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                }}
                              >
                                Change Image
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/jpg"
                                  onChange={(e) => handleCertImageUpload(idx, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleCertChange(idx, 'image', '')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#991B1B',
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                  padding: '0.2rem',
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.65rem',
                                backgroundColor: '#FFFFFF',
                                border: '1px dashed rgba(216, 196, 172, 0.8)',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                color: 'var(--color-burgundy, #4D0E13)',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              <span>🏅</span> Add Certificate Image / Badge
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                onChange={(e) => handleCertImageUpload(idx, e)}
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 8: Achievements                                                    */}
          {/* ========================================================================= */}
          {activeSection === 'achievements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', margin: 0 }}>
                  Key Achievements
                </h3>
                <button
                  type="button"
                  onClick={addAch}
                  style={{
                    padding: '0.4rem 0.85rem',
                    backgroundColor: 'rgba(77, 14, 19, 0.08)',
                    color: 'var(--color-burgundy)',
                    border: '1px solid rgba(77, 14, 19, 0.2)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Achievement
                </button>
              </div>

              {formData.achievements.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px dashed rgba(216, 196, 172, 0.8)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 1rem' }}>
                    No achievements added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addAch}
                    className="btn-burgundy"
                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                  >
                    + Add Achievement
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.achievements.map((ach, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: '#FAF7F4', borderRadius: '8px', border: '1px solid rgba(216, 196, 172, 0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Achievement #{idx + 1}</span>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() =>
                              triggerAiImprovement({
                                sectionKey: `achievement-${idx}`,
                                sectionLabel: `Achievement (${ach.title || 'Achievement'})`,
                                currentText: ach.description || ach.title,
                                onAccept: (improved) => handleAchChange(idx, 'description', improved),
                              })
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-burgundy)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✦ Improve with AI
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAch(idx)}
                            style={{ background: 'none', border: 'none', color: '#A33', cursor: 'pointer', fontSize: '0.74rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Title / Honor (e.g. 1st Place at National Hackathon)"
                          value={ach.title || ''}
                          onChange={(e) => handleAchChange(idx, 'title', e.target.value)}
                        />
                        <textarea
                          rows={2}
                          placeholder="Details of the achievement..."
                          value={ach.description || ''}
                          onChange={(e) => handleAchChange(idx, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 9: Additional Information                                          */}
          {/* ========================================================================= */}
          {activeSection === 'additional' && (
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-burgundy)', marginBottom: '1.25rem' }}>
                Additional Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    Languages
                  </label>
                  <input
                    type="text"
                    value={formData.additionalInfo?.languages || ''}
                    onChange={(e) => handleAdditionalChange('languages', e.target.value)}
                    placeholder="e.g. English (Fluent), Hindi (Native), Spanish (Basic)"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    Interests & Activities
                  </label>
                  <input
                    type="text"
                    value={formData.additionalInfo?.interests || ''}
                    onChange={(e) => handleAdditionalChange('interests', e.target.value)}
                    placeholder="e.g. Open Source Contribution, Competitive Programming, Tech Writing"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMN 3: Live A4 Resume Preview ================= */}
        <div
          style={{
            position: 'sticky',
            top: '140px',
            maxHeight: 'calc(100vh - 160px)',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Live A4 Preview</span>
            <span style={{ color: 'var(--color-burgundy)' }}>
              {styleType === 'creative' ? 'Creative Editorial' : 'Professional ATS'}
            </span>
          </div>

          <A4ResumePreview data={formData} styleType={styleType} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INLINE AI SUGGESTION MODAL / CARD                                         */}
      {/* ========================================================================= */}
      {aiState.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(36, 25, 26, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.25rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: '14px',
              border: '1.5px solid var(--color-burgundy)',
              boxShadow: '0 18px 45px rgba(77, 14, 19, 0.22)',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(216, 196, 172, 0.5)',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-burgundy)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>✦</span> ResumeCraft Suggestion
              </div>

              <button
                type="button"
                onClick={handleRejectAiSuggestion}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Loading State */}
            {aiState.isLoading ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <div
                  style={{
                    display: 'inline-block',
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(77, 14, 19, 0.2)',
                    borderTopColor: 'var(--color-burgundy)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginBottom: '1rem',
                  }}
                />
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-burgundy)' }}>
                  Crafting your suggestion...
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Analyzing clarity, action verbs, and impact without inventing facts.
                </p>
              </div>
            ) : aiState.errorMessage ? (
              /* Error State */
              <div>
                <div style={{ padding: '1rem', backgroundColor: '#FDF2F2', borderRadius: '8px', color: '#991B1B', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                  <strong>Notice:</strong> {aiState.errorMessage}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleRejectAiSuggestion}
                    className="btn-burgundy"
                    style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            ) : (
              /* Actual Suggestion Comparison Box */
              <div>
                {/* Current Text */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Current
                  </div>
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: '#FAF7F4',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      color: '#4A3B32',
                      lineHeight: 1.5,
                      border: '1px solid rgba(216, 196, 172, 0.5)',
                    }}
                  >
                    {aiState.originalText}
                  </div>
                </div>

                {/* Suggested Text */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-burgundy)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Suggested
                  </div>
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'rgba(77, 14, 19, 0.04)',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: '#24191A',
                      lineHeight: 1.55,
                      border: '1px solid rgba(77, 14, 19, 0.25)',
                    }}
                  >
                    {aiState.suggestedText}
                  </div>
                </div>

                {/* Action Buttons: KEEP ORIGINAL or ACCEPT */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={handleRejectAiSuggestion}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#FAF7F4',
                      border: '1px solid rgba(216, 196, 172, 0.7)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--color-text-main)',
                      cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    KEEP ORIGINAL
                  </button>

                  <button
                    type="button"
                    onClick={handleAcceptAiSuggestion}
                    className="btn-burgundy"
                    style={{
                      width: 'auto',
                      padding: '0.65rem 1.6rem',
                      fontSize: '0.82rem',
                      letterSpacing: '0.04em',
                    }}
                  >
                    ACCEPT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
