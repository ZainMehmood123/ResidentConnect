const mongoose = require("mongoose");

const mcqAnswerSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true }
});

const feedbackSchema = new mongoose.Schema({
    userEmail: { type: String, required: true }, // Store user email
    category: { type: String, required: true },
    mcqAnswers: { type: [mcqAnswerSchema], required: true }, // Store array of MCQs
    selectedEvent: { type: String, required: false, default: "Not provided" }, // ✅ Default value
    selectedIssue: { type: String, required: false, default: "Not provided" }, // ✅ Default value
    generalFeedback: { type: String, required: false },
    createdAt: { type: Date, default: Date.now } // Store timestamp
});

module.exports = mongoose.model("Feedback", feedbackSchema);
