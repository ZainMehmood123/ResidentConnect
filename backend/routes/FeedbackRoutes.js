const express = require("express");
const Feedback = require("../models/FeedbackModel"); // Ensure correct path
const router = express.Router();

// Submit Feedback Route
router.post("/save", async (req, res) => {
    try {
        console.log("Received feedback request:", req.body); // ✅ Log request body

        const { userEmail, category, mcqAnswers, selectedEvent, selectedIssue, generalFeedback } = req.body;

        // Validate required fields
        if (!userEmail || !category || !mcqAnswers) { // ✅ Removed required check for selectedEvent & selectedIssue
            console.log("Validation Error: Missing required fields");
            return res.status(400).json({ error: "userEmail, category, and mcqAnswers are required" });
        }

        // Validate mcqAnswers format
        if (!Array.isArray(mcqAnswers) || !mcqAnswers.every(ans => ans.question && ans.answer)) {
            console.log("Validation Error: Invalid mcqAnswers format");
            return res.status(400).json({ error: "Invalid mcqAnswers format" });
        }

        const newFeedback = new Feedback({
            userEmail,
            category,
            mcqAnswers,
            selectedEvent: selectedEvent || "Not provided", // ✅ Store default values if null
            selectedIssue: selectedIssue || "Not provided", // ✅ Store default values if null
            generalFeedback
        });

        await newFeedback.save();
        console.log("Feedback saved successfully!"); // ✅ Log success

        res.status(201).json({ message: "Feedback submitted successfully" });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
