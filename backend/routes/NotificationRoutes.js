// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/NotificationModel');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Make sure dotenv is loaded
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
// Get all notifications for a user
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .lean(); // Convert to plain JavaScript objects

    res.status(200).json({ 
      notifications,
      success: true,
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching notifications',
      error: error.message 
    });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found or unauthorized'
      });
    }

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ 
      notifications,
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating notification',
      error: error.message 
    });
  }
});

// Create a new notification (optional, for completeness)
router.post('/notifications/create', authenticateToken, async (req, res) => {
  try {
    const { title, description, type } = req.body;

    // Validate input
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and type are required'
      });
    }

    const notification = new Notification({
      userId: req.user.id,
      title,
      description,
      type,
      read: false
    });

    await notification.save();

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(201).json({ 
      notifications,
      success: true,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating notification',
      error: error.message 
    });
  }
});

module.exports = router;