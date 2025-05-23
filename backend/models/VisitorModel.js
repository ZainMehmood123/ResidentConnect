const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    checkInTime: { type: Date, required: true },
    photo: { type: String, required: false }, // Store image URL or base64 string
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    userEmail: { type: String, required: true }, // Store the logged-in user's email
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", VisitorSchema);
