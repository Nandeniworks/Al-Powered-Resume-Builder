const crypto = require('crypto');
const mongoose = require('mongoose');
const Share = require('../models/Share');
const Resume = require('../models/Resume');

// POST /api/share - Create a unique share record for an owned resume
const createShare = async (req, res) => {
  try {
    const resumeId = req.body.resume || req.body.resumeId;

    if (!resumeId) {
      return res.status(400).json({ message: 'Resume ID is required' });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ message: 'Invalid resume ID format' });
    }

    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Verify ownership: logged-in user must own the resume
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    // Generate unique shareId (client cannot set it manually)
    const shareId = crypto.randomBytes(8).toString('hex');

    const share = await Share.create({
      resume: resumeId,
      shareId,
      isPublic: true,
    });

    res.status(201).json(share);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/share/:id - Retrieve share record by shareId with populated resume
const getShareById = async (req, res) => {
  try {
    const { id } = req.params; // shareId

    const share = await Share.findOne({ shareId: id }).populate({
      path: 'resume',
      select: '-user',
    });

    if (!share) {
      return res.status(404).json({ message: 'Share record not found' });
    }

    res.status(200).json(share);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createShare,
  getShareById,
};
