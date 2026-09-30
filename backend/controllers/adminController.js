const Template = require('../models/Template');
const Analytics = require('../models/Analytics');

// GET /api/admin/templates - Get all templates for admin
const getAdminTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/analytics - Get all analytics records for admin
const getAdminAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.find().populate('resume', 'title');
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminTemplates,
  getAdminAnalytics,
};
