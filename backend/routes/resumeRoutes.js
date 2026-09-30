const express = require('express');
const {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  generatePDF,
} = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All resume endpoints require JWT authentication
router.use(authMiddleware);

router.post('/', createResume);
router.get('/', getResumes);
router.get('/:id/pdf', generatePDF);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

module.exports = router;
