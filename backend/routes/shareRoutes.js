const express = require('express');
const { createShare, getShareById } = require('../controllers/shareController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/share requires JWT authentication
router.post('/', authMiddleware, createShare);

// GET /api/share/:id retrieves shared resume by shareId
router.get('/:id', getShareById);

module.exports = router;
