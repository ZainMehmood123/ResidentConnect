const fetch = require("node-fetch");
const express = require("express");
const router = express.Router();
const { Report } = require("../models/ReportModel");
const Alert = require("../models/EmergencyAlertsModel");
const Feedback = require("../models/FeedbackModel");
const Visitor = require("../models/VisitorModel");
const Event = require("../models/EventModel");
const Resident = require("../models/SignupUserModel");
const Message = require("../models/MessagesModel");
const Admin = require("../models/CoAdminLoginModel");
const Resource = require("../models/ResourceSharingModel");
const https = require("https");
require("dotenv").config();

router.get("/issues", async (req, res) => {
  console.log("GET /issues route hit"); // 👈 Add this

  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      console.log("No admin_email provided");
      return res.status(400).json({ message: "Admin email is required" });
    }

    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });

    if (!admin) {
      console.log("Admin not found for email:", admin_email);
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;
    console.log("Society Code:", societyCode);

    const residents = await Resident.find({ society_code: societyCode }).select(
      "email"
    );
    const residentEmails = residents.map((r) => r.email);

    console.log("Resident Emails:", residentEmails);

    const issues = await Report.aggregate([
      {
        $match: {
          userEmail: { $in: residentEmails },
        },
      },
      {
        $group: {
          _id: "$issueType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log("Issues:", issues);
    res.json(issues);
    console.log("Response sent");
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/service", async (req, res) => {
  console.log("GET /service route hit");

  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      console.log("No admin_email provided");
      return res.status(400).json({ message: "Admin email is required" });
    }

    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });

    if (!admin) {
      console.log("Admin not found for email:", admin_email);
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;
    console.log("Society Code:", societyCode);

    const residents = await Resident.find({ society_code: societyCode }).select(
      "email"
    );
    const residentEmails = residents.map((r) => r.email);

    console.log("Resident Emails:", residentEmails);

    // Aggregate the resources filtered by "Available" status
    const services = await Resource.aggregate([
      {
        $match: {
          userEmail: { $in: residentEmails },
          status: "Available", // Filter by "Available" status
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 }, // Count the number of service requests
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date in ascending order
      },
    ]);

    console.log("Aggregated Service Data:", services); // Log the fetched data
    res.json(services);
  } catch (error) {
    console.error("Error fetching service requests data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/accounts", async (req, res) => {
  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      console.log("No admin_email provided");
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });

    if (!admin) {
      console.log("Admin not found for email:", admin_email);
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;
    console.log("Society Code:", societyCode);

    // Aggregate account data for the specific society code
    const accounts = await Resident.aggregate([
      {
        $match: { society_code: societyCode },
      },
      {
        $group: {
          _id: { society_name: "$society_name", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.society_name",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        },
      },
      {
        $project: {
          society_name: "$_id",
          active: {
            $arrayElemAt: [
              "$statuses.count",
              { $indexOfArray: ["$statuses.status", "Active"] },
            ],
          },
          inactive: {
            $arrayElemAt: [
              "$statuses.count",
              { $indexOfArray: ["$statuses.status", "Inactive"] },
            ],
          },
        },
      },
      {
        $sort: { society_name: 1 },
      },
    ]);

    // Replace null values with 0 for active/inactive counts
    const formattedAccounts = accounts.map((item) => ({
      society_name: item.society_name,
      active: item.active || 0,
      inactive: item.inactive || 0,
    }));

    console.log("Formatted Accounts:", formattedAccounts);
    res.json(formattedAccounts);
  } catch (error) {
    console.error("Error fetching account status data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/events", async (req, res) => {
  console.log("GET /events route hit");

  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      console.log("No admin_email provided");
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });

    if (!admin) {
      console.log("Admin not found for email:", admin_email);
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;
    console.log("Society Code:", societyCode);

    // Find residents belonging to the same society
    const residents = await Resident.find({ society_code: societyCode }).select(
      "email"
    );
    const residentEmails = residents.map((r) => r.email);

    console.log("Resident Emails:", residentEmails);

    // Aggregate events from residents' reports
    const events = await Event.aggregate([
      {
        $match: {
          userEmail: { $in: residentEmails },
        },
      },
      {
        $group: {
          _id: { name: "$name", date: "$date" }, // Group by both name and date
          count: { $sum: 1 }, // Count the occurrences
        },
      },
      {
        $sort: { "_id.date": -1 }, // Sort by date in descending order
      },
    ]);

    // Format the events data
    const formattedEvents = events.map((event) => ({
      _id: event._id.name, // Event name
      date: event._id.date || "N/A", // Event date (if available)
      count: event.count, // Count of events
    }));

    console.log("Formatted Events:", formattedEvents);
    res.json(formattedEvents);
    console.log("Response sent");
  } catch (error) {
    console.error("Error fetching event data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/visitors", async (req, res) => {
  console.log("GET /visitors route hit");

  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      console.log("No admin_email provided");
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });

    if (!admin) {
      console.log("Admin not found for email:", admin_email);
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;
    console.log("Society Code:", societyCode);

    // Find residents belonging to the same society
    const residents = await Resident.find({ society_code: societyCode }).select(
      "email"
    );
    const residentEmails = residents.map((r) => r.email);

    console.log("Resident Emails:", residentEmails);

    // Aggregate visitor data for the last 7 days with "approved" status
    const visitors = await Visitor.aggregate([
      {
        $match: {
          userEmail: { $in: residentEmails },
          status: "approved", // Only count approved visitors
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$checkInTime" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 }, // Sort by date in descending order
      },
      {
        $limit: 7, // Last 7 days
      },
    ]);

    console.log("Visitors:", visitors);
    res.json(visitors);
    console.log("Response sent");
  } catch (error) {
    console.error("Error fetching visitor logs data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Cache to store geocoded results and avoid repeated API calls
const geocodeCache = new Map();

// Function to get area name from geocode.maps.co using https
async function getAreaName(lat, lng) {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  return new Promise((resolve) => {
    const apiKey = process.env.GEOCODE_MAPS_API_KEY; // Set this in your .env file
    const url = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}&api_key=${apiKey}`;

    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            if (response.error) {
              console.error("geocode.maps.co API error:", response.error);
              resolve("Unknown Area");
              return;
            }

            // Extract the area name from display_name
            const areaName = response.display_name || "Unknown Area";
            geocodeCache.set(cacheKey, areaName);
            resolve(areaName);
          } catch (error) {
            console.error(
              "Error parsing geocode.maps.co response:",
              error.message
            );
            resolve("Unknown Area");
          }
        });
      })
      .on("error", (error) => {
        console.error("Error in reverse geocoding:", error.message);
        resolve("Unknown Area");
      });
  });
}

router.get("/heatmap", async (req, res) => {
  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Step 1: Find admin by email
    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;

    // Step 2: Get resident emails within the same society
    const residents = await Resident.find({ society_code: societyCode }).select(
      "email"
    );
    const residentEmails = residents.map((r) => r.email);

    // Step 3: Filter reports from matching residents with valid coordinates
    const issues = await Report.aggregate([
      {
        $match: {
          userEmail: { $in: residentEmails },
          "location.lat": { $exists: true, $ne: null },
          "location.lng": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            lat: { $round: ["$location.lat", 2] },
            lng: { $round: ["$location.lng", 2] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Step 4: Get area names for each rounded lat/lng
    const heatmapData = await Promise.all(
      issues.map(async (issue) => {
        const areaName = await getAreaName(issue._id.lat, issue._id.lng);
        return { _id: areaName, count: issue.count };
      })
    );

    // Step 5: Aggregate by area name
    const aggregatedData = heatmapData.reduce((acc, curr) => {
      const existing = acc.find((item) => item._id === curr._id);
      if (existing) {
        existing.count += curr.count;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Step 6: Sort by count
    aggregatedData.sort((a, b) => b.count - a.count);

    console.log("Heatmap data:", aggregatedData);
    res.json(aggregatedData);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/emergency", async (req, res) => {
  try {
    const { admin_email } = req.query;

    if (!admin_email) {
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Step 1: Find the admin by email
    const admin = await Admin.findOne({ email: admin_email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.society_code;
    console.log("Admin's in Alert Society Code:", societyCode); // Debug log for society code

    // Step 2: Get resident emails matching the same society code
    const residents = await Resident.find({ society_code: societyCode }).select(
      "email"
    );
    console.log("Resident Emails in Alert:", residents); // Debug log for resident emails

    const residentEmails = residents.map((r) => r.email);
    if (residentEmails.length === 0) {
      console.log("No residents found for this society code."); // Debug log if no residents
      return res
        .status(404)
        .json({ message: "No residents found for this society" });
    }

    // Step 3: Match alerts where userEmail is in residentEmails and 'shared' is true
    const alerts = await Alert.aggregate([
      {
        $match: {
          userEmail: { $in: residentEmails }, // Match the residents' emails with userEmail in Alert
          shared: true, // Filter only alerts that are marked as 'shared'
        },
      },
      {
        $group: {
          _id: "$type", // Group by alert type (e.g., Fire, Accident)
          count: { $sum: 1 }, // Count each type's occurrences
        },
      },
      {
        $sort: { count: -1 }, // Sort by count in descending order
      },
    ]);

    console.log("Aggregated Alerts:", alerts); // Debug log for aggregated alerts

    if (alerts.length === 0) {
      return res
        .status(404)
        .json({ message: "No shared emergency alerts found" });
    }

    res.json(alerts); // Return the aggregated data
  } catch (error) {
    console.error("Error fetching emergency alerts data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/satisfaction", async (req, res) => {
  try {
    // Step 1: Get admin email from the query
    const { admin_email } = req.query;

    if (!admin_email) {
      return res.status(400).json({ message: "Admin email is required" });
    }

    // Step 2: Find the society code based on admin email
    const admin = await Admin.findOne({ email: admin_email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const societyCode = admin.societyCode;
    console.log("Society Code:", societyCode);

    // Step 3: Find resident emails associated with the society code
    const residents = await Resident.find({ societyCode });
    const residentEmails = residents.map((resident) => resident.email);

    if (residentEmails.length === 0) {
      return res.json([]);
    }

    console.log("Resident Emails:", residentEmails);

    // Step 4: Fetch feedback from residents
    const feedbacks = await Feedback.find({
      userEmail: { $in: residentEmails },
    });
    const totalFeedback = feedbacks.length;

    if (totalFeedback === 0) {
      return res.json([]);
    }

    // Step 5: Prepare text for sentiment analysis
    const feedbackTexts = feedbacks.flatMap((feedback) => [
      ...feedback.mcqAnswers.map((ans) => ans.answer),
      feedback.generalFeedback,
    ]);

    // Step 6: Hugging Face Sentiment Analysis API
    const sentimentResults = await Promise.all(
      feedbackTexts.map(async (text) => {
        try {
          const response = await fetch(
            "https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer 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`, // Replace with your actual token
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ inputs: text }),
            }
          );

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          const result = await response.json();
          const label = result[0]?.label || "NEUTRAL";
          return label.toLowerCase(); // Return 'positive', 'negative', or 'neutral'
        } catch (err) {
          console.error("Error in sentiment analysis:", err.message);
          return "neutral"; // Default to neutral if error
        }
      })
    );

    // Step 7: Group sentiment results
    const sentimentCount = sentimentResults.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});

    // Step 8: Format the result with percentages
    const formattedResults = Object.keys(sentimentCount).map((sentiment) => ({
      _id: sentiment,
      percentage: (sentimentCount[sentiment] / totalFeedback) * 100,
    }));

    // Updated result
    console.log("Formatted Satisfaction Data:", formattedResults);
    res.json(formattedResults);
  } catch (error) {
    console.error("Error fetching satisfaction data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
