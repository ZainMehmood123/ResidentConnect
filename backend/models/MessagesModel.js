const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  type: { type: String, default: "text", enum: ["text", "image"] }, // Support text or image
  uri: { type: String }, // For image messages
  time: { type: String, required: true }, // Store time as provided by frontend
  status: { type: String, default: "sent", enum: ["sending", "sent", "read"] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);