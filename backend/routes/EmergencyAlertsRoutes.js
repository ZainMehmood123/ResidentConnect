const express = require("express");
const router = express.Router();
const Alert = require("../models/EmergencyAlertsModel");
const Resident = require("../models/SignupUserModel"); // Assuming there's a Resident model
const Admin = require("../models/CoAdminLoginModel"); // Assuming there's an Admin model
const nodemailer = require("nodemailer");

router.post("/alerts", async (req, res) => {
    try {
      console.log("Received Data:", req.body); // Debugging log
  
      const { type, details, userEmail } = req.body;
  
      if (!type || !details || !userEmail) {
        return res.status(400).json({ message: "All fields are required." });
      }
  
      // Save the alert in the database
      const newAlert = new Alert({ type, details, userEmail });
      await newAlert.save();
  
      res.status(201).json({
        alert: newAlert,
        message: "Alert saved successfully!",
      });
    } catch (error) {
      console.error("Error saving alert:", error); // Debugging log
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });


router.post("/share-alert/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the alert by ID
      const alert = await Alert.findById(id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
  
      // Update the alert to mark it as shared
      alert.shared = true;
      await alert.save();
  
       // Fetch active residents' emails
    const activeResidents = await Resident.find({ status: "Active" }).select("email");
    const residentEmails = activeResidents.map(resident => resident.email);
  
      // Fetch unique admin emails
      const admins = await Admin.find().select("email");
      const adminEmails = new Set(admins.map(admin => admin.email));
  
      // Combine unique emails (excluding duplicates)
      const recipientEmails = [...residentEmails, ...adminEmails];
  
      if (recipientEmails.length === 0) {
        return res.status(400).json({ message: "No valid recipients for the alert." });
      }
  
      // Email configuration
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER, // Sender email from .env
          pass: process.env.EMAIL_PASS, // Email password from .env
        },
      });
  
      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USER, // Sender email
        to: recipientEmails.join(","), // Join multiple emails with commas
        subject: "Shared Emergency Alert",
        text: `Dear User,
  
  An emergency alert has been shared:
  
  - **Type:** ${alert.type}
  - **Details:** ${alert.details}
  - **Reported By:** ${alert.userEmail}
  
  Please take necessary actions if required.
  
  Best Regards,
  Emergency Response Team`,
      };
  
      // Send email
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return res.status(500).json({ message: "Alert shared, but email failed to send", error: err });
        } else {
          console.log("Email sent:", info.response);
          res.status(200).json({
            alert,
            message: "Alert shared successfully! Emails sent to relevant recipients.",
          });
        }
      });
    } catch (error) {
      console.error("Error sharing alert:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

// DELETE route to remove a specific alert
router.delete("/delete-alert/:id", async (req, res) => {
  try {
    const alertId = req.params.id;

    // Check if alert exists
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // Delete alert
    await Alert.findByIdAndDelete(alertId);

    res.status(200).json({ message: "Alert deleted successfully!" });
  } catch (error) {
    console.error("Error deleting alert:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET route to fetch alerts for a specific user, sorted by latest update time
router.get("/showalerts/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required." });
    }

    console.log("Fetching alerts for:", userEmail); // Debugging log

    // Ensure database connection is working
    const alerts = await Alert.find({ userEmail }).sort({ updatedAt: 1 });

    if (!alerts.length) {
      return res.status(404).json({ message: "No alerts found for this user." });
    }

    res.status(200).json({ alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// GET route to fetch all emergency alerts where shared is true, sorted by latest update time
router.get("/fetchAll", async (req, res) => {
  try {
    console.log("Fetching shared emergency alerts"); // Debugging log

    // Fetch only alerts where shared is true, sorted by updatedAt (latest first)
    const alerts = await Alert.find({ shared: true }).sort({ timestamp: -1 });

    if (!alerts.length) {
      return res.status(404).json({ message: "No emergency alerts found." });
    }

    res.status(200).json({ alerts });
  } catch (error) {
    console.error("Error fetching emergency alerts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



module.exports = router;
