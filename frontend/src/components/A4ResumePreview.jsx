import React from 'react';
import { normalizeUrl, cleanDisplayUrl } from '../utils/urlUtils';

export default function A4ResumePreview({ data, styleType }) {
  // Use resume's saved style if not explicitly passed
  const effectiveStyle = styleType || data?.style || 'professional';
  const isCreative = effectiveStyle === 'creative';

  const personal = data?.personalDetails || {};
  const photo = personal.photo || '';
  const fullName = (personal.fullName || '').trim();
  const professionalTitle = (personal.professionalTitle || personal.title || '').trim();
  const email = (personal.email || '').trim();
  const phone = (personal.phone || '').trim();
  const location = (personal.location || '').trim();
  const linkedin = (personal.linkedin || '').trim();
  const github = (personal.github || '').trim();
  const portfolio = (personal.portfolio || '').trim();
  const summary = (personal.summary || '').trim();

  // Filter out blank repeatable entries
  const education = (Array.isArray(data?.education) ? data.education : []).filter(
    (e) => (e.institution && e.institution.trim()) || (e.degree && e.degree.trim()) || (e.year && e.year.trim())
  );

  const experience = (Array.isArray(data?.experience) ? data.experience : []).filter(
    (e) => (e.company && e.company.trim()) || (e.role && e.role.trim()) || (e.description && e.description.trim()) || (e.duration && e.duration.trim())
  );

  const projects = (Array.isArray(data?.projects) ? data.projects : []).filter(
    (p) => (p.name && p.name.trim()) || (p.description && p.description.trim()) || (p.technologies && p.technologies.trim()) || (p.link && p.link.trim())
  );

  const skills = (Array.isArray(data?.skills) ? data.skills : []).filter((s) => typeof s === 'string' && s.trim());

  const certifications = (Array.isArray(data?.certifications) ? data.certifications : []).filter(
    (c) => (typeof c === 'string' ? c.trim() : (c.name || c.title || c.issuer || c.image || '').trim())
  );

  const achievements = (Array.isArray(data?.achievements) ? data.achievements : []).filter(
    (a) => (typeof a === 'string' ? a.trim() : (a.title || a.description || '').trim())
  );

  const additional = data?.additionalInfo || data?.additional || {};
  const languages = (additional.languages || '').trim();
  const interests = (additional.interests || '').trim();
  const hasAdditional = languages || interests;

  // Check if document is completely blank
  const hasAnyContent =
    photo ||
    fullName ||
    professionalTitle ||
    email ||
    phone ||
    location ||
    linkedin ||
    github ||
    portfolio ||
    summary ||
    education.length > 0 ||
    experience.length > 0 ||
    projects.length > 0 ||
    skills.length > 0 ||
    certifications.length > 0 ||
    achievements.length > 0 ||
    hasAdditional;

  // Build clean, functional contact items list
  const contactItems = [];
  if (email) contactItems.push({ type: 'email', label: email, href: `mailto:${email}` });
  if (phone) contactItems.push({ type: 'phone', label: phone, href: `tel:${phone.replace(/[^+\d]/g, '')}` });
  if (location) contactItems.push({ type: 'text', label: location, href: null });
  if (linkedin) contactItems.push({ type: 'link', label: cleanDisplayUrl(linkedin), href: normalizeUrl(linkedin) });
  if (github) contactItems.push({ type: 'link', label: cleanDisplayUrl(github), href: normalizeUrl(github) });
  if (portfolio) contactItems.push({ type: 'link', label: cleanDisplayUrl(portfolio), href: normalizeUrl(portfolio) });

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '820px',
        margin: '0 auto',
        backgroundColor: '#FFFFFF',
        minHeight: '1050px',
        boxShadow: '0 8px 30px rgba(36, 25, 26, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        border: isCreative ? '1.5px solid rgba(200, 164, 159, 0.5)' : '1px solid #D5D5D5',
        borderRadius: '2px',
        padding: 'clamp(2rem, 4vw, 3.25rem)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box',
        textAlign: 'left',
        color: '#24191A',
        fontFamily: 'var(--font-sans, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      <div>
        {/* If completely empty, show subtle hint */}
        {!hasAnyContent && (
          <div
            style={{
              padding: '7rem 2rem',
              textAlign: 'center',
              color: 'var(--color-text-muted, #7A6F6D)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                fontSize: '1.45rem',
                color: 'var(--color-burgundy, #4D0E13)',
                marginBottom: '0.5rem',
                fontWeight: 600,
              }}
            >
              Ready for your information
            </div>
            <p style={{ fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.55 }}>
              Enter your details in the editor on the left. Your complete professional A4 resume will generate here in real time.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STYLE 1: PROFESSIONAL ATS-FRIENDLY RESUME                                 */}
        {/* ========================================================================= */}
        {!isCreative && hasAnyContent && (
          <div>
            {/* Professional Header */}
            <div
              style={{
                borderBottom: '2px solid #24191A',
                paddingBottom: '0.85rem',
                marginBottom: '1.35rem',
                display: photo ? 'flex' : 'block',
                alignItems: 'center',
                gap: photo ? '1.25rem' : '0',
                textAlign: photo ? 'left' : 'center',
              }}
            >
              {photo && (
                <img
                  src={photo}
                  alt={fullName || 'Profile Photo'}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #24191A',
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontSize: '1.95rem',
                    fontWeight: 700,
                    color: '#24191A',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    margin: 0,
                    lineHeight: 1.15,
                  }}
                >
                  {fullName || 'YOUR NAME'}
                </h1>

                {professionalTitle && (
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--color-burgundy, #4D0E13)',
                      marginTop: '0.3rem',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {professionalTitle}
                  </div>
                )}

                {contactItems.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: photo ? 'flex-start' : 'center',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.65rem',
                      fontSize: '0.82rem',
                      color: '#4A4A4A',
                      marginTop: '0.5rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {contactItems.map((item, idx) => (
                      <React.Fragment key={idx}>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.type === 'link' ? '_blank' : undefined}
                            rel={item.type === 'link' ? 'noopener noreferrer' : undefined}
                            style={{
                              color: item.type === 'link' ? 'var(--color-burgundy, #4D0E13)' : '#4A4A4A',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {item.label}
                          </a>
                        ) : (
                          <span>{item.label}</span>
                        )}
                        {idx < contactItems.length - 1 && <span style={{ color: '#999' }}>•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 1. PROFESSIONAL SUMMARY */}
            {summary && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Professional Summary
                </div>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: '#333333', margin: 0 }}>
                  {summary}
                </p>
              </div>
            )}

            {/* 2. EDUCATION */}
            {education.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.65rem',
                  }}
                >
                  Education
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {education.map((edu, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#24191A' }}>
                          {edu.degree || 'Degree'}
                        </span>
                        {edu.institution && (
                          <span style={{ fontSize: '0.86rem', color: '#555', marginLeft: '0.4rem' }}>
                            — {edu.institution}
                          </span>
                        )}
                      </div>
                      {edu.year && (
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#666' }}>
                          {edu.year}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. EXPERIENCE */}
            {experience.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.65rem',
                  }}
                >
                  Experience
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {experience.map((exp, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#24191A' }}>
                            {exp.role || 'Role'}
                          </span>
                          {exp.company && (
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#555', marginLeft: '0.4rem' }}>
                              | {exp.company}
                            </span>
                          )}
                        </div>
                        {exp.duration && (
                          <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 500 }}>
                            {exp.duration}
                          </span>
                        )}
                      </div>
                      {exp.description && (
                        <p style={{ fontSize: '0.86rem', lineHeight: 1.5, color: '#3A3A3A', margin: '0.3rem 0 0' }}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PROJECTS */}
            {projects.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.65rem',
                  }}
                >
                  Projects
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {projects.map((proj, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#24191A' }}>
                          {proj.name || 'Project Name'}
                        </span>
                        {proj.link && (
                          <a
                            href={normalizeUrl(proj.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--color-burgundy, #4D0E13)',
                              textDecoration: 'none',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {cleanDisplayUrl(proj.link)} ↗
                          </a>
                        )}
                      </div>
                      {proj.technologies && (
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.15rem' }}>
                          <strong>Technologies:</strong> {proj.technologies}
                        </div>
                      )}
                      {proj.description && (
                        <p style={{ fontSize: '0.86rem', lineHeight: 1.5, color: '#3A3A3A', margin: '0.25rem 0 0' }}>
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. SKILLS */}
            {skills.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Skills
                </div>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#333' }}>
                  {skills.join('  •  ')}
                </div>
              </div>
            )}

            {/* 6. CERTIFICATIONS */}
            {certifications.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Certifications
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {certifications.map((cert, idx) => {
                    const certText = typeof cert === 'string'
                      ? cert
                      : `${cert.name || 'Certification'}${cert.issuer ? ` — ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}`;
                    const certImg = typeof cert === 'object' ? cert.image : null;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {certImg && (
                          <img
                            src={certImg}
                            alt="Certificate"
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'contain',
                              border: '1px solid #E0E0E0',
                              borderRadius: '3px',
                              padding: '2px',
                              backgroundColor: '#FAFAFA',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={{ fontSize: '0.86rem', color: '#333', lineHeight: 1.45 }}>
                          • {certText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. ACHIEVEMENTS */}
            {achievements.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Achievements
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.86rem', color: '#333', lineHeight: 1.55 }}>
                  {achievements.map((ach, idx) => {
                    if (typeof ach === 'string') return <li key={idx}>{ach}</li>;
                    return (
                      <li key={idx}>
                        {ach.title && <strong>{ach.title}: </strong>}
                        {ach.description}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* 8. ADDITIONAL INFORMATION */}
            {hasAdditional && (
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#24191A',
                    borderBottom: '1px solid #24191A',
                    paddingBottom: '0.2rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  Additional Information
                </div>
                <div style={{ fontSize: '0.86rem', color: '#333', lineHeight: 1.6 }}>
                  {languages && (
                    <div>
                      <strong>Languages:</strong> {languages}
                    </div>
                  )}
                  {interests && (
                    <div>
                      <strong>Interests:</strong> {interests}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STYLE 2: CREATIVE EDITORIAL RESUME                                        */}
        {/* ========================================================================= */}
        {isCreative && hasAnyContent && (
          <div>
            {/* Editorial Header */}
            <div
              style={{
                borderBottom: '2.5px solid var(--color-burgundy, #4D0E13)',
                paddingBottom: '1.25rem',
                marginBottom: '1.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {photo && (
                    <img
                      src={photo}
                      alt={fullName || 'Profile Photo'}
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        border: '2px solid var(--color-burgundy, #4D0E13)',
                        boxShadow: '0 4px 12px rgba(77, 14, 19, 0.12)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div>
                    <h1
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: 'clamp(2rem, 3.5vw, 2.7rem)',
                        fontWeight: 700,
                        color: 'var(--color-burgundy, #4D0E13)',
                        letterSpacing: '-0.01em',
                        lineHeight: 1.1,
                        margin: 0,
                        textTransform: 'uppercase',
                      }}
                    >
                      {fullName || 'YOUR NAME'}
                    </h1>
                    {professionalTitle && (
                      <div
                        style={{
                          fontSize: '0.98rem',
                          color: 'var(--color-text-muted, #7A6F6D)',
                          marginTop: '0.35rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        {professionalTitle}
                      </div>
                    )}
                  </div>
                </div>

                {contactItems.length > 0 && (
                  <div
                    style={{
                      textAlign: 'right',
                      fontSize: '0.82rem',
                      color: 'var(--color-text-muted, #7A6F6D)',
                      lineHeight: 1.55,
                    }}
                  >
                    {contactItems.map((item, i) => (
                      <div key={i}>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.type === 'link' ? '_blank' : undefined}
                            rel={item.type === 'link' ? 'noopener noreferrer' : undefined}
                            style={{
                              color: item.type === 'link' ? 'var(--color-burgundy, #4D0E13)' : 'inherit',
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            {item.label}
                          </a>
                        ) : (
                          <span>{item.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editorial Profile / Summary */}
            {summary && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-burgundy, #4D0E13)',
                    borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                    paddingBottom: '0.3rem',
                    marginBottom: '0.65rem',
                  }}
                >
                  About & Summary
                </div>
                <p
                  style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.65,
                    color: '#24191A',
                    margin: 0,
                  }}
                >
                  {summary}
                </p>
              </div>
            )}

            {/* 2-Column Creative Editorial Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: '2rem',
              }}
            >
              {/* Left Column: Experience & Education */}
              <div>
                {/* EXPERIENCE */}
                {experience.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                        paddingBottom: '0.3rem',
                        marginBottom: '0.85rem',
                      }}
                    >
                      Experience
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {experience.map((exp, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#24191A' }}>
                              {exp.role || 'Role'}
                            </span>
                            {exp.duration && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                                {exp.duration}
                              </span>
                            )}
                          </div>
                          {exp.company && (
                            <div style={{ fontSize: '0.84rem', color: 'var(--color-burgundy, #4D0E13)', fontWeight: 600 }}>
                              {exp.company}
                            </div>
                          )}
                          {exp.description && (
                            <p style={{ fontSize: '0.86rem', lineHeight: 1.55, color: '#3A3A3A', margin: '0.35rem 0 0' }}>
                              {exp.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDUCATION */}
                {education.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                        paddingBottom: '0.3rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Education
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {education.map((edu, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#24191A' }}>
                              {edu.degree || 'Degree'}
                            </span>
                            {edu.year && (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                                {edu.year}
                              </span>
                            )}
                          </div>
                          {edu.institution && (
                            <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted, #7A6F6D)' }}>
                              {edu.institution}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Skills, Projects, Certs, Achievements */}
              <div>
                {/* SKILLS */}
                {skills.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                        paddingBottom: '0.3rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Expertise & Skills
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {skills.map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: 'rgba(216, 196, 172, 0.3)',
                            color: '#24191A',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* PROJECTS */}
                {projects.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                        paddingBottom: '0.3rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Selected Projects
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {projects.map((proj, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#24191A' }}>
                              {proj.name || 'Project'}
                            </div>
                            {proj.link && (
                              <a
                                href={normalizeUrl(proj.link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--color-burgundy, #4D0E13)',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              >
                                {cleanDisplayUrl(proj.link)} ↗
                              </a>
                            )}
                          </div>
                          {proj.technologies && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--color-burgundy, #4D0E13)', marginTop: '0.1rem' }}>
                              {proj.technologies}
                            </div>
                          )}
                          {proj.description && (
                            <p style={{ fontSize: '0.82rem', color: '#444', margin: '0.2rem 0 0', lineHeight: 1.45 }}>
                              {proj.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CERTIFICATIONS & ACHIEVEMENTS */}
                {(certifications.length > 0 || achievements.length > 0) && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                        paddingBottom: '0.3rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Credentials & Honors
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.84rem', color: '#3A3A3A', lineHeight: 1.6 }}>
                      {certifications.map((c, i) => {
                        const certText = typeof c === 'string'
                          ? c
                          : `${c.name || 'Certification'}${c.issuer ? ` — ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}`;
                        const certImg = typeof c === 'object' ? c.image : null;
                        return (
                          <li key={`c-${i}`} style={{ marginBottom: certImg ? '0.45rem' : '0.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              {certImg && (
                                <img
                                  src={certImg}
                                  alt="Badge"
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    objectFit: 'contain',
                                    border: '1px solid rgba(216, 196, 172, 0.7)',
                                    borderRadius: '3px',
                                    padding: '2px',
                                    backgroundColor: '#FAF7F4',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <span>{certText}</span>
                            </div>
                          </li>
                        );
                      })}
                      {achievements.map((a, i) => {
                        if (typeof a === 'string') return <li key={`a-${i}`}>{a}</li>;
                        return (
                          <li key={`a-${i}`}>
                            {a.title && <strong>{a.title}: </strong>}
                            {a.description}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* ADDITIONAL INFORMATION */}
                {hasAdditional && (
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-burgundy, #4D0E13)',
                        borderBottom: '1px solid rgba(216, 196, 172, 0.7)',
                        paddingBottom: '0.3rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Details
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.55 }}>
                      {languages && <div><strong>Languages:</strong> {languages}</div>}
                      {interests && <div><strong>Interests:</strong> {interests}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Watermark */}
      <div
        style={{
          marginTop: '2.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(216, 196, 172, 0.4)',
          fontSize: '0.7rem',
          color: '#9C8E8F',
          textAlign: 'center',
          letterSpacing: '0.04em',
        }}
      >
        Crafted with ResumeCraft • The Editorial Resume Studio
      </div>
    </div>
  );
}
