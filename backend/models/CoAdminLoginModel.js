const mongoose = require('mongoose');

// Define the schema for CoAdminLogin
const CoAdminLoginSchema = new mongoose.Schema({
  coadmin_name: {
    type: String,
    default: 'CoAdmin', // Default value set to 'CoAdmin'
  },
  society_name: {
    type: String,
    required: true,
    ref: 'RegisteredSociety', // Reference to RegisteredSociety collection
  },
  society_code: {
    type: String,
    required: true,
   // unique: true, // Society code doesn't need to be unique
  },
  email: {
    type: String,
    required: true,
   // unique: true, // Ensure email is unique
    lowercase: true, // Convert email to lowercase before saving
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please fill a valid email address'], // Email validation
  },
  password: {
    type: String,
    required: true,
  },
}, {
  collection: 'societyadminlogins' // Explicitly define the collection name
});

// Method to compare the password (for login)
CoAdminLoginSchema.methods.comparePassword = function (candidatePassword) {
  return candidatePassword === this.password; // Compare plaintext password
};

module.exports = mongoose.model('CoAdminLogin', CoAdminLoginSchema);
