const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Resume = require('../models/Resume');
const Template = require('../models/Template');
const {
  renderProfessionalResume,
  renderCreativeEditorialResume,
} = require('../utils/pdfRenderers');
const { normalizeUrl, isValidUrl } = require('../utils/urlUtils');

function sanitizeAndValidateUrls(personalDetails, projects) {
  const pd = personalDetails ? { ...personalDetails } : {};
  if (pd.linkedin) {
    if (!isValidUrl(pd.linkedin)) throw new Error('Invalid URL format for LinkedIn');
    pd.linkedin = normalizeUrl(pd.linkedin);
  }
  if (pd.github) {
    if (!isValidUrl(pd.github)) throw new Error('Invalid URL format for GitHub');
    pd.github = normalizeUrl(pd.github);
  }
  if (pd.portfolio) {
    if (!isValidUrl(pd.portfolio)) throw new Error('Invalid URL format for Portfolio');
    pd.portfolio = normalizeUrl(pd.portfolio);
  }

  let sanitizedProjects = projects;
  if (Array.isArray(projects)) {
    sanitizedProjects = projects.map((p) => {
      const proj = { ...p };
      if (proj.link) {
        if (!isValidUrl(proj.link)) throw new Error('Invalid URL format for Project link: ' + proj.link);
        proj.link = normalizeUrl(proj.link);
      }
      return proj;
    });
  }

  return { sanitizedPersonalDetails: pd, sanitizedProjects };
}

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

    // 4. Validate and normalize URLs
    let cleanPersonalDetails = personalDetails || {};
    let cleanProjects = Array.isArray(projects) ? projects : [];
    try {
      const sanitized = sanitizeAndValidateUrls(personalDetails, projects);
      cleanPersonalDetails = sanitized.sanitizedPersonalDetails;
      cleanProjects = sanitized.sanitizedProjects;
    } catch (urlErr) {
      return res.status(400).json({ message: urlErr.message });
    }

    // 5. Create resume storing the COMPLETE resume in MongoDB
    const resume = await Resume.create({
      user: req.user.id,
      template,
      title,
      personalDetails: cleanPersonalDetails,
      education: Array.isArray(education) ? education : [],
      experience: Array.isArray(experience) ? experience : [],
      projects: cleanProjects,
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

    // Validate and normalize URLs if personalDetails or projects are being updated
    if (personalDetails !== undefined || projects !== undefined) {
      try {
        const sanitized = sanitizeAndValidateUrls(
          personalDetails !== undefined ? personalDetails : resume.personalDetails,
          projects !== undefined ? projects : resume.projects
        );
        if (personalDetails !== undefined) resume.personalDetails = sanitized.sanitizedPersonalDetails;
        if (projects !== undefined) resume.projects = sanitized.sanitizedProjects;
      } catch (urlErr) {
        return res.status(400).json({ message: urlErr.message });
      }
    }

    // Update all resume fields in MongoDB
    if (title !== undefined) resume.title = title;
    if (education !== undefined) resume.education = education;
    if (experience !== undefined) resume.experience = experience;
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
      margins: { top: 36, bottom: 0, left: 36, right: 36 },
      size: 'A4',
      bufferPages: true,
    });
    doc.pipe(res);

    // Style selection: check query param first, then resume.style (default to professional)
    const requestedStyle = req.query.style;
    const isCreative = requestedStyle
      ? requestedStyle === 'creative'
      : resume.style === 'creative';

    if (isCreative) {
      renderCreativeEditorialResume(doc, resume);
    } else {
      renderProfessionalResume(doc, resume);
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
