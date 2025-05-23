const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  item: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: "Available" },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  image: { type: String, default: null }, // Store image URL or null
  userEmail: { type: String, required: true }, // Store email from JWT
});

module.exports = mongoose.model("Resource", ResourceSchema);
