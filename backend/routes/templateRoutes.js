const express = require('express');
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
} = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public endpoints to browse templates
router.get('/', getTemplates);
router.get('/:id', getTemplateById);

// Admin-only template management endpoints
router.post('/', authMiddleware, roleMiddleware('admin'), createTemplate);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateTemplate);

module.exports = router;
