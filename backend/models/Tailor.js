const mongoose = require('mongoose');

const tailorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    tailoredResult: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      default: '',
    },
    newResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tailor', tailorSchema);
