const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const Notification= require('../models/NotificationModel');
const { Report } = require('../models/ReportModel');  // Import the Report model
const UserChat = require("../models/user");
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Make sure dotenv is loaded
const nodemailer = require('nodemailer');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user info to the request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid Token' });
  }
};

// Existing endpoint to get reporter ID
router.get("/get-reporter-id/:issueId", async (req, res) => {
  try {
    const { issueId } = req.params;
    console.log("Backend Received Issue ID:", issueId);

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ message: "Invalid Issue ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(issueId);

    const issue = await Report.findOne({ _id: objectId });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    console.log("Issue Found:", issue);

    const user = await UserChat.findOne({ email: issue.userEmail });

    if (!user) {
      return res.status(404).json({ message: "Reporter not found" });
    }

    console.log("Reporter Found:", user);

    res.json({
      reporterId: user._id,
      reporterName: user.name,
      issueType: issue.issueType,
    });
  } catch (error) {
    console.error("Error fetching reporter details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Existing endpoint to create a new report
// Create a transporter to send email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Endpoint to create a new report and add a notification
router.post('/issue', authenticateToken, async (req, res) => {
  const { issueType, timeResolution, description, images, location, contactInfo, userEmail } = req.body;

  if (!issueType || !description || !contactInfo) {
    return res.status(400).json({ message: 'Issue type, description, and contact info are required.' });
  }

  try {
    const newReport = new Report({
      issueType,
      timeResolution,
      description,
      images,
      location,
      contactInfo,
      createdAt: new Date(),
      userEmail,
      status: "Pending", // Default status
    });

    const savedReport = await newReport.save();

    // Create a notification for the report creation
    const notification = new Notification({
      userId: req.user.id, // Use logged-in user's ID from JWT
      title: `New Issue Reported: ${issueType}`,
      description: description, // Use the report description directly
      type: 'Issue Report', // Specific type for issue creation
      read: false,
    });
    await notification.save();

    // Send an email to the user after saving the report
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Issue Reported: ${issueType}`,
      text: `Hello,\n\nYour issue "${issueType}" has been successfully reported.\n\nDetails:\nDescription: ${description}\nLocation: ${location || 'Not specified'}\nContact Info: ${contactInfo}\nStatus: Pending\n\nThank you!`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully!',
      report: savedReport,
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Existing endpoint to fetch recent issues
router.get('/recent', async (req, res) => {
  try {
    const userEmail = req.query.userEmail;

    const issues = await Report.find({ userEmail: { $ne: userEmail } })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, issues });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch issues' });
  }
});

// Existing endpoint to fetch issues
router.get('/issues', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const myIssues = await Report.find({ userEmail }).sort({ createdAt: -1 });
    const otherIssues = await Report.find({ userEmail: { $ne: userEmail } }).sort({ createdAt: -1 });

    console.log("Backend Response:", JSON.stringify({ success: true, myIssues, otherIssues }, null, 2));

    res.json({ success: true, myIssues, otherIssues });
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch issues' });
  }
});

// New endpoint to update issue status
router.patch('/update-status/:issueId', authenticateToken, async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body; // Expecting { status: "Resolved" }

    // Validate issueId
    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ message: "Invalid Issue ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(issueId);

    // Find the issue
    const issue = await Report.findOne({ _id: objectId });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if the authenticated user is the reporter
    if (issue.userEmail !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized: Only the reporter can resolve this issue" });
    }

    // Update status only if it's currently "Pending" and the new status is "Resolved"
    if (issue.status !== "Pending" || status !== "Resolved") {
      return res.status(400).json({ message: "Invalid status update. Only Pending issues can be resolved." });
    }

    issue.status = status;
    await issue.save();

    res.json({ message: "Issue status updated to Resolved", issue });
  } catch (error) {
    console.error("Error updating issue status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// New endpoint to fetch resolved/unresolved stats by year
router.get('/issues/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Report.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" }, // Group by year based on createdAt
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
          },
          unresolved: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by year ascending
      },
      {
        $project: {
          year: "$_id",
          resolved: 1,
          unresolved: 1,
          _id: 0,
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Error fetching issue stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


module.exports = router;