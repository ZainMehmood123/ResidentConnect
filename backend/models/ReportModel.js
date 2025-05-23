const mongoose = require('mongoose');

// Define the schema for the reported issue
const reportSchema = new mongoose.Schema({
  issueType: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Pending',
  },
  timeResolution: {
    type: String,  // You can adjust this to a specific format if needed
    required: false,  // This is optional if not provided
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: [String],  // Array of image URLs or paths
    required: false,
  },
  location: {
    type: {
      lat: {
        type: Number,
        required: false,
      },
      lng: {
        type: Number,
        required: false,
      },
    },
    required: false,  // Optional for locations without coordinates
  },
  contactInfo: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userEmail:{
    type:String,
    required:true,
  }
});

// Create the model based on the schema
const Report = mongoose.model('ReportIssues', reportSchema);

module.exports = { Report };
