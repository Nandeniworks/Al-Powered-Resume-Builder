const Template = require('../models/Template');
const Analytics = require('../models/Analytics');
const ATSAnalysis = require('../models/ATSAnalysis');

// GET /api/admin/templates - Get all templates for admin
const getAdminTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/analytics - Get platform analytics (views, downloads, and ATS analytics)
const getAdminAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.find().populate('resume', 'title');

    // Fetch ATS analysis records for platform ATS analytics
    const atsAnalyses = await ATSAnalysis.find()
      .populate('resume', 'title')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const totalAnalyses = atsAnalyses.length;
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    const scoreDistribution = {
      below60: 0,
      between60And79: 0,
      between80And100: 0,
    };

    if (totalAnalyses > 0) {
      const scores = atsAnalyses.map((a) => a.score);
      const sum = scores.reduce((acc, s) => acc + s, 0);
      averageScore = Math.round((sum / totalAnalyses) * 10) / 10;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);

      scores.forEach((s) => {
        if (s < 60) scoreDistribution.below60 += 1;
        else if (s < 80) scoreDistribution.between60And79 += 1;
        else scoreDistribution.between80And100 += 1;
      });
    }

    const atsAnalytics = {
      totalAnalyses,
      averageScore,
      highestScore,
      lowestScore,
      scoreDistribution,
      recentAnalyses: atsAnalyses.slice(0, 15),
    };

    // If caller explicitly asks for legacy raw array format (?format=raw or ?legacy=true)
    if (req.query.format === 'raw' || req.query.legacy === 'true') {
      return res.status(200).json(analytics);
    }

    res.status(200).json({
      analytics,
      totalViews: analytics.reduce((sum, a) => sum + (a.views || 0), 0),
      totalDownloads: analytics.reduce((sum, a) => sum + (a.downloads || 0), 0),
      atsAnalytics,
      totalAnalyses,
      averageScore,
      highestScore,
      lowestScore,
      scoreDistribution,
      recentAnalyses: atsAnalyses.slice(0, 15),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/analytics/ats - Dedicated endpoint for ATS analytics
const getAdminATSAnalytics = async (req, res) => {
  try {
    const atsAnalyses = await ATSAnalysis.find()
      .populate('resume', 'title')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const totalAnalyses = atsAnalyses.length;
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    const scoreDistribution = {
      below60: 0,
      between60And79: 0,
      between80And100: 0,
    };

    if (totalAnalyses > 0) {
      const scores = atsAnalyses.map((a) => a.score);
      const sum = scores.reduce((acc, s) => acc + s, 0);
      averageScore = Math.round((sum / totalAnalyses) * 10) / 10;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);

      scores.forEach((s) => {
        if (s < 60) scoreDistribution.below60 += 1;
        else if (s < 80) scoreDistribution.between60And79 += 1;
        else scoreDistribution.between80And100 += 1;
      });
    }

    res.status(200).json({
      totalAnalyses,
      averageScore,
      highestScore,
      lowestScore,
      scoreDistribution,
      recentAnalyses: atsAnalyses.slice(0, 20),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminTemplates,
  getAdminAnalytics,
  getAdminATSAnalytics,
};
