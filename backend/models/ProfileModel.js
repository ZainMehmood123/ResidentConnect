const mongoose = require('mongoose');

// Define the schema for the profile
const profileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Ensures email is unique
    },
    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
    },
    Gender: {
      type: String,
      required: true,
    },
    Password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String, // URL or base64 string
      default: null,
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create the Profile model
module.exports = mongoose.model('Profileaccounts', profileSchema);
