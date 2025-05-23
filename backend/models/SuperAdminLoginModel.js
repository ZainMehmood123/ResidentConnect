const mongoose = require('mongoose');

// Define the SuperAdminLogin schema
const superAdminLoginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure unique usernames
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address'], // Email validation
  },
  password: {
    type: String,
    required: true, // Plain text password
  },
});

// Export the model based on the schema
module.exports = mongoose.model('SuperAdminLogin', superAdminLoginSchema);
