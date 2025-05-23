const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const Notification = require("../models/NotificationModel");
const Resource = require("../models/ResourceSharingModel");
const UserChat= require("../models/user");
require('dotenv').config(); // Make sure dotenv is loaded

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(403).json({ error: 'Access denied, no token provided' });
  }

  // Corrected to use process.env.JWT_SECRET
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user; // Attach user info from token to request object
    next();
  });
};

router.get("/get-owner-id/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;
    console.log("Backend Received Resource ID:", resourceId);

    // Validate resourceId
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: "Invalid Resource ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(resourceId);

    // Find the resource by ID
    const resource = await Resource.findOne({ _id: objectId });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    console.log("Resource Found:", resource);

    // Find the user who shared the resource
    const user = await UserChat.findOne({ email: resource.userEmail });

    if (!user) {
      return res.status(404).json({ message: "Owner not found" });
    }

    console.log("Owner Found:", user);

    res.json({
      ownerId: user._id,
      ownerName: user.name,
      item: resource.item,
    });
  } catch (error) {
    console.error("Error fetching owner details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// @route   POST /api/resources
router.post("/sharing", authenticateToken, async (req, res) => {
  try {
    const { item, description, status, location, contact, image } = req.body;
    const userEmail = req.user.email; // Extract email from JWT (middleware)

    if (!item || !description || !location || !contact) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    const newResource = new Resource({
      item,
      description,
      status,
      location,
      contact,
      image,
      userEmail,
    });

    const savedResource = await newResource.save();

    // Create a notification for the resource sharing
    const notification = new Notification({
      userId: req.user.id, // Use logged-in user's ID from JWT
      title: `New Resource Shared: ${item}`,
      description: description, // Use the resource description directly
      type: 'Resource Sharing', // Specific type for resource sharing
      read: false,
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Resource shared successfully',
      resource: savedResource,
    });
  } catch (error) {
    console.error("Error saving resource:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/resources/user/:email
// @desc    Get resources created by a specific user
router.get("/user/:email",authenticateToken , async (req, res) => {
  try {
    const { email } = req.params;
    const resources = await Resource.find({ userEmail: email });

    if (!resources.length) {
      return res.status(404).json({ message: "No resources found for this user." });
    }

    res.json(resources);
  } catch (error) {
    console.error("Error fetching user resources:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource by ID
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find and delete the resource
      const deletedResource = await Resource.findByIdAndDelete(id);
  
      if (!deletedResource) {
        return res.status(404).json({ message: "Resource not found." });
      }
  
      res.json({ message: "Resource deleted successfully." });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  

  // @route   GET /api/resources
  // @route   GET /api/resources/fetchAll
router.get("/fetchAll", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email; // Extract user email from token

    // Fetch resources created by the authenticated user
    const myResources = await Resource.find({ userEmail }).sort({ createdAt: -1 });

    // Fetch resources created by other users
    const sharedResources = await Resource.find({ userEmail: { $ne: userEmail } }).sort({ createdAt: -1 });

    console.log("Backend Response:", JSON.stringify({ success: true, myResources, sharedResources }, null, 2));

    res.json({ success: true, myResources, sharedResources });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch resources" });
  }
});

  

module.exports = router;

