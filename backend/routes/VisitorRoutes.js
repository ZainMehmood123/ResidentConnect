const express = require("express");
const router = express.Router();
const Visitor = require("../models/VisitorModel");

// POST: Create a new visitor request
router.post("/request", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      purpose,
      relationship,
      checkInTime,
      photo,
      status,
      userEmail,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !purpose ||
      !relationship ||
      !checkInTime ||
      !userEmail
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newVisitor = new Visitor({
      name,
      email,
      phone,
      purpose,
      relationship,
      checkInTime,
      photo,
      status: status || "pending",
      userEmail,
    });
    await newVisitor.save();

    res.status(201).json({
      message: "Visitor request submitted successfully.",
      visitor: newVisitor,
    });
  } catch (error) {
    console.error("Error submitting visitor request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET: Fetch visitor requests for a specific user
router.get("/requests/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ message: "User email is required." });
    }

    const visitors = await Visitor.find({ userEmail }).sort({ createdAt: -1 });

    res.status(200).json({ visitors });
  } catch (error) {
    console.error("Error fetching visitor requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET: Fetch all visitor requests
router.get("/requests", async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.status(200).json({ visitors });
  } catch (error) {
    console.error("Error fetching all visitor requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET: Fetch visitor requests by status
router.get("/requests/status/:status", async (req, res) => {
  try {
    const { status } = req.params;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const visitors = await Visitor.find({ status }).sort({ createdAt: -1 });
    res.status(200).json({ visitors });
  } catch (error) {
    console.error("Error fetching visitor requests by status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT: Approve a visitor request
router.put("/requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found." });
    }

    visitor.status = "approved";
    await visitor.save();

    res.status(200).json({
      message: "Visitor request approved successfully.",
      visitor,
    });
  } catch (error) {
    console.error("Error approving visitor request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT: Reject a visitor request
router.put("/requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found." });
    }

    visitor.status = "rejected";
    await visitor.save();

    res.status(200).json({
      message: "Visitor request rejected successfully.",
      visitor,
    });
  } catch (error) {
    console.error("Error rejecting visitor request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE: Delete a visitor request
router.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findByIdAndDelete(id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found." });
    }

    res.status(200).json({ message: "Visitor request deleted successfully." });
  } catch (error) {
    console.error("Error deleting visitor request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
