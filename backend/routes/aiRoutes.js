const express = require('express');
const {
  createSuggestion,
  getSuggestions,
  createTailor,
  getTailors,
  generateSuggestion,
  handleSuggestions,
} = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All AI endpoints require JWT authentication
router.use(authMiddleware);

// AI Generation (direct alias)
router.post('/generate', generateSuggestion);

// AI Suggestions: routes generation (if text provided) or persistence (if suggestion provided)
router.post('/suggestions', handleSuggestions);
router.get('/suggestions', getSuggestions);

// AI Tailor
router.post('/tailor', createTailor);
router.get('/tailor', getTailors);

module.exports = router;
