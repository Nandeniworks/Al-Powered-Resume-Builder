const PDFDocument = require('pdfkit');

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

// Clean URL helper: removes http(s):// and trailing slashes for clean display
function cleanUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

// Ensure full URL helper for clickable links
function fullUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// Helper to split a description string into bullets
function extractBulletPoints(description) {
  if (!description || typeof description !== 'string') return [];
  const lines = description
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*–—]+/, '').trim())
    .filter(Boolean);
  if (lines.length > 0) return lines;

  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length > 1 && sentences.length <= 6) return sentences;
  return [description.trim()];
}

// =============================================================================
// 1. PROFESSIONAL ATS-FRIENDLY PDF RENDERER
// =============================================================================
function renderProfessionalResume(doc, resume) {
  const margin = 36;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const printableWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - margin - 15;

  const fonts = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique',
    boldItalic: 'Helvetica-BoldOblique',
  };

  const colors = {
    primary: '#0F172A',      // Slate 900
    title: '#334155',        // Slate 700
    meta: '#64748B',         // Slate 500
    body: '#1E293B',         // Slate 800
    border: '#CBD5E1',       // Slate 300
    darkBorder: '#0F172A',   // Slate 900
    link: '#2563EB',         // Royal Blue
    bullet: '#475569',       // Slate 600
  };

  const personal = resume.personalDetails || {};
  const fullName = (personal.fullName || resume.title || 'RESUME').toUpperCase();
  const professionalTitle = personal.professionalTitle || '';
  const photo = personal.photo;
  const hasPhoto = !!(photo && photo.trim());

  // Check space before rendering an item
  const checkPageBreak = (neededHeight) => {
    if (doc.y + neededHeight > bottomThreshold) {
      doc.addPage();
      doc.y = margin;
      return true;
    }
    return false;
  };

  // Section Header helper for Professional ATS
  const renderSectionHeader = (title, firstItemHeight = 25) => {
    // If header + first item won't fit, start fresh on next page
    if (doc.y + 35 + firstItemHeight > bottomThreshold) {
      doc.addPage();
      doc.y = margin;
    } else {
      doc.moveDown(0.65);
    }

    const startY = doc.y;
    doc
      .fontSize(10.5)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(title.toUpperCase(), margin, startY, {
        width: printableWidth,
        characterSpacing: 0.6,
      });

    const lineY = doc.y + 2;
    doc
      .strokeColor(colors.border)
      .lineWidth(1)
      .moveTo(margin, lineY)
      .lineTo(pageWidth - margin, lineY)
      .stroke();

    doc.y = lineY + 6;
  };

  // Two-column row helper: Primary (bold) + Secondary (italic) on Left, Date/Right info on Right
  const renderItemHeader = (primaryLeft, secondaryLeft, rightText) => {
    const startY = doc.y;
    const dateWidth = rightText ? Math.min(150, doc.widthOfString(rightText, { font: fonts.regular, size: 8.5 }) + 8) : 0;
    const leftWidth = printableWidth - dateWidth - 10;

    // Render left side
    doc
      .fontSize(9.5)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(primaryLeft || '', margin, startY, {
        width: leftWidth,
        continued: !!secondaryLeft,
      });

    if (secondaryLeft) {
      doc
        .font(fonts.italic)
        .fillColor(colors.title)
        .text(` — ${secondaryLeft}`, { continued: false });
    }

    const leftEndY = doc.y;

    // Render right side
    if (rightText) {
      doc
        .fontSize(8.5)
        .font(fonts.regular)
        .fillColor(colors.meta)
        .text(rightText, pageWidth - margin - dateWidth, startY, {
          width: dateWidth,
          align: 'right',
        });
    }

    doc.y = Math.max(leftEndY, doc.y) + 2;
  };

  // Render bullets with clean indent and proper line wrapping
  const renderBullets = (bullets) => {
    bullets.forEach((b) => {
      const bulletIndent = 12;
      const textWidth = printableWidth - bulletIndent;
      const estimatedBulletHeight = doc.heightOfString(b, {
        font: fonts.regular,
        size: 8.5,
        width: textWidth,
        lineGap: 2,
      });

      checkPageBreak(estimatedBulletHeight + 4);

      const bY = doc.y;
      // Bullet glyph
      doc
        .fontSize(8.5)
        .font(fonts.bold)
        .fillColor(colors.bullet)
        .text('•', margin + 2, bY, { width: 8, lineGap: 1.5 });

      // Bullet text
      doc
        .fontSize(8.5)
        .font(fonts.regular)
        .fillColor(colors.body)
        .text(b, margin + bulletIndent, bY, {
          width: textWidth,
          lineGap: 2,
        });

      doc.y += 2;
    });
  };

  // =========================================================================
  // HEADER
  // =========================================================================
  const headerStartY = doc.y;

  // Build clean contact items
  const contactDetails = [];
  if (personal.email) contactDetails.push({ text: personal.email, url: `mailto:${personal.email}` });
  if (personal.phone) contactDetails.push({ text: personal.phone, url: `tel:${personal.phone.replace(/[^+\d]/g, '')}` });
  if (personal.location) contactDetails.push({ text: personal.location, url: null });

  const onlineLinks = [];
  if (personal.linkedin) onlineLinks.push({ text: cleanUrl(personal.linkedin), url: fullUrl(personal.linkedin) });
  if (personal.github) onlineLinks.push({ text: cleanUrl(personal.github), url: fullUrl(personal.github) });
  if (personal.portfolio) onlineLinks.push({ text: cleanUrl(personal.portfolio), url: fullUrl(personal.portfolio) });

  const allContacts = [...contactDetails, ...onlineLinks];

  const photoSize = 52;
  const headerTextLeft = hasPhoto ? margin + photoSize + 14 : margin;
  const headerTextWidth = hasPhoto ? printableWidth - photoSize - 14 : printableWidth;
  const headerAlign = hasPhoto ? 'left' : 'center';

  if (hasPhoto) {
    renderBase64Image(doc, photo, margin, headerStartY, {
      fit: [photoSize, photoSize],
    });
  }

  // Name
  doc
    .fontSize(21)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text(fullName, headerTextLeft, headerStartY, {
      align: headerAlign,
      width: headerTextWidth,
      characterSpacing: 0.5,
    });

  // Professional Title
  if (professionalTitle) {
    doc.moveDown(0.18);
    doc
      .fontSize(10.5)
      .font(fonts.bold)
      .fillColor(colors.title)
      .text(professionalTitle, headerTextLeft, doc.y, {
        align: headerAlign,
        width: headerTextWidth,
        characterSpacing: 0.2,
      });
  }

  const renderClickableContactRow = (items, align = headerAlign) => {
    if (!items || items.length === 0) return;
    const sep = '   •   ';
    const sepW = doc.widthOfString(sep, { font: fonts.regular, size: 8.25 });
    const totalW = items.reduce((acc, it) => acc + doc.widthOfString(it.text, { font: fonts.regular, size: 8.25 }), 0) + (items.length - 1) * sepW;
    let currentX = align === 'center' ? headerTextLeft + Math.max(0, (headerTextWidth - totalW) / 2) : headerTextLeft;
    const curY = doc.y;

    items.forEach((item, idx) => {
      const itemW = doc.widthOfString(item.text, { font: fonts.regular, size: 8.25 });
      doc
        .fontSize(8.25)
        .font(fonts.regular)
        .fillColor(item.url ? colors.link : colors.meta)
        .text(item.text, currentX, curY, {
          link: item.url || undefined,
          underline: false,
          lineBreak: false,
        });
      currentX += itemW;

      if (idx < items.length - 1) {
        doc
          .fontSize(8.25)
          .font(fonts.regular)
          .fillColor(colors.meta)
          .text(sep, currentX, curY, {
            link: undefined,
            lineBreak: false,
          });
        currentX += sepW;
      }
    });
    doc.y = curY + doc.currentLineHeight();
  };

  // Contact info (cleanly wrapped with clickable hyperlinks)
  if (allContacts.length > 0) {
    doc.moveDown(0.22);
    const sepW = doc.widthOfString('   •   ', { font: fonts.regular, size: 8.25 });
    const singleLineWidth = allContacts.reduce((acc, it) => acc + doc.widthOfString(it.text, { font: fonts.regular, size: 8.25 }), 0) + (allContacts.length - 1) * sepW;

    if (singleLineWidth <= headerTextWidth) {
      renderClickableContactRow(allContacts, headerAlign);
    } else {
      if (contactDetails.length > 0) {
        renderClickableContactRow(contactDetails, headerAlign);
      }
      if (onlineLinks.length > 0) {
        doc.moveDown(0.12);
        renderClickableContactRow(onlineLinks, headerAlign);
      }
    }
  }

  if (hasPhoto) {
    doc.y = Math.max(doc.y, headerStartY + photoSize);
  }

  // Header Divider Rule
  doc.moveDown(0.35);
  const headerLineY = doc.y;
  doc
    .strokeColor(colors.darkBorder)
    .lineWidth(1.25)
    .moveTo(margin, headerLineY)
    .lineTo(pageWidth - margin, headerLineY)
    .stroke();
  doc.y = headerLineY + 6;

  // =========================================================================
  // 1. PROFESSIONAL SUMMARY
  // =========================================================================
  if (personal.summary && personal.summary.trim()) {
    renderSectionHeader('Professional Summary', 30);
    doc
      .fontSize(8.85)
      .font(fonts.regular)
      .fillColor(colors.body)
      .text(personal.summary.trim(), margin, doc.y, {
        width: printableWidth,
        lineGap: 2.4,
        align: 'left',
      });
  }

  // =========================================================================
  // 2. EXPERIENCE
  // =========================================================================
  if (resume.experience && resume.experience.length > 0) {
    const validExp = resume.experience.filter((e) => e.role || e.company || e.description || e.duration);
    if (validExp.length > 0) {
      renderSectionHeader('Work Experience', 40);
      validExp.forEach((exp, idx) => {
        checkPageBreak(35);
        if (idx > 0) doc.moveDown(0.4);
        renderItemHeader(exp.role || 'Role', exp.company || '', exp.duration || '');

        if (exp.description) {
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
    const validProj = resume.projects.filter((p) => p.name || p.description || p.technologies || p.link);
    if (validProj.length > 0) {
      renderSectionHeader('Projects', 40);
      validProj.forEach((p, idx) => {
        checkPageBreak(35);
        if (idx > 0) doc.moveDown(0.4);

        // Project header with clean link
        const startY = doc.y;
        const cleanLinkText = p.link ? cleanUrl(p.link) : '';
        const linkWidth = cleanLinkText ? Math.min(180, doc.widthOfString(cleanLinkText, { font: fonts.regular, size: 8 }) + 6) : 0;
        const nameWidth = printableWidth - linkWidth - 8;

        doc
          .fontSize(9.5)
          .font(fonts.bold)
          .fillColor(colors.primary)
          .text(p.name || 'Project Name', margin, startY, {
            width: nameWidth,
          });

        const afterNameY = doc.y;

        if (cleanLinkText) {
          doc
            .fontSize(8)
            .font(fonts.regular)
            .fillColor(colors.link)
            .text(cleanLinkText, pageWidth - margin - linkWidth, startY, {
              width: linkWidth,
              align: 'right',
              link: fullUrl(p.link),
            });
        }

        doc.y = Math.max(afterNameY, doc.y) + 1;

        // Technologies line
        if (p.technologies && p.technologies.trim()) {
          doc
            .fontSize(8)
            .font(fonts.italic)
            .fillColor(colors.meta)
            .text(`Technologies: ${p.technologies.trim()}`, margin, doc.y, {
              width: printableWidth,
            });
          doc.y += 2;
        }

        // Bullets or description
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
      renderSectionHeader('Education', 25);
      validEdu.forEach((edu, idx) => {
        checkPageBreak(25);
        if (idx > 0) doc.moveDown(0.35);
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
      renderSectionHeader('Technical & Professional Skills', 25);
      checkPageBreak(20);
      doc
        .fontSize(8.75)
        .font(fonts.regular)
        .fillColor(colors.body)
        .text(validSkills.join('   •   '), margin, doc.y, {
          width: printableWidth,
          lineGap: 3,
        });
    }
  }

  // =========================================================================
  // 6. CERTIFICATIONS
  // =========================================================================
  if (resume.certifications && resume.certifications.length > 0) {
    const validCerts = resume.certifications.filter((c) => (typeof c === 'string' ? c.trim() : c.name || c.issuer || c.image));
    if (validCerts.length > 0) {
      renderSectionHeader('Certifications', 25);
      validCerts.forEach((c, idx) => {
        checkPageBreak(25);
        if (idx > 0) doc.moveDown(0.3);
        const title = typeof c === 'string' ? c : c.name || 'Certification';
        const issuer = typeof c === 'object' && c.issuer ? c.issuer : '';
        const year = typeof c === 'object' && c.year ? c.year : '';
        renderItemHeader(title, issuer, year);

        // Certificate badge/image
        if (typeof c === 'object' && c.image && c.image.trim()) {
          checkPageBreak(32);
          const rendered = renderBase64Image(doc, c.image, margin + 4, doc.y + 2, {
            fit: [60, 28],
          });
          if (rendered) {
            doc.y += 30;
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
      renderSectionHeader('Key Achievements & Awards', 25);
      validAch.forEach((a) => {
        checkPageBreak(20);
        const title = typeof a === 'string' ? a : a.title || '';
        const desc = typeof a === 'object' && a.description ? a.description : '';
        const bY = doc.y;
        doc
          .fontSize(8.5)
          .font(fonts.bold)
          .fillColor(colors.bullet)
          .text('•', margin + 2, bY, { width: 8 });

        if (title && desc) {
          doc
            .fontSize(8.5)
            .font(fonts.bold)
            .fillColor(colors.primary)
            .text(`${title}: `, margin + 12, bY, { continued: true });
          doc
            .font(fonts.regular)
            .fillColor(colors.body)
            .text(desc, { lineGap: 2 });
        } else {
          doc
            .fontSize(8.5)
            .font(fonts.regular)
            .fillColor(colors.body)
            .text(title || desc, margin + 12, bY, {
              width: printableWidth - 12,
              lineGap: 2,
            });
        }
        doc.y += 2;
      });
    }
  }

  // =========================================================================
  // 8. ADDITIONAL INFORMATION
  // =========================================================================
  const addInfo = resume.additionalInfo || {};
  const hasLanguages = addInfo.languages && addInfo.languages.trim();
  const hasInterests = addInfo.interests && addInfo.interests.trim();

  if (hasLanguages || hasInterests) {
    renderSectionHeader('Additional Information', 25);
    if (hasLanguages) {
      checkPageBreak(16);
      doc
        .fontSize(8.5)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text('Languages: ', margin, doc.y, { continued: true });
      doc
        .font(fonts.regular)
        .fillColor(colors.body)
        .text(addInfo.languages.trim(), { lineGap: 2 });
      doc.y += 2;
    }
    if (hasInterests) {
      checkPageBreak(16);
      doc
        .fontSize(8.5)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text('Interests: ', margin, doc.y, { continued: true });
      doc
        .font(fonts.regular)
        .fillColor(colors.body)
        .text(addInfo.interests.trim(), { lineGap: 2 });
    }
  }

  // Page Numbers Footer for Multi-page Documents
  const range = doc.bufferedPageRange();
  if (range.count > 1) {
    const origBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font(fonts.regular)
        .fillColor(colors.meta)
        .text(`Page ${i + 1} of ${range.count}`, margin, pageHeight - 22, {
          width: printableWidth,
          align: 'center',
          lineBreak: false,
        });
    }
    doc.page.margins.bottom = origBottomMargin;
  }
}

// =============================================================================
// 2. CREATIVE EDITORIAL PDF RENDERER (ResumeCraft Signature Design)
// =============================================================================
function renderCreativeEditorialResume(doc, resume) {
  const margin = 36;
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const printableWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - margin - 22;

  // Editorial typography
  const fonts = {
    regular: 'Times-Roman',
    bold: 'Times-Bold',
    italic: 'Times-Italic',
    boldItalic: 'Times-BoldItalic',
  };

  // ResumeCraft curated palette: Cream / Sand / Dusty Pink / Burgundy
  const colors = {
    burgundy: '#4D0E13',       // Signature deep burgundy
    burgundyLight: '#6E141B',  // Accent burgundy
    sand: '#D8C4AC',           // Sand accent divider
    sandLight: '#F7F3EE',      // Soft cream background
    sandTag: '#F0E7DD',        // Pill/tag background
    dustyRose: '#C8A49F',      // Dusty rose accent
    textPrimary: '#24191A',    // Dark espresso body
    textMuted: '#7A6F6D',      // Muted rose stone
    textTag: '#3D1C1E',        // Tag dark text
  };

  const personal = resume.personalDetails || {};
  const fullName = (personal.fullName || resume.title || 'RESUME').toUpperCase();
  const professionalTitle = personal.professionalTitle || '';
  const photo = personal.photo;
  const hasPhoto = !!(photo && photo.trim());

  // =========================================================================
  // EDITORIAL HEADER
  // =========================================================================
  const headerStartY = doc.y;
  const photoSize = 60;

  // Contact items
  const contactDetails = [];
  if (personal.email) contactDetails.push({ text: personal.email, url: `mailto:${personal.email}` });
  if (personal.phone) contactDetails.push({ text: personal.phone, url: `tel:${personal.phone.replace(/[^+\d]/g, '')}` });
  if (personal.location) contactDetails.push({ text: personal.location, url: null });

  const onlineLinks = [];
  if (personal.linkedin) onlineLinks.push({ text: cleanUrl(personal.linkedin), url: fullUrl(personal.linkedin) });
  if (personal.github) onlineLinks.push({ text: cleanUrl(personal.github), url: fullUrl(personal.github) });
  if (personal.portfolio) onlineLinks.push({ text: cleanUrl(personal.portfolio), url: fullUrl(personal.portfolio) });

  const allContacts = [...contactDetails, ...onlineLinks];

  if (hasPhoto) {
    // Render editorial framed photo on left
    doc
      .rect(margin - 1, headerStartY - 1, photoSize + 2, photoSize + 2)
      .fillColor(colors.sandLight)
      .strokeColor(colors.burgundy)
      .lineWidth(1.5)
      .fillAndStroke();

    renderBase64Image(doc, photo, margin, headerStartY, {
      fit: [photoSize, photoSize],
    });
  }

  const headerTextLeft = hasPhoto ? margin + photoSize + 16 : margin;
  const headerTextWidth = hasPhoto ? printableWidth - photoSize - 16 : printableWidth;

  // Name in elegant Playfair/Times serif
  doc
    .fontSize(24)
    .font(fonts.bold)
    .fillColor(colors.burgundy)
    .text(fullName, headerTextLeft, headerStartY, {
      width: headerTextWidth,
      characterSpacing: 0.5,
    });

  // Professional Title in uppercase letterspaced
  if (professionalTitle) {
    doc.moveDown(0.2);
    doc
      .fontSize(9.5)
      .font(fonts.bold)
      .fillColor(colors.textMuted)
      .text(professionalTitle.toUpperCase(), headerTextLeft, doc.y, {
        width: headerTextWidth,
        characterSpacing: 1.2,
      });
  }

  const renderCreativeContactRow = (items, align = 'left') => {
    if (!items || items.length === 0) return;
    const sep = '   •   ';
    const sepW = doc.widthOfString(sep, { font: fonts.regular, size: 8.25 });
    const totalW = items.reduce((acc, it) => acc + doc.widthOfString(it.text, { font: fonts.regular, size: 8.25 }), 0) + (items.length - 1) * sepW;
    let currentX = align === 'center' ? headerTextLeft + Math.max(0, (headerTextWidth - totalW) / 2) : headerTextLeft;
    const curY = doc.y;

    items.forEach((item, idx) => {
      const itemW = doc.widthOfString(item.text, { font: fonts.regular, size: 8.25 });
      doc
        .fontSize(8.25)
        .font(fonts.regular)
        .fillColor(item.url ? colors.burgundy : colors.textMuted)
        .text(item.text, currentX, curY, {
          link: item.url || undefined,
          underline: false,
          lineBreak: false,
        });
      currentX += itemW;

      if (idx < items.length - 1) {
        doc
          .fontSize(8.25)
          .font(fonts.regular)
          .fillColor(colors.textMuted)
          .text(sep, currentX, curY, {
            link: undefined,
            lineBreak: false,
          });
        currentX += sepW;
      }
    });
    doc.y = curY + doc.currentLineHeight();
  };

  // Contact items (cleanly wrapped with clickable hyperlinks)
  if (allContacts.length > 0) {
    doc.moveDown(0.25);
    const sepW = doc.widthOfString('   •   ', { font: fonts.regular, size: 8.25 });
    const singleLineWidth = allContacts.reduce((acc, it) => acc + doc.widthOfString(it.text, { font: fonts.regular, size: 8.25 }), 0) + (allContacts.length - 1) * sepW;

    if (singleLineWidth <= headerTextWidth) {
      renderCreativeContactRow(allContacts, 'left');
    } else {
      if (contactDetails.length > 0) {
        renderCreativeContactRow(contactDetails, 'left');
      }
      if (onlineLinks.length > 0) {
        doc.moveDown(0.12);
        renderCreativeContactRow(onlineLinks, 'left');
      }
    }
  }

  if (hasPhoto) {
    doc.y = Math.max(doc.y, headerStartY + photoSize + 2);
  }

  // Signature ResumeCraft Double Editorial Rule
  doc.moveDown(0.4);
  const divY = doc.y;
  doc
    .strokeColor(colors.burgundy)
    .lineWidth(1.5)
    .moveTo(margin, divY)
    .lineTo(pageWidth - margin, divY)
    .stroke();

  doc
    .strokeColor(colors.sand)
    .lineWidth(0.6)
    .moveTo(margin, divY + 3)
    .lineTo(pageWidth - margin, divY + 3)
    .stroke();

  doc.y = divY + 8;

  // =========================================================================
  // ABOUT & SUMMARY (Full width editorial callout)
  // =========================================================================
  if (personal.summary && personal.summary.trim()) {
    const sumHeaderY = doc.y;
    doc
      .fontSize(9.5)
      .font(fonts.bold)
      .fillColor(colors.burgundy)
      .text('ABOUT & SUMMARY', margin, sumHeaderY, {
        characterSpacing: 1.2,
      });

    const sumLineY = doc.y + 1.5;
    doc
      .strokeColor(colors.sand)
      .lineWidth(0.75)
      .moveTo(margin, sumLineY)
      .lineTo(pageWidth - margin, sumLineY)
      .stroke();

    doc.y = sumLineY + 5;
    doc
      .fontSize(8.8)
      .font(fonts.regular)
      .fillColor(colors.textPrimary)
      .text(personal.summary.trim(), margin, doc.y, {
        width: printableWidth,
        lineGap: 3,
      });

    doc.y += 8;
  }

  // =========================================================================
  // TWO-COLUMN EDITORIAL GRID
  // Left Column: Experience & Education (width: 58%)
  // Right Column: Skills, Projects, Certs, Achievements, Additional (width: 38%)
  // =========================================================================
  const colGap = 18;
  const leftColWidth = Math.floor(printableWidth * 0.58);
  const rightColWidth = printableWidth - leftColWidth - colGap;
  const leftX = margin;
  const rightX = margin + leftColWidth + colGap;
  const verticalSepX = margin + leftColWidth + Math.floor(colGap / 2);

  // Column Section Header helper
  const renderColHeader = (title, x, width) => {
    doc.moveDown(0.35);
    const hY = doc.y;
    doc
      .fontSize(9)
      .font(fonts.bold)
      .fillColor(colors.burgundy)
      .text(title.toUpperCase(), x, hY, {
        width: width,
        characterSpacing: 1.1,
      });

    const lY = doc.y + 1.5;
    doc
      .strokeColor(colors.sand)
      .lineWidth(0.75)
      .moveTo(x, lY)
      .lineTo(x + width, lY)
      .stroke();

    doc.y = lY + 5;
  };

  const startColY = doc.y;
  let curPageIdx = doc.bufferedPageRange().count - 1;

  // Track max Y on each page to draw vertical separator line accurately
  const pageVerticalLines = {};
  pageVerticalLines[curPageIdx] = { startY: startColY, maxY: startColY };

  const ensureColSpace = (needed, x, width) => {
    if (doc.y + needed > bottomThreshold) {
      curPageIdx++;
      if (curPageIdx >= doc.bufferedPageRange().count) {
        doc.addPage();
      } else {
        doc.switchToPage(curPageIdx);
      }
      doc.y = margin;
      if (!pageVerticalLines[curPageIdx]) {
        pageVerticalLines[curPageIdx] = { startY: margin, maxY: margin };
      }
      return true;
    }
    return false;
  };

  // Render LEFT COLUMN: Experience & Education
  // -------------------------------------------------------------------------
  doc.y = startColY;

  // 1. Experience
  if (resume.experience && resume.experience.length > 0) {
    const validExp = resume.experience.filter((e) => e.role || e.company || e.description || e.duration);
    if (validExp.length > 0) {
      renderColHeader('Experience', leftX, leftColWidth);
      validExp.forEach((exp, idx) => {
        ensureColSpace(30, leftX, leftColWidth);
        if (idx > 0) doc.moveDown(0.35);

        // Role & Duration
        const rY = doc.y;
        const durWidth = exp.duration ? Math.min(85, doc.widthOfString(exp.duration, { font: fonts.regular, size: 7.75 }) + 4) : 0;
        const roleWidth = leftColWidth - durWidth - 6;

        doc
          .fontSize(9)
          .font(fonts.bold)
          .fillColor(colors.textPrimary)
          .text(exp.role || 'Role', leftX, rY, { width: roleWidth });

        const afterRoleY = doc.y;

        if (exp.duration) {
          doc
            .fontSize(7.75)
            .font(fonts.regular)
            .fillColor(colors.textMuted)
            .text(exp.duration, leftX + leftColWidth - durWidth, rY, {
              width: durWidth,
              align: 'right',
            });
        }
        doc.y = Math.max(afterRoleY, doc.y) + 1;

        // Company
        if (exp.company) {
          doc
            .fontSize(8.25)
            .font(fonts.boldItalic)
            .fillColor(colors.burgundy)
            .text(exp.company, leftX, doc.y, { width: leftColWidth });
          doc.y += 2;
        }

        // Bullets / Description
        if (exp.description) {
          const bullets = extractBulletPoints(exp.description);
          bullets.forEach((b) => {
            const bHeight = doc.heightOfString(b, {
              font: fonts.regular,
              size: 8,
              width: leftColWidth - 9,
              lineGap: 2,
            });
            ensureColSpace(bHeight + 4, leftX, leftColWidth);

            const bY = doc.y;
            doc
              .fontSize(7.5)
              .font(fonts.bold)
              .fillColor(colors.burgundy)
              .text('•', leftX + 2, bY, { width: 6 });

            doc
              .fontSize(8)
              .font(fonts.regular)
              .fillColor(colors.textPrimary)
              .text(b, leftX + 9, bY, {
                width: leftColWidth - 9,
                lineGap: 2,
              });
            doc.y += 2;
          });
        }
        pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
      });
    }
  }

  // 2. Education
  if (resume.education && resume.education.length > 0) {
    const validEdu = resume.education.filter((e) => e.degree || e.institution || e.year);
    if (validEdu.length > 0) {
      ensureColSpace(35, leftX, leftColWidth);
      doc.moveDown(0.35);
      renderColHeader('Education', leftX, leftColWidth);
      validEdu.forEach((edu, idx) => {
        ensureColSpace(24, leftX, leftColWidth);
        if (idx > 0) doc.moveDown(0.3);
        const edY = doc.y;
        const yrWidth = edu.year ? Math.min(80, doc.widthOfString(edu.year, { font: fonts.regular, size: 7.75 }) + 4) : 0;
        const degWidth = leftColWidth - yrWidth - 6;

        doc
          .fontSize(8.75)
          .font(fonts.bold)
          .fillColor(colors.textPrimary)
          .text(edu.degree || 'Degree', leftX, edY, { width: degWidth });

        const afterDegY = doc.y;

        if (edu.year) {
          doc
            .fontSize(7.75)
            .font(fonts.regular)
            .fillColor(colors.textMuted)
            .text(edu.year, leftX + leftColWidth - yrWidth, edY, {
              width: yrWidth,
              align: 'right',
            });
        }
        doc.y = Math.max(afterDegY, doc.y) + 1;

        if (edu.institution) {
          doc
            .fontSize(8)
            .font(fonts.italic)
            .fillColor(colors.textMuted)
            .text(edu.institution, leftX, doc.y, { width: leftColWidth });
          doc.y += 2;
        }
        pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
      });
    }
  }

  // Switch back to start page to render RIGHT COLUMN: Skills, Projects, Certs, Achievements, Details
  // -------------------------------------------------------------------------
  curPageIdx = 0;
  doc.switchToPage(curPageIdx);
  doc.y = startColY;

  // 1. Expertise & Skills (Rendered as styled pill badges)
  if (resume.skills && resume.skills.length > 0) {
    const validSkills = resume.skills.filter((s) => s && String(s).trim());
    if (validSkills.length > 0) {
      renderColHeader('Expertise & Skills', rightX, rightColWidth);

      // Render skills as clean tag pills
      let curTagX = rightX;
      let curTagY = doc.y;

      validSkills.forEach((skill) => {
        const text = String(skill).trim();
        const tagTextWidth = doc.widthOfString(text, { font: fonts.bold, size: 7.5 });
        const pillWidth = tagTextWidth + 10;
        const pillHeight = 13;

        // Wrap to next tag line if needed
        if (curTagX + pillWidth > rightX + rightColWidth && curTagX > rightX) {
          curTagX = rightX;
          curTagY += pillHeight + 4;
        }

        // Draw pill background
        doc
          .roundedRect(curTagX, curTagY, pillWidth, pillHeight, 3)
          .fillColor(colors.sandTag)
          .fill();

        // Draw pill text
        doc
          .fontSize(7.5)
          .font(fonts.bold)
          .fillColor(colors.textTag)
          .text(text, curTagX + 5, curTagY + 2.5, {
            lineBreak: false,
          });

        curTagX += pillWidth + 4;
      });

      doc.y = curTagY + 18;
      pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
    }
  }

  // 2. Selected Projects
  if (resume.projects && resume.projects.length > 0) {
    const validProj = resume.projects.filter((p) => p.name || p.description || p.technologies || p.link);
    if (validProj.length > 0) {
      ensureColSpace(30, rightX, rightColWidth);
      renderColHeader('Selected Projects', rightX, rightColWidth);
      validProj.forEach((p, idx) => {
        ensureColSpace(30, rightX, rightColWidth);
        if (idx > 0) doc.moveDown(0.3);

        // Project Name
        doc
          .fontSize(8.75)
          .font(fonts.bold)
          .fillColor(colors.textPrimary)
          .text(p.name || 'Project Name', rightX, doc.y, { width: rightColWidth });

        // Link if present
        if (p.link) {
          doc
            .fontSize(7.5)
            .font(fonts.regular)
            .fillColor(colors.burgundy)
            .text(cleanUrl(p.link), rightX, doc.y + 1, {
              width: rightColWidth,
              link: fullUrl(p.link),
            });
          doc.y += 1;
        }

        // Technologies
        if (p.technologies) {
          doc
            .fontSize(7.5)
            .font(fonts.italic)
            .fillColor(colors.textMuted)
            .text(p.technologies, rightX, doc.y, { width: rightColWidth });
          doc.y += 2;
        }

        // Description
        if (p.description) {
          const bullets = extractBulletPoints(p.description);
          bullets.forEach((b) => {
            const bHeight = doc.heightOfString(b, {
              font: fonts.regular,
              size: 7.75,
              width: rightColWidth - 9,
              lineGap: 1.8,
            });
            ensureColSpace(bHeight + 4, rightX, rightColWidth);

            const bY = doc.y;
            doc
              .fontSize(7.5)
              .font(fonts.bold)
              .fillColor(colors.burgundy)
              .text('•', rightX + 2, bY, { width: 6 });
            doc
              .fontSize(7.75)
              .font(fonts.regular)
              .fillColor(colors.textPrimary)
              .text(b, rightX + 9, bY, {
                width: rightColWidth - 9,
                lineGap: 1.8,
              });
            doc.y += 2;
          });
        }
        pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
      });
    }
  }

  // 3. Credentials & Honors (Certifications + Achievements)
  const validCerts = (resume.certifications || []).filter((c) => (typeof c === 'string' ? c.trim() : c.name || c.issuer || c.image));
  const validAch = (resume.achievements || []).filter((a) => (typeof a === 'string' ? a.trim() : a.title || a.description));

  if (validCerts.length > 0 || validAch.length > 0) {
    ensureColSpace(30, rightX, rightColWidth);
    doc.moveDown(0.3);
    renderColHeader('Credentials & Honors', rightX, rightColWidth);

    validCerts.forEach((c) => {
      ensureColSpace(20, rightX, rightColWidth);
      const title = typeof c === 'string' ? c : c.name || 'Certification';
      const issuer = typeof c === 'object' && c.issuer ? c.issuer : '';
      const year = typeof c === 'object' && c.year ? c.year : '';
      const badge = typeof c === 'object' ? c.image : null;

      const certText = `${title}${issuer ? ` — ${issuer}` : ''}${year ? ` (${year})` : ''}`;
      const bY = doc.y;

      if (badge && badge.trim()) {
        const rendered = renderBase64Image(doc, badge, rightX + 2, bY, { fit: [24, 24] });
        if (rendered) {
          doc
            .fontSize(7.75)
            .font(fonts.regular)
            .fillColor(colors.textPrimary)
            .text(certText, rightX + 30, bY + 4, { width: rightColWidth - 30, lineGap: 1.5 });
          doc.y = Math.max(doc.y, bY + 28);
          pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
          return;
        }
      }

      doc
        .fontSize(7.5)
        .font(fonts.bold)
        .fillColor(colors.burgundy)
        .text('•', rightX + 2, bY, { width: 6 });

      doc
        .fontSize(7.75)
        .font(fonts.regular)
        .fillColor(colors.textPrimary)
        .text(certText, rightX + 9, bY, { width: rightColWidth - 9, lineGap: 1.5 });
      doc.y += 2;
      pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
    });

    validAch.forEach((a) => {
      ensureColSpace(20, rightX, rightColWidth);
      const title = typeof a === 'string' ? a : a.title || '';
      const desc = typeof a === 'object' && a.description ? a.description : '';
      const bY = doc.y;

      doc
        .fontSize(7.5)
        .font(fonts.bold)
        .fillColor(colors.burgundy)
        .text('•', rightX + 2, bY, { width: 6 });

      if (title && desc) {
        doc
          .fontSize(7.75)
          .font(fonts.bold)
          .fillColor(colors.burgundy)
          .text(`${title}: `, rightX + 9, bY, { continued: true });
        doc
          .font(fonts.regular)
          .fillColor(colors.textPrimary)
          .text(desc, { lineGap: 1.8 });
      } else {
        doc
          .fontSize(7.75)
          .font(fonts.regular)
          .fillColor(colors.textPrimary)
          .text(title || desc, rightX + 9, bY, { width: rightColWidth - 9, lineGap: 1.8 });
      }
      doc.y += 2;
      pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
    });
  }

  // 4. Additional Information (Details: Languages & Interests)
  const addInfo = resume.additionalInfo || {};
  const hasLanguages = addInfo.languages && addInfo.languages.trim();
  const hasInterests = addInfo.interests && addInfo.interests.trim();

  if (hasLanguages || hasInterests) {
    ensureColSpace(26, rightX, rightColWidth);
    doc.moveDown(0.3);
    renderColHeader('Details', rightX, rightColWidth);

    if (hasLanguages) {
      doc
        .fontSize(7.75)
        .font(fonts.bold)
        .fillColor(colors.burgundy)
        .text('Languages: ', rightX, doc.y, { continued: true });
      doc
        .font(fonts.regular)
        .fillColor(colors.textPrimary)
        .text(addInfo.languages.trim(), { lineGap: 1.8 });
      doc.y += 2;
    }

    if (hasInterests) {
      doc
        .fontSize(7.75)
        .font(fonts.bold)
        .fillColor(colors.burgundy)
        .text('Interests: ', rightX, doc.y, { continued: true });
      doc
        .font(fonts.regular)
        .fillColor(colors.textPrimary)
        .text(addInfo.interests.trim(), { lineGap: 1.8 });
    }
    pageVerticalLines[curPageIdx].maxY = Math.max(pageVerticalLines[curPageIdx].maxY, doc.y);
  }

  // Draw vertical dividing rule between left and right column on each page
  const totalPages = doc.bufferedPageRange().count;
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    const lineInfo = pageVerticalLines[p];
    if (lineInfo) {
      const topY = lineInfo.startY;
      const botY = Math.min(lineInfo.maxY + 6, pageHeight - margin - 22);
      if (botY > topY + 15) {
        doc
          .strokeColor(colors.sand)
          .lineWidth(0.65)
          .moveTo(verticalSepX, topY)
          .lineTo(verticalSepX, botY)
          .stroke();
      }
    }

    // Editorial Footer Watermark on all pages
    const footerY = pageHeight - 20;
    doc
      .strokeColor(colors.sand)
      .lineWidth(0.5)
      .moveTo(margin, footerY - 4)
      .lineTo(pageWidth - margin, footerY - 4)
      .stroke();

    const pageNotice = totalPages > 1 ? ` • Page ${p + 1} of ${totalPages}` : '';
    const origBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .fontSize(7)
      .font(fonts.italic)
      .fillColor(colors.textMuted)
      .text(`Crafted with ResumeCraft • The Editorial Resume Studio${pageNotice}`, margin, footerY, {
        width: printableWidth,
        align: 'center',
        characterSpacing: 0.5,
        lineBreak: false,
      });
    doc.page.margins.bottom = origBottomMargin;
  }
}

module.exports = {
  renderProfessionalResume,
  renderCreativeEditorialResume,
};
