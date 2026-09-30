const express = require('express');
const {
  getAdminTemplates,
  getAdminAnalytics,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// All admin routes require JWT authentication and admin role
router.use(authMiddleware, roleMiddleware('admin'));

router.get('/templates', getAdminTemplates);
router.get('/analytics', getAdminAnalytics);

module.exports = router;
