const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  type: { type: String, required: true },
  details: { type: String, required: true },
  userEmail: { type: String, required: true }, // Stores the email of the user who sent the alert
  timestamp: { type: Date, default: () => Date.now() },
  shared: { type: Boolean, default: false }, // New field to track if the alert is shared
});

module.exports = mongoose.model("Alert", AlertSchema);
