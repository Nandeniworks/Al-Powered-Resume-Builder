/**
 * ATS (Applicant Tracking System) Score Simulator and Keyword Analyzer
 * Deterministic keyword matching and scoring algorithm.
 */

// Comprehensive curated list of industry and technical keywords
const KNOWN_KEYWORDS = [
  // Multi-word phrases (checked first to avoid fragment partial matches)
  'REST API',
  'REST APIs',
  'RESTful API',
  'Node.js',
  'React.js',
  'React Native',
  'Next.js',
  'Vue.js',
  'Angular.js',
  'Express.js',
  'Full Stack',
  'Front End',
  'Back End',
  'CI/CD',
  'Machine Learning',
  'Deep Learning',
  'Artificial Intelligence',
  'Natural Language Processing',
  'Computer Vision',
  'Data Science',
  'Cloud Computing',
  'Object Oriented Programming',
  'Unit Testing',
  'Integration Testing',
  'End-to-End Testing',
  'Test Driven Development',
  'Version Control',
  'Responsive Design',
  'Web Development',
  'Software Engineering',
  'System Design',
  'Microservices',
  'Agile',
  'Scrum',
  'Kanban',
  'DevOps',

  // Single-word technologies and skills
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'React',
  'Node',
  'Express',
  'MongoDB',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'GraphQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'Git',
  'GitHub',
  'GitLab',
  'HTML',
  'HTML5',
  'CSS',
  'CSS3',
  'Sass',
  'Tailwind',
  'Bootstrap',
  'Redux',
  'Webpack',
  'Vite',
  'Linux',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Kafka',
  'RabbitMQ',
  'Elasticsearch',
  'Figma',
  'Jira',
  'OAuth',
  'JWT',
  'NoSQL',
  'Firebase',
  'NextJS',
  'VueJS',
];

// Common English stop-words to exclude from automatic extraction
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let', 'me', 'more',
  'most', 'must', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
  'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was',
  'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  // Common job description boilerplate filler words
  'looking', 'candidate', 'experience', 'developer', 'engineer', 'role', 'team', 'work', 'working',
  'years', 'strong', 'good', 'ability', 'knowledge', 'responsibilities', 'qualifications', 'requirements',
  'plus', 'preferred', 'required', 'ideal', 'must', 'skills', 'proven', 'hands', 'opportunity', 'company',
  'joining', 'seeking', 'successful', 'degree', 'field', 'related', 'environment', 'building', 'across',
]);

/**
 * Extract meaningful target keywords from a job description string.
 * @param {string} jobDescription
 * @returns {string[]}
 */
function extractJobKeywords(jobDescription) {
  if (!jobDescription || typeof jobDescription !== 'string') {
    return [];
  }

  const rawText = jobDescription;
  const foundKeywords = [];
  const foundLowerSet = new Set();

  // 1. Scan for known multi-word & single-word technical terms
  // Sort known keywords by length descending so longer phrases match first
  const sortedKeywords = [...KNOWN_KEYWORDS].sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');

    if (regex.test(rawText)) {
      const lower = keyword.toLowerCase();
      // If a longer variant already matched (e.g. 'REST API' already added, don't add 'REST' or 'API'; if 'Node.js' already added, don't add 'Node')
      const isSubword = [...foundLowerSet].some((existing) => {
        return existing.includes(lower) && existing !== lower;
      });

      if (!isSubword && !foundLowerSet.has(lower)) {
        foundKeywords.push(keyword);
        foundLowerSet.add(lower);
      }
    }
  }

  // 2. Extract any capitalized acronyms or technical terms not yet caught (e.g. SDK, CLI)
  const tokenRegex = /\b[A-Za-z0-9+#.-]{2,}\b/g;
  let match;
  while ((match = tokenRegex.exec(rawText)) !== null) {
    const word = match[0].trim();
    const lower = word.toLowerCase();

    if (STOP_WORDS.has(lower) || foundLowerSet.has(lower)) {
      continue;
    }

    // Don't add if it's a sub-word of an already captured multi-word term
    const isSubword = [...foundLowerSet].some((existing) => existing.includes(lower));
    if (isSubword) continue;

    // Include if all uppercase (like SDK, CLI) or CamelCase
    const isAcronym = /^[A-Z0-9]{2,6}$/.test(word);
    const isCapitalized = /^[A-Z][a-z]+[A-Z0-9]/.test(word);

    if (isAcronym || isCapitalized) {
      foundKeywords.push(word);
      foundLowerSet.add(lower);
    }
  }

  // 3. Fallback: If job description is short/unusual and no keywords matched, extract non-stop words
  if (foundKeywords.length === 0) {
    const words = rawText.match(/\b[A-Za-z]{3,}\b/g) || [];
    for (const w of words) {
      const lower = w.toLowerCase();
      if (!STOP_WORDS.has(lower) && !foundLowerSet.has(lower)) {
        foundKeywords.push(w);
        foundLowerSet.add(lower);
      }
      if (foundKeywords.length >= 10) break;
    }
  }

  return foundKeywords;
}

