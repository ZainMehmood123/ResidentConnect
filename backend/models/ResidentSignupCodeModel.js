const mongoose = require('mongoose');

// Define the schema for Resident Signup Codes
const ResidentSignupCodeSchema = new mongoose.Schema({
  society_name: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces
  },
  society_code: {
    type: String,
    required: true, // Society code must be provided
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Ensures email is unique
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email format validation
  },
  residentsignupcode: {
    type: String,
    required: true,
    unique: true, // Ensures resident signup code is unique
  },
  created_at: {
    type: Date,
    default: Date.now, // Automatically sets the creation date
  },
});

// Export the model
module.exports = mongoose.model('ResidentsSignupCode', ResidentSignupCodeSchema);
