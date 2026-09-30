const express = require('express');
const {
  getViewAnalytics,
  getDownloadAnalytics,
} = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All analytics endpoints require JWT authentication
router.use(authMiddleware);

router.get('/views', getViewAnalytics);
router.get('/downloads', getDownloadAnalytics);

module.exports = router;