/**
 * Extract all text content from a Resume document into a single normalized string.
 * @param {object} resume
 * @returns {string}
 */
function extractResumeText(resume) {
  if (!resume) return '';

  const chunks = [];

  // Title
  if (resume.title) chunks.push(resume.title);

  // Personal details
  if (resume.personalDetails) {
    const { professionalTitle, summary, location } = resume.personalDetails;
    if (professionalTitle) chunks.push(professionalTitle);
    if (summary) chunks.push(summary);
    if (location) chunks.push(location);
  }

  // Skills
  if (Array.isArray(resume.skills)) {
    resume.skills.forEach((s) => {
      if (typeof s === 'string') chunks.push(s);
      else if (s && s.name) chunks.push(s.name);
    });
  }

  // Experience
  if (Array.isArray(resume.experience)) {
    resume.experience.forEach((exp) => {
      if (exp.role) chunks.push(exp.role);
      if (exp.company) chunks.push(exp.company);
      if (exp.description) chunks.push(exp.description);
    });
  }

  // Projects
  if (Array.isArray(resume.projects)) {
    resume.projects.forEach((proj) => {
      if (proj.name) chunks.push(proj.name);
      if (proj.technologies) chunks.push(proj.technologies);
      if (proj.description) chunks.push(proj.description);
    });
  }

  // Education
  if (Array.isArray(resume.education)) {
    resume.education.forEach((edu) => {
      if (edu.degree) chunks.push(edu.degree);
      if (edu.institution) chunks.push(edu.institution);
    });
  }

  // Certifications
  if (Array.isArray(resume.certifications)) {
    resume.certifications.forEach((c) => {
      if (typeof c === 'string') chunks.push(c);
      else if (c && c.name) chunks.push(c.name);
      if (c && c.issuer) chunks.push(c.issuer);
    });
  }

  // Achievements
  if (Array.isArray(resume.achievements)) {
    resume.achievements.forEach((a) => {
      if (typeof a === 'string') chunks.push(a);
      else if (a && a.title) chunks.push(a.title);
      if (a && a.description) chunks.push(a.description);
    });
  }

  return chunks.join(' ');
}

/**
 * Check if a normalized keyword is present in the resume text corpus.
 * @param {string} keyword
 * @param {string} resumeText
 * @returns {boolean}
 */
function isKeywordInText(keyword, resumeText) {
  if (!keyword || !resumeText) return false;

  const kw = keyword.trim();
  const lowerResume = ` ${resumeText.toLowerCase()} `;

  // Specific canonical variations
  const variants = [kw.toLowerCase()];

  // Handle tech variants
  if (/^node(\.js)?$/i.test(kw)) {
    variants.push('node.js', 'nodejs', 'node js');
  } else if (/^react(\.js| native)?$/i.test(kw)) {
    variants.push('react', 'react.js', 'reactjs');
  } else if (/^rest(\s*apis?)?$/i.test(kw) || /restful/i.test(kw)) {
    variants.push('rest api', 'rest apis', 'restful api', 'restful apis', 'rest');
  } else if (/^ci\/?cd$/i.test(kw)) {
    variants.push('ci/cd', 'ci cd', 'cicd', 'continuous integration');
  } else if (/^javascript$/i.test(kw)) {
    variants.push('javascript', 'js');
  } else if (/^typescript$/i.test(kw)) {
    variants.push('typescript', 'ts');
  }

  for (const variant of variants) {
    const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9_#+])${escaped}([^a-zA-Z0-9_#+]|$)`, 'i');
    if (regex.test(lowerResume)) {
      return true;
    }
  }

  return false;
}

/**
 * Deterministic ATS Scoring simulation.
 * @param {object} params
 * @param {object} params.resume - Resume mongoose document or plain object
 * @param {string} params.jobDescription - Job description text
 * @param {string[]} [params.targetKeywords] - Optional explicit target keywords array
 * @returns {{ score: number, matchedKeywords: string[], missingKeywords: string[], totalKeywords: number }}
 */
function calculateATS({ resume, jobDescription, targetKeywords }) {
  // 1. Determine target keywords
  let targets = [];
  if (Array.isArray(targetKeywords) && targetKeywords.length > 0) {
    targets = [...new Set(targetKeywords.map((k) => String(k).trim()).filter(Boolean))];
  } else {
    targets = extractJobKeywords(jobDescription || '');
  }

  // 2. Extract resume text corpus
  const resumeText = extractResumeText(resume);

  // 3. Match keywords against resume
  const matchedKeywords = [];
  const missingKeywords = [];

  targets.forEach((keyword) => {
    if (isKeywordInText(keyword, resumeText)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const totalKeywords = targets.length;
  const score = totalKeywords > 0 ? Math.round((matchedKeywords.length / totalKeywords) * 100) : 0;

  return {
    score,
    matchedKeywords,
    missingKeywords,
    totalKeywords,
  };
}

module.exports = {
  calculateATS,
  extractJobKeywords,
  extractResumeText,
  isKeywordInText,
  KNOWN_KEYWORDS,
};
