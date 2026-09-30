const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Resume = require('../models/Resume');
const Template = require('../models/Template');

// POST /api/resumes - Create a new resume for logged-in user
const createResume = async (req, res) => {
  try {
    const {
      title,
      template,
      personalDetails,
      education,
      experience,
      projects,
      skills,
      certifications,
      achievements,
      additionalInfo,
      style,
    } = req.body;

    // 1. Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!template) {
      return res.status(400).json({ message: 'Template ID is required' });
    }

    // 2. Validate template ID format
    if (!mongoose.Types.ObjectId.isValid(template)) {
      return res.status(400).json({ message: 'Invalid template ID format' });
    }

    // 3. Verify that the Template actually exists in the database
    const existingTemplate = await Template.findById(template);
    if (!existingTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // 4. Create resume storing the COMPLETE resume in MongoDB
    const resume = await Resume.create({
      user: req.user.id,
      template,
      title,
      personalDetails: personalDetails || {},
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
      projects: Array.isArray(projects) ? projects : [],
      skills: Array.isArray(skills) ? skills : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      achievements: Array.isArray(achievements) ? achievements : [],
      additionalInfo: additionalInfo || {},
      style: style === 'creative' ? 'creative' : 'professional',
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/resumes - Get all resumes for logged-in user
const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/resumes/:id - Get single resume by ID (ownership protected)
const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    res.status(200).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/resumes/:id - Update resume by ID (ownership protected)
const updateResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    const {
      title,
      template,
      personalDetails,
      education,
      experience,
      projects,
      skills,
      certifications,
      achievements,
      additionalInfo,
      style,
    } = req.body;

    // If template is being updated, verify it
    if (template !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(template)) {
        return res.status(400).json({ message: 'Invalid template ID format' });
      }
      const existingTemplate = await Template.findById(template);
      if (!existingTemplate) {
        return res.status(404).json({ message: 'Template not found' });
      }
      resume.template = template;
    }

    // Update all resume fields in MongoDB
    if (title !== undefined) resume.title = title;
    if (personalDetails !== undefined) resume.personalDetails = personalDetails;
    if (education !== undefined) resume.education = education;
    if (experience !== undefined) resume.experience = experience;
    if (projects !== undefined) resume.projects = projects;
    if (skills !== undefined) resume.skills = skills;
    if (certifications !== undefined) resume.certifications = certifications;
    if (achievements !== undefined) resume.achievements = achievements;
    if (additionalInfo !== undefined) resume.additionalInfo = additionalInfo;
    if (style !== undefined) resume.style = style;

    const updatedResume = await resume.save();
    res.status(200).json(updatedResume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/resumes/:id - Delete resume by ID (ownership protected)
const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    await resume.deleteOne();
    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to parse unstructured description text into clean individual bullet points
function extractBulletPoints(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Check if newline separated
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((l) => l.replace(/^[•*–—\-]\s*/, '').trim()).filter(Boolean);
  }

  // Check if bullet character separated
  if (/[•*–—]/.test(trimmed)) {
    return trimmed
      .split(/[•*–—]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Check if multiple sentences
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1 && sentences.length <= 6) {
    return sentences;
  }

  return [trimmed];
}

// Helper to safely render Base64 / data-URI images in PDFKit
function renderBase64Image(doc, dataUrlOrBase64, x, y, options) {
  if (!dataUrlOrBase64 || typeof dataUrlOrBase64 !== 'string') return false;
  try {
    const raw = dataUrlOrBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, '').trim();
    if (!raw) return false;
    const buf = Buffer.from(raw, 'base64');
    doc.image(buf, x, y, options);
    return true;
  } catch (err) {
    console.warn('PDF image rendering notice:', err.message);
    return false;
  }
}

// GET /api/resumes/:id/pdf - Generate and stream PDF for an owned resume with COMPLETE sections
const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Verify ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${(resume.title || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf"`);

    const doc = new PDFDocument({
      margin: 32,
      size: 'A4',
      bufferPages: true,
    });
    doc.pipe(res);

    const isCreative = resume.style === 'creative';
    const leftMargin = 32;
    const rightMargin = doc.page.width - 32;
    const printableWidth = rightMargin - leftMargin;

    // Typography selection
    const fonts = {
      regular: isCreative ? 'Times-Roman' : 'Helvetica',
      bold: isCreative ? 'Times-Bold' : 'Helvetica-Bold',
      italic: isCreative ? 'Times-Italic' : 'Helvetica-Oblique',
    };

    // Color palette
    const colors = {
      headerName: isCreative ? '#4D0E13' : '#0F172A',
      headerTitle: isCreative ? '#7A6F6D' : '#475569',
      headerContact: isCreative ? '#6B5E5F' : '#4B5563',
      sectionTitle: isCreative ? '#4D0E13' : '#0F172A',
      sectionLine: isCreative ? '#D8C4AC' : '#CBD5E1',
      headingPrimary: isCreative ? '#24191A' : '#1E293B',
      headingSecondary: isCreative ? '#4D0E13' : '#475569',
      mutedDate: isCreative ? '#7A6F6D' : '#64748B',
      bodyText: isCreative ? '#24191A' : '#334155',
      bulletGlyph: isCreative ? '#4D0E13' : '#64748B',
    };

    const personal = resume.personalDetails || {};

    // Check page overflow
    const ensureSpace = (needed = 30) => {
      if (doc.y + needed > doc.page.height - 32) {
        doc.addPage();
      }
    };

    // =========================================================================
    // HEADER WITH OPTIONAL CANDIDATE PHOTO
    // =========================================================================
    const fullName = (personal.fullName || resume.title || 'RESUME').toUpperCase();
    const hasPhoto = !!(personal.photo && personal.photo.trim());
    const headerStartY = doc.y;

    // Contact details line
    const contacts = [];
    if (personal.email) contacts.push(personal.email);
    if (personal.phone) contacts.push(personal.phone);
    if (personal.location) contacts.push(personal.location);
    if (personal.linkedin) contacts.push(personal.linkedin);
    if (personal.github) contacts.push(personal.github);
    if (personal.portfolio) contacts.push(personal.portfolio);

    if (isCreative) {
      // Creative Editorial Header: Photo on right, Name & details on left
      const photoSize = 52;
      const textWidth = hasPhoto ? printableWidth - photoSize - 14 : printableWidth;

      if (hasPhoto) {
        renderBase64Image(doc, personal.photo, rightMargin - photoSize, headerStartY, {
          fit: [photoSize, photoSize],
        });
      }

      doc
        .fontSize(22)
        .font(fonts.bold)
        .fillColor(colors.headerName)
        .text(fullName, leftMargin, headerStartY, {
          align: 'left',
          width: textWidth,
        });

      if (personal.professionalTitle) {
        doc.moveDown(0.18);
        doc
          .fontSize(9.5)
          .font(fonts.italic)
          .fillColor(colors.headerTitle)
          .text(personal.professionalTitle, leftMargin, doc.y, {
            align: 'left',
            width: textWidth,
          });
      }

      if (contacts.length > 0) {
        doc.moveDown(0.2);
        doc
          .fontSize(8.5)
          .font(fonts.regular)
          .fillColor(colors.headerContact)
          .text(contacts.join('   •   '), leftMargin, doc.y, {
            align: 'left',
            width: textWidth,
          });
      }

      if (hasPhoto) {
        doc.y = Math.max(doc.y, headerStartY + photoSize);
      }
    } else {
      // Professional ATS-friendly Header: Photo on left if present, otherwise centered
      const photoSize = 48;
      const textLeft = hasPhoto ? leftMargin + photoSize + 14 : leftMargin;
      const textWidth = hasPhoto ? printableWidth - photoSize - 14 : printableWidth;

      if (hasPhoto) {
        renderBase64Image(doc, personal.photo, leftMargin, headerStartY, {
          fit: [photoSize, photoSize],
        });
      }

      doc
        .fontSize(19)
        .font(fonts.bold)
        .fillColor(colors.headerName)
        .text(fullName, textLeft, headerStartY, {
          align: hasPhoto ? 'left' : 'center',
          width: textWidth,
        });

      if (personal.professionalTitle) {
        doc.moveDown(0.18);
        doc
          .fontSize(9.5)
          .font(fonts.regular)
          .fillColor(colors.headerTitle)
          .text(personal.professionalTitle, textLeft, doc.y, {
            align: hasPhoto ? 'left' : 'center',
            width: textWidth,
          });
      }

      if (contacts.length > 0) {
        doc.moveDown(0.2);
        doc
          .fontSize(8.5)
          .font(fonts.regular)
          .fillColor(colors.headerContact)
          .text(contacts.join('   •   '), textLeft, doc.y, {
            align: hasPhoto ? 'left' : 'center',
            width: textWidth,
          });
      }

      if (hasPhoto) {
        doc.y = Math.max(doc.y, headerStartY + photoSize);
      }
    }

    // Header Divider
    doc.moveDown(0.35);
    const dividerY = doc.y;
    if (isCreative) {
      // Distinctive double editorial rule
      doc
        .strokeColor(colors.headerName)
        .lineWidth(1.25)
        .moveTo(leftMargin, dividerY)
        .lineTo(rightMargin, dividerY)
        .stroke();

      doc
        .strokeColor(colors.sectionLine)
        .lineWidth(0.5)
        .moveTo(leftMargin, dividerY + 2.5)
        .lineTo(rightMargin, dividerY + 2.5)
        .stroke();

      doc.y = dividerY + 5.5;
    } else {
      // Clean ATS-friendly single rule
      doc
        .strokeColor(colors.sectionLine)
        .lineWidth(0.75)
        .moveTo(leftMargin, dividerY)
        .lineTo(rightMargin, dividerY)
        .stroke();

      doc.y = dividerY + 4.5;
    }

    // Section Header helper
    const renderSectionHeader = (title) => {
      ensureSpace(32);
      doc.moveDown(0.35);
      doc
        .fontSize(9.5)
        .font(fonts.bold)
        .fillColor(colors.sectionTitle)
        .text(title.toUpperCase(), leftMargin, doc.y, {
          width: printableWidth,
          characterSpacing: isCreative ? 0.75 : 0.5,
        });

      const lineY = doc.y + 1.5;
      doc
        .strokeColor(colors.sectionLine)
        .lineWidth(0.65)
        .moveTo(leftMargin, lineY)
        .lineTo(rightMargin, lineY)
        .stroke();

      doc.y = lineY + 3.5;
    };

    // Two column header helper (Left role/degree, Right date)
    const renderItemHeader = (primaryLeft, secondaryLeft, rightText) => {
      ensureSpace(22);
      const startY = doc.y;
      const dateWidth = 130;
      const leftWidth = printableWidth - dateWidth - 10;

      // Left text
      doc
        .fontSize(9)
        .font(fonts.bold)
        .fillColor(colors.headingPrimary)
        .text(primaryLeft, leftMargin, startY, {
          width: leftWidth,
          continued: !!secondaryLeft,
        });

      if (secondaryLeft) {
        doc
          .font(fonts.italic)
          .fillColor(colors.headingSecondary)
          .text(` — ${secondaryLeft}`, { continued: false });
      }

      const afterLeftY = doc.y;

      // Right text (duration/year)
      if (rightText) {
        doc
          .fontSize(8.5)
          .font(fonts.regular)
          .fillColor(colors.mutedDate)
          .text(rightText, rightMargin - dateWidth, startY, {
            width: dateWidth,
            align: 'right',
          });
      }

      doc.y = Math.max(afterLeftY, doc.y);
    };

    // Bullet points renderer
    const renderBullets = (bullets) => {
      bullets.forEach((b) => {
        ensureSpace(16);
        const bulletY = doc.y;

        doc
          .fontSize(8.5)
          .font(fonts.regular)
          .fillColor(colors.bodyText)
          .text(`•   ${b}`, leftMargin + 4, bulletY, {
            width: printableWidth - 4,
            lineGap: isCreative ? 2 : 1.5,
          });

        doc.moveDown(0.08);
      });
    };

    // =========================================================================
    // 1. PROFESSIONAL SUMMARY
    // =========================================================================
    if (personal.summary && personal.summary.trim()) {
      renderSectionHeader('Professional Summary');
      doc
        .fontSize(8.75)
        .font(fonts.regular)
        .fillColor(colors.bodyText)
        .text(personal.summary.trim(), leftMargin, doc.y, {
          width: printableWidth,
          lineGap: isCreative ? 2.5 : 2,
          align: 'left',
        });
    }

    // =========================================================================
    // 2. EXPERIENCE
    // =========================================================================
    if (resume.experience && resume.experience.length > 0) {
      const validExp = resume.experience.filter((e) => e.role || e.company || e.description);
      if (validExp.length > 0) {
        renderSectionHeader('Work Experience');
        validExp.forEach((exp, idx) => {
          if (idx > 0) doc.moveDown(0.2);
          renderItemHeader(exp.role || 'Role', exp.company || '', exp.duration || '');

          if (exp.description) {
            doc.moveDown(0.08);
            const bullets = extractBulletPoints(exp.description);
            renderBullets(bullets);
          }
        });
      }
    }

    // =========================================================================
    // 3. PROJECTS
    // =========================================================================
    if (resume.projects && resume.projects.length > 0) {
      const validProj = resume.projects.filter((p) => p.name || p.description || p.technologies);
      if (validProj.length > 0) {
        renderSectionHeader('Projects');
        validProj.forEach((p, idx) => {
          if (idx > 0) doc.moveDown(0.2);
          renderItemHeader(p.name || 'Project Name', p.link ? `[${p.link}]` : '', '');

          if (p.technologies) {
            ensureSpace(14);
            doc
              .fontSize(8)
              .font(fonts.italic)
              .fillColor(colors.mutedDate)
              .text(`Technologies: ${p.technologies}`, leftMargin + 6, doc.y, {
                width: printableWidth - 6,
              });
            doc.moveDown(0.06);
          }

          if (p.description) {
            const bullets = extractBulletPoints(p.description);
            renderBullets(bullets);
          }
        });
      }
    }

    // =========================================================================
    // 4. EDUCATION
    // =========================================================================
    if (resume.education && resume.education.length > 0) {
      const validEdu = resume.education.filter((e) => e.degree || e.institution || e.year);
      if (validEdu.length > 0) {
        renderSectionHeader('Education');
        validEdu.forEach((edu, idx) => {
          if (idx > 0) doc.moveDown(0.18);
          renderItemHeader(edu.degree || 'Degree', edu.institution || '', edu.year ? `Graduation: ${edu.year}` : '');
        });
      }
    }

    // =========================================================================
    // 5. SKILLS
    // =========================================================================
    if (resume.skills && resume.skills.length > 0) {
      const validSkills = resume.skills.filter((s) => s && String(s).trim());
      if (validSkills.length > 0) {
        renderSectionHeader('Technical & Professional Skills');
        ensureSpace(16);
        doc
          .fontSize(8.75)
          .font(fonts.regular)
          .fillColor(colors.bodyText)
          .text(validSkills.join('   •   '), leftMargin, doc.y, {
            width: printableWidth,
            lineGap: 2,
          });
      }
    }

    // =========================================================================
    // 6. CERTIFICATIONS
    // =========================================================================
    if (resume.certifications && resume.certifications.length > 0) {
      const validCerts = resume.certifications.filter((c) => (typeof c === 'string' ? c.trim() : c.name || c.issuer || c.image));
      if (validCerts.length > 0) {
        renderSectionHeader('Certifications');
        validCerts.forEach((c) => {
          const title = typeof c === 'string' ? c : c.name || 'Certification';
          const issuer = typeof c === 'object' && c.issuer ? c.issuer : '';
          const year = typeof c === 'object' && c.year ? c.year : '';
          renderItemHeader(title, issuer, year);

          // Render certification badge/image if provided
          if (typeof c === 'object' && c.image && c.image.trim()) {
            ensureSpace(36);
            const rendered = renderBase64Image(doc, c.image, leftMargin + 6, doc.y + 2, {
              fit: [65, 32],
            });
            if (rendered) {
              doc.y += 34;
            }
          }
        });
      }
    }

    // =========================================================================
    // 7. ACHIEVEMENTS
    // =========================================================================
    if (resume.achievements && resume.achievements.length > 0) {
      const validAch = resume.achievements.filter((a) => (typeof a === 'string' ? a.trim() : a.title || a.description));
      if (validAch.length > 0) {
        renderSectionHeader('Key Achievements & Awards');
        validAch.forEach((a) => {
          const title = typeof a === 'string' ? a : a.title || '';
          const desc = typeof a === 'object' && a.description ? a.description : '';
          const achLine = title ? (desc ? `${title}: ${desc}` : title) : desc;
          ensureSpace(16);
          doc
            .fontSize(8.5)
            .font(fonts.regular)
            .fillColor(colors.bodyText)
            .text(`•   ${achLine}`, leftMargin + 4, doc.y, {
              width: printableWidth - 4,
              lineGap: 1.5,
            });
          doc.moveDown(0.08);
        });
      }
    }

    // =========================================================================
    // 8. ADDITIONAL INFORMATION
    // =========================================================================
    const addInfo = resume.additionalInfo || {};
    if ((addInfo.languages && addInfo.languages.trim()) || (addInfo.interests && addInfo.interests.trim())) {
      renderSectionHeader('Additional Information');
      if (addInfo.languages && addInfo.languages.trim()) {
        ensureSpace(14);
        doc
          .fontSize(8.5)
          .font(fonts.bold)
          .fillColor(colors.headingPrimary)
          .text('Languages: ', leftMargin, doc.y, { continued: true });
        doc
          .font(fonts.regular)
          .fillColor(colors.bodyText)
          .text(addInfo.languages.trim());
        doc.moveDown(0.08);
      }
      if (addInfo.interests && addInfo.interests.trim()) {
        ensureSpace(14);
        doc
          .fontSize(8.5)
          .font(fonts.bold)
          .fillColor(colors.headingPrimary)
          .text('Interests: ', leftMargin, doc.y, { continued: true });
        doc
          .font(fonts.regular)
          .fillColor(colors.bodyText)
          .text(addInfo.interests.trim());
      }
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  generatePDF,
};
