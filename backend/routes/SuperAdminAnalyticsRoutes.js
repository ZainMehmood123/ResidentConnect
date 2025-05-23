const express = require("express");
const router = express.Router();
const Society = require("../models/societyModel");
const RegisteredSociety = require("../models/RegisterdSocietyModel");
const Resident = require("../models/SignupUserModel");
const CoAdminLogin = require("../models/CoAdminLoginModel");
const Event = require("../models/EventModel");
const Fundraiser = require("../models/FundraiserModel"); // Assumed model
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.error("No token provided");
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Invalid token:", err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Get all metrics
router.get("/metrics", authenticateToken, async (req, res) => {
  try {
    const totalSocieties = await Society.countDocuments();
    const totalResidents = await Resident.countDocuments({ status: "Active" });
    const totalAdmins = await CoAdminLogin.countDocuments();
    const totalPopulation = totalResidents + totalAdmins;
    const totalActiveSocieties = await RegisteredSociety.countDocuments();
    const requestedSocieties = await Society.find({}, "society_name");
    const registeredSocieties = await RegisteredSociety.find(
      {},
      "society_name"
    );
    const registeredNames = new Set(
      registeredSocieties.map((s) => s.society_name)
    );
    const totalRejectedSocieties = requestedSocieties.filter(
      (s) => !registeredNames.has(s.society_name)
    ).length;
    const totalEvents = await Event.countDocuments();

    const metrics = {
      totalSocieties,
      totalPopulation,
      totalActiveSocieties,
      totalRejectedSocieties,
      totalEvents,
    };
    console.log("Metrics Response:", metrics); // Debug log
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get registered societies for PieChart categories
router.get("/societies", authenticateToken, async (req, res) => {
  try {
    const societies = await RegisteredSociety.find({}, "society_name").sort({
      society_name: 1,
    });
    const societyNames = societies.map((s) => s.society_name);
    console.log("Societies Response:", societyNames); // Debug log
    res.json(societyNames);
  } catch (error) {
    console.error("Error fetching societies:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get PieChart data
router.get("/analytics", authenticateToken, async (req, res) => {
  const { category } = req.query;
  try {
    let pieData = [];
    if (category === "By User Type" || category === "All Societies") {
      const totalResidents = await Resident.countDocuments({
        status: "Active",
      });
      const totalAdmins = await CoAdminLogin.countDocuments();
      const total = totalResidents + totalAdmins || 1;
      pieData = [
        {
          name: "Residents",
          population: (totalResidents / total) * 100,
          color: "#FF6F61",
        },
        {
          name: "Admins",
          population: (totalAdmins / total) * 100,
          color: "#6B7280",
        },
      ];
    } else if (category === "By Fundraiser Status") {
      const activeFundraisers =
        (await Fundraiser.countDocuments({ status: "Active" })) || 0;
      const completedFundraisers =
        (await Fundraiser.countDocuments({ status: "Completed" })) || 0;
      const total = activeFundraisers + completedFundraisers || 1;
      pieData = [
        {
          name: "Active",
          population: (activeFundraisers / total) * 100,
          color: "#10B981",
        },
        {
          name: "Completed",
          population: (completedFundraisers / total) * 100,
          color: "#FBBF24",
        },
      ];
    } else {
      // Specific society
      const residents =
        (await Resident.countDocuments({
          society_name: category,
          status: "Active",
        })) || 0;
      const admins =
        (await CoAdminLogin.countDocuments({
          society_name: category,
        })) || 0;
      const total = residents + admins || 1;
      pieData = [
        {
          name: "Residents",
          population: (residents / total) * 100,
          color: "#FF6F61",
        },
        {
          name: "Admins",
          population: (admins / total) * 100,
          color: "#6B7280",
        },
      ];
    }
    console.log(`Analytics Response for ${category}:`, pieData); // Debug log
    res.json(pieData);
  } catch (error) {
    console.error("Error fetching analytics:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get LineChart data (Monthly Active Users)
router.get("/active-users", authenticateToken, async (req, res) => {
  try {
    const societies = await RegisteredSociety.find({}, "society_name");
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const colors = [
      "rgba(59, 130, 246, 1)",
      "rgba(16, 185, 129, 1)",
      "rgba(251, 191, 36, 1)",
      "rgba(239, 68, 68, 1)",
      "rgba(147, 51, 234, 1)",
    ];
    const datasets = [];
    const legend = [];

    for (const society of societies) {
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - i);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const count =
          (await Resident.countDocuments({
            society_name: society.society_name,
            status: "Active",
            lastLogin: { $gte: startDate, $lt: endDate },
          })) || 0;
        monthlyData.push(count);
      }
      datasets.push({
        data: monthlyData,
        color: (opacity = 1) =>
          colors[datasets.length % colors.length].replace("1)", `${opacity})`),
        strokeWidth: 3,
        legend: society.society_name,
      });
      legend.push(society.society_name);
    }

    const response = { labels, datasets, legend };
    console.log("Active Users Response:", response); // Debug log
    res.json(response);
  } catch (error) {
    console.error("Error fetching active users:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
