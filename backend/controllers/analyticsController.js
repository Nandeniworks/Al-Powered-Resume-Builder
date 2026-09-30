const Analytics = require('../models/Analytics');
const Resume = require('../models/Resume');

// GET /api/analytics/views - Return view analytics for logged-in user's resumes
const getViewAnalytics = async (req, res) => {
  try {
    const userResumes = await Resume.find({ user: req.user.id }).select('_id');
    const resumeIds = userResumes.map((r) => r._id);

    const viewsData = await Analytics.find({ resume: { $in: resumeIds } })
      .select('resume views')
      .populate('resume', 'title');

    res.status(200).json(viewsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/analytics/downloads - Return download analytics for logged-in user's resumes
const getDownloadAnalytics = async (req, res) => {
  try {
    const userResumes = await Resume.find({ user: req.user.id }).select('_id');
    const resumeIds = userResumes.map((r) => r._id);

    const downloadsData = await Analytics.find({ resume: { $in: resumeIds } })
      .select('resume downloads')
      .populate('resume', 'title');

    res.status(200).json(downloadsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getViewAnalytics,
  getDownloadAnalytics,
};
