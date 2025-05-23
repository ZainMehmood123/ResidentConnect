const mongoose = require('mongoose');

const RegisteredSocietySchema = new mongoose.Schema({
  society_name: {
    type: String,
    required: true,
    trim: true,
  },
  society_code: {
    type: String,
    required: true,
    unique: true, // Ensure society code is unique
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RegisteredSocieties', RegisteredSocietySchema);
