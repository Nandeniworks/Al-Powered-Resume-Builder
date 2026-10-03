const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const AISuggestion = require('../models/AISuggestion');
const Tailor = require('../models/Tailor');
const Resume = require('../models/Resume');
const ATSAnalysis = require('../models/ATSAnalysis');
const { calculateATS } = require('../utils/atsScorer');

// POST /api/ai/suggestions - Create a suggestion for an owned resume
const createSuggestion = async (req, res) => {
  try {
    const { resume, input, suggestion } = req.body;

    // 1. Validate required fields
    if (!resume || !input || !suggestion) {
      return res.status(400).json({ message: 'Resume ID, input, and suggestion are required' });
    }

    // 2. Validate resume ObjectId format
    if (!mongoose.Types.ObjectId.isValid(resume)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    // 3. Verify that the resume exists
    const existingResume = await Resume.findById(resume);
    if (!existingResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // 4. Verify ownership: user must own the resume
    if (existingResume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    // 5. Store suggestion with logged-in user ID
    const newSuggestion = await AISuggestion.create({
      user: req.user.id,
      resume,
      input,
      suggestion,
    });

    res.status(201).json(newSuggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/ai/suggestions - Get only suggestions belonging to the logged-in user
const getSuggestions = async (req, res) => {
  try {
    const suggestions = await AISuggestion.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const TAILOR_SYSTEM_INSTRUCTION = `You are an elite executive resume tailoring strategist and ATS optimization expert.
Your mission is to perform a comprehensive, high-impact tailoring of the candidate's resume specifically for the target job description.

MANDATORY TAILORING DIRECTIVES:
1. DO NOT simply change the title or rename sections. You must perform SUBSTANTIVE, MEANINGFUL REWRITING across all content areas.
2. TARGET ROLE & PROFESSIONAL TITLE:
   - Extract the exact target job title from the job description (e.g. "UI/UX Developer").
   - Set personalDetails.professionalTitle to this target title (e.g. "UI/UX Developer").
   - Set suggestedTitle to "<Original Resume Title> - <Target Role>" (e.g. "First - UI/UX Developer").
3. PROFESSIONAL SUMMARY:
   - Completely rewrite the professional summary to position the candidate as a high-impact fit for this target role.
   - Highlight the candidate's genuine experience with interactive interfaces, responsive design, frontend technologies, user-focused applications, or target requirements based strictly on their real background.
4. EXPERIENCE DESCRIPTIONS:
   - Actively rewrite each experience entry's description. Highlight relevant user-facing contributions, responsive layouts, frontend engineering, and cross-functional collaboration.
   - Use high-impact action verbs. Preserve exact real company names, roles, and dates.
5. PROJECT DESCRIPTIONS:
   - Rewrite project descriptions to emphasize user experience, interface design, interactive components, responsive web standards, and genuine technologies used.
6. SKILLS:
   - Prioritize and reorder the candidate's skills so the most relevant skills appear at the very beginning of the list.
   - DO NOT invent skills the candidate does not have (e.g. do not add Figma or tools unless already present).
7. CERTIFICATIONS & ACHIEVEMENTS:
   - Highlight and prioritize credentials relevant to the target job.
8. STRICT ANTI-HALLUCINATION RULES:
   - DO NOT invent fake companies, fake job titles, fake degrees, fake universities, fake certifications, fake projects, or fake tools.
   - Only elevate, reorganize, rewrite, and emphasize facts and tools from the candidate's authentic background.

You MUST output ONLY a valid JSON object matching this schema:
{
  "targetRole": "string",
  "suggestedTitle": "string",
  "tailoringSummary": "Concise 2-sentence summary of how the resume content was tailored for this target role",
  "tailoredResume": {
    "personalDetails": {
      "fullName": "string",
      "professionalTitle": "string",
      "email": "string",
      "phone": "string",
      "location": "string",
      "linkedin": "string",
      "github": "string",
      "portfolio": "string",
      "summary": "string"
    },
    "education": [
      {
        "institution": "string",
        "degree": "string",
        "year": "string"
      }
    ],
    "experience": [
      {
        "company": "string",
        "role": "string",
        "duration": "string",
        "description": "string"
      }
    ],
    "projects": [
      {
        "name": "string",
        "technologies": "string",
        "description": "string",
        "link": "string"
      }
    ],
    "skills": ["string"],
    "certifications": [
      {
        "name": "string",
        "issuer": "string",
        "year": "string"
      }
    ],
    "achievements": [
      {
        "title": "string",
        "description": "string"
      }
    ],
    "additionalInfo": {
      "languages": "string",
      "interests": "string"
    }
  }
}`;

// POST /api/ai/tailor - Generate AI tailored resume OR save tailoring record
const createTailor = async (req, res) => {
  try {
    const { resume, resumeId, jobDescription, tailoredResult, newResume, targetRole: userTargetRole, action } = req.body;
    const targetResumeId = resume || resumeId;

    // 1. Validate required fields
    if (!targetResumeId) {
      return res.status(400).json({ message: 'Resume ID is required' });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    // 2. Validate resume ObjectId format
    if (!mongoose.Types.ObjectId.isValid(targetResumeId)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    // 3. Verify that the resume exists
    const existingResume = await Resume.findById(targetResumeId);
    if (!existingResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // 4. Verify ownership: user must own the resume
    if (existingResume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    // -------------------------------------------------------------------------
    // CASE A: SAVE RECORD (if tailoredResult is provided and action is not 'tailor')
    // -------------------------------------------------------------------------
    if (tailoredResult && action !== 'tailor') {
      const tailorData = {
        user: req.user.id,
        resume: existingResume._id,
        jobDescription: jobDescription.trim(),
        tailoredResult: tailoredResult.trim(),
      };
      if (userTargetRole) {
        tailorData.targetRole = userTargetRole.trim();
      }
      if (newResume && mongoose.Types.ObjectId.isValid(newResume)) {
        tailorData.newResume = newResume;
      }

      const newTailor = await Tailor.create(tailorData);
      return res.status(201).json(newTailor);
    }

    // -------------------------------------------------------------------------
    // CASE B: GENERATE AI TAILORED RESUME VIA GEMINI
    // -------------------------------------------------------------------------
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      console.error('[Gemini AI] GEMINI_API_KEY is not configured in backend/.env');
      return res.status(500).json({
        message: 'GEMINI_API_KEY is not configured in backend/.env. Please add a valid Gemini API key.',
      });
    }

    // Strip heavy base64 images from prompt to keep latency ultra-fast (<2s)
    const cleanResumeForPrompt = {
      title: existingResume.title,
      personalDetails: {
        fullName: existingResume.personalDetails?.fullName || '',
        professionalTitle: existingResume.personalDetails?.professionalTitle || '',
        email: existingResume.personalDetails?.email || '',
        phone: existingResume.personalDetails?.phone || '',
        location: existingResume.personalDetails?.location || '',
        linkedin: existingResume.personalDetails?.linkedin || '',
        github: existingResume.personalDetails?.github || '',
        portfolio: existingResume.personalDetails?.portfolio || '',
        summary: existingResume.personalDetails?.summary || '',
      },
      education: existingResume.education || [],
      experience: existingResume.experience || [],
      projects: existingResume.projects || [],
      skills: existingResume.skills || [],
      certifications: (existingResume.certifications || []).map((c) => ({
        name: typeof c === 'string' ? c : c.name || '',
        issuer: typeof c === 'string' ? '' : c.issuer || '',
        year: typeof c === 'string' ? '' : c.year || '',
      })),
      achievements: existingResume.achievements || [],
      additionalInfo: existingResume.additionalInfo || {},
    };

    const prompt = `CANDIDATE'S ORIGINAL RESUME:\n${JSON.stringify(cleanResumeForPrompt, null, 2)}\n\nTARGET JOB DESCRIPTION:\n${jobDescription.trim()}`;

    const ai = new GoogleGenAI({ apiKey });

    const generateTailoredWithModel = async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: TAILOR_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
      const textOutput = response?.text?.trim();
      if (!textOutput) throw new Error(`Empty response from ${model}`);
      const cleanJson = textOutput.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      return JSON.parse(cleanJson);
    };

    let generatedData = null;
    let lastError = null;

    const fastModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
    for (const model of fastModels) {
      try {
        generatedData = await generateTailoredWithModel(model);
        if (generatedData && generatedData.tailoredResume) break;
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Tailor] Model ${model} failed: ${err.message}`);
      }
    }

    if (!generatedData || !generatedData.tailoredResume) {
      throw lastError || new Error('Failed to generate tailored resume from Gemini.');
    }

    // Merge original photo and certificate images back into tailoredResume so they are preserved
    if (existingResume.personalDetails?.photo) {
      generatedData.tailoredResume.personalDetails.photo = existingResume.personalDetails.photo;
    }

    if (Array.isArray(generatedData.tailoredResume.certifications) && Array.isArray(existingResume.certifications)) {
      generatedData.tailoredResume.certifications = generatedData.tailoredResume.certifications.map((c, idx) => {
        const origCert = existingResume.certifications[idx];
        return {
          ...c,
          image: (typeof origCert === 'object' && origCert?.image) || '',
        };
      });
    }

    // Ensure title format: "<Original Title> - <Target Role>"
    const targetRole = (generatedData.targetRole || 'Tailored Position').trim();
    let suggestedTitle = (generatedData.suggestedTitle || '').trim();
    if (!suggestedTitle || !suggestedTitle.includes(existingResume.title)) {
      suggestedTitle = `${existingResume.title} - ${targetRole}`;
    }

    // Ensure tailored professionalTitle is set
    if (!generatedData.tailoredResume.personalDetails.professionalTitle || generatedData.tailoredResume.personalDetails.professionalTitle === existingResume.personalDetails?.professionalTitle) {
      generatedData.tailoredResume.personalDetails.professionalTitle = targetRole;
    }

    return res.status(200).json({
      success: true,
      originalResumeId: existingResume._id,
      originalTitle: existingResume.title,
      template: existingResume.template,
      style: existingResume.style || 'professional',
      targetRole,
      suggestedTitle,
      tailoringSummary: generatedData.tailoringSummary || `Tailored for ${targetRole}`,
      originalContent: {
        title: existingResume.title,
        professionalTitle: existingResume.personalDetails?.professionalTitle || '',
        summary: existingResume.personalDetails?.summary || '',
        experience: existingResume.experience || [],
        projects: existingResume.projects || [],
        skills: existingResume.skills || [],
      },
      tailoredResume: generatedData.tailoredResume,
    });
  } catch (error) {
    const rawError = error?.message || String(error);
    const sanitizedError = rawError
      .replace(/AIza[0-9A-Za-z_-]{35}/g, '[REDACTED_API_KEY]')
      .replace(/AQ\.[0-9A-Za-z_-]+/g, '[REDACTED_API_KEY]')
      .replace(/key=[0-9A-Za-z_-]+/gi, 'key=[REDACTED]');

    console.error('[Gemini AI Tailor Error]:', sanitizedError);
    return res.status(500).json({
      message: `Gemini tailoring error: ${sanitizedError}`,
    });
  }
};

// GET /api/ai/tailor - Get only tailoring records belonging to the logged-in user
const getTailors = async (req, res) => {
  try {
    const tailors = await Tailor.find({ user: req.user.id })
      .populate('resume', 'title')
      .populate('newResume', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json(tailors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const GEMINI_SYSTEM_INSTRUCTION = `You are a professional resume editor.
Improve the user's resume text for clarity, grammar, professional wording, concise language, strong action verbs and impact.

Never invent:
- companies
- job titles
- technologies
- numbers
- percentages
- achievements
- awards
- qualifications
- dates
- responsibilities

Only improve information already supplied by the user.

Return only the improved resume text.`;

// POST /api/ai/generate - Real AI resume text enhancement via Gemini SDK
const generateSuggestion = async (req, res) => {
  try {
    const { text, section } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Text to improve is required' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      console.error('[Gemini AI] GEMINI_API_KEY is not configured in backend/.env');
      return res.status(500).json({
        message: 'GEMINI_API_KEY is not configured in backend/.env. Please add a valid Gemini API key to backend/.env (get one from Google AI Studio: https://aistudio.google.com/apikey).',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Resume Section: ${section || 'General'}\nUser text: "${text.trim()}"`;

    const generateWithModel = async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });
      const textOutput = response?.text?.trim().replace(/^["']|["']$/g, '');
      if (!textOutput) throw new Error(`Empty response from ${model}`);
      return textOutput;
    };

    let suggestion = '';
    let lastError = null;

    // 1. Race top ultra-fast flash-lite models for sub-second responses (~0.7s)
    try {
      suggestion = await Promise.any([
        generateWithModel('gemini-3.5-flash-lite'),
        generateWithModel('gemini-3.1-flash-lite'),
      ]);
    } catch (raceErr) {
      console.warn('[Gemini AI] Primary fast-lite models busy, falling back to remaining models...');
      const fallbackModels = [
        'gemini-2.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash',
        'gemini-2.5-flash',
      ];
      for (const model of fallbackModels) {
        try {
          suggestion = await generateWithModel(model);
          if (suggestion) break;
        } catch (err) {
          lastError = err;
          console.warn(`[Gemini AI] Model ${model} failed (${err.status || err.message})`);
        }
      }
    }

    if (!suggestion) {
      throw lastError || new Error('No suggestion generated from Gemini.');
    }

    return res.status(200).json({
      suggestion,
    });
  } catch (error) {
    // Redact any potential API key tokens from the error log and message
    const rawError = error?.message || String(error);
    const sanitizedError = rawError
      .replace(/AIza[0-9A-Za-z_-]{35}/g, '[REDACTED_API_KEY]')
      .replace(/AQ\.[0-9A-Za-z_-]+/g, '[REDACTED_API_KEY]')
      .replace(/key=[0-9A-Za-z_-]+/gi, 'key=[REDACTED]');

    console.error('[Gemini AI Error]:', sanitizedError);
    return res.status(500).json({
      message: `Gemini generation error: ${sanitizedError}`,
    });
  }
};

// Dispatcher for POST /api/ai/suggestions:
// - If req.body.text is provided -> generates AI suggestion via Gemini
// - If req.body.suggestion is provided -> saves accepted suggestion record
const handleSuggestions = async (req, res) => {
  if (req.body && req.body.text !== undefined) {
    return generateSuggestion(req, res);
  }
  return createSuggestion(req, res);
};

// POST /api/ai/ats-score - Deterministic ATS scoring simulation
const calculateATSScore = async (req, res) => {
  try {
    const { resume, resumeId, jobDescription, targetKeywords } = req.body;
    const targetResumeId = resume || resumeId;

    // 1. Validate required fields
    if (!targetResumeId) {
      return res.status(400).json({ message: 'Resume ID is required' });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    // 2. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(targetResumeId)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    // 3. Verify resume exists
    const existingResume = await Resume.findById(targetResumeId);
    if (!existingResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // 4. Verify ownership: user must own the resume
    if (existingResume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    // 5. Run deterministic ATS simulation
    const atsResult = calculateATS({
      resume: existingResume,
      jobDescription: jobDescription.trim(),
      targetKeywords,
    });

    // 6. Persist ATS analysis record for admin analytics
    const analysisRecord = await ATSAnalysis.create({
      user: req.user.id,
      resume: existingResume._id,
      jobDescription: jobDescription.trim(),
      score: atsResult.score,
      matchedKeywords: atsResult.matchedKeywords,
      missingKeywords: atsResult.missingKeywords,
      totalKeywords: atsResult.totalKeywords,
    });

    // 7. Return structured response
    return res.status(200).json({
      score: atsResult.score,
      matchedKeywords: atsResult.matchedKeywords,
      missingKeywords: atsResult.missingKeywords,
      totalKeywords: atsResult.totalKeywords,
      analysisId: analysisRecord._id,
      createdAt: analysisRecord.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/ai/ats-score - Return user's ATS analyses
const getUserATSAnalyses = async (req, res) => {
  try {
    const { resumeId } = req.query;
    const query = { user: req.user.id };
    if (resumeId && mongoose.Types.ObjectId.isValid(resumeId)) {
      query.resume = resumeId;
    }

    const analyses = await ATSAnalysis.find(query)
      .populate('resume', 'title')
      .sort({ createdAt: -1 });

    return res.status(200).json(analyses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSuggestion,
  getSuggestions,
  createTailor,
  getTailors,
  generateSuggestion,
  handleSuggestions,
  calculateATSScore,
  getUserATSAnalyses,
};

