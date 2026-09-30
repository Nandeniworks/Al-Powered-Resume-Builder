const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    personalDetails: {
      fullName: { type: String, default: '' },
      professionalTitle: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      summary: { type: String, default: '' },
      photo: { type: String, default: '' },
    },
    education: [
      {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        year: { type: String, default: '' },
      },
    ],
    experience: [
      {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        duration: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    projects: [
      {
        name: { type: String, default: '' },
        technologies: { type: String, default: '' },
        description: { type: String, default: '' },
        link: { type: String, default: '' },
      },
    ],
    skills: [{ type: String }],
    certifications: [
      {
        name: { type: String, default: '' },
        issuer: { type: String, default: '' },
        year: { type: String, default: '' },
        image: { type: String, default: '' },
      },
    ],
    achievements: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    additionalInfo: {
      languages: { type: String, default: '' },
      interests: { type: String, default: '' },
    },
    style: {
      type: String,
      enum: ['professional', 'creative'],
      default: 'professional',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
