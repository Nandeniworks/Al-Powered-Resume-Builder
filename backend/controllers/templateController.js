const mongoose = require('mongoose');
const Template = require('../models/Template');

// GET /api/templates - Return all templates
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/templates/:id - Return one template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid template ID format' });
    }

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/templates - Create a new template (Admin restricted)
const createTemplate = async (req, res) => {
  try {
    const { name, description, layout } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    const template = await Template.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      layout: layout || 'standard',
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/templates/:id - Update an existing template (Admin restricted)
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid template ID format' });
    }

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { name, description, layout } = req.body;

    // Update only allowed fields (never modify _id)
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Template name cannot be empty' });
      }
      template.name = name.trim();
    }
    if (description !== undefined) template.description = description.trim();
    if (layout !== undefined) template.layout = layout;

    const updatedTemplate = await template.save();
    res.status(200).json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
};
