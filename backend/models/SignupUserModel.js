const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true }, // User's first name
  lastName: { type: String, required: true },  // User's last name
  email: { 
    type: String, 
    required: true, 
    unique: true,  // Ensure email is unique across the system
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email format validation
  },
  residentcode: { 
    type: String, 
    required: true, 
    unique: true, // Ensure residentcode is unique across the system
  },
  society_name: { 
    type: String, 
    required: true, // Ensure society name is provided
  },
  society_code: { 
    type: String, 
    required: true, // Ensure society code is provided
  },
  password: { 
    type: String, 
    required: true, // Password must be provided
  },
  status: { type: String, default: 'Active' },
}, { timestamps: true }); // Automatically includes createdAt and updatedAt timestamps

// Export the model so it can be used in other parts of the application
module.exports = mongoose.model('Residents', userSchema);
