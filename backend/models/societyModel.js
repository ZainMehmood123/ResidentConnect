const mongoose = require('mongoose');

// Define the schema for the society
const societySchema = new mongoose.Schema({
  society_name: { type: String, required: true },
  address: { type: String, required: true },
  contact_number: { type: String, required: true },
  email: { type: String, required: true },
  website: { type: String },
  read: { type: Boolean, default: false }, 
});

// Create the model from the schema
const Society = mongoose.model('SocietiesRequest', societySchema);

module.exports = Society;
