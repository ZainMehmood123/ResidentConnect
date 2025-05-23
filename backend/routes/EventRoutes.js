const express = require('express');
const router = express.Router();
const Event = require('../models/EventModel');
const User=require('../models/user')
const Notification=require('../models/NotificationModel')
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { check, validationResult } = require('express-validator'); // Validation middleware
require('dotenv').config(); // Make sure dotenv is loaded
// Middleware to verify JWT
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

// Create a transporter to send email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Replace with your email
    pass: process.env.EMAIL_PASS, // Replace with your password or app-specific password
  },
});


// Route to get user ID from event ID
const mongoose = require("mongoose");

router.get("/get-user-id/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log("Backend Received Event ID:", eventId);

    // Validate and Convert eventId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.error("Invalid ObjectId format:", eventId);
      return res.status(400).json({ message: "Invalid Event ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(eventId);
    console.log("Converted Event ID to ObjectId:", objectId);

    // Step 1: Find event by _id
    const event = await Event.findOne({ _id: objectId });

    if (!event) {
      console.error("Event not found for ID:", eventId);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("Event Found:", event);

    // Step 2: Find user by email
    const user = await User.findOne({ email: event.userEmail });

    if (!user) {
      console.error("User not found for email:", event.userEmail);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User Found:", user);

    res.json({ userId: user._id, userName: user.name,eventname:event.name });
  } catch (error) {
    console.error("Error fetching user ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});




// Route to create an event and add a notification
router.post('/create', authenticateToken, async (req, res) => {
  const { id, name, description, date, time, location, userEmail } = req.body;

  if (!userEmail || !id || !name || !description || !date || !time || !location) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newEvent = new Event({
      userEmail,
      id,
      name,
      description,
      date,
      time,
      location,
    });

    const savedEvent = await newEvent.save();

    // Create a notification for the event creation with your specified format
    const notification = new Notification({
      userId: req.user.id, // Use logged-in user's ID from JWT
      title: `New Event Created: ${name}`,
      description: description, // Use the event description directly
      type: 'Event Creation', // Updated type as per your request
      read: false,
    });
    await notification.save();

    // Send an email to the user after saving the event
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Event Created: ${name}`,
      text: `Hello,\n\nYour event "${name}" has been successfully created.\n\nDetails:\nEvent ID: ${id}\nDescription: ${description}\nDate: ${date}\nTime: ${time}\nLocation: ${location}\n\nThank you!`,
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
      message: 'Event created successfully',
      event: savedEvent,
    });
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


// Function to send confirmation email
const sendConfirmationEmail = (userEmail, eventId) => {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Replace with your email
      to: userEmail,
      subject: 'Event Deletion Confirmation',
      text: `Dear user,\n\nYour event with ID: ${eventId} has been successfully deleted.\n\nThank you for using our service.`,
    };
  
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  };
  
// Route to delete event
router.post('/delete-event', authenticateToken, async (req, res) => {
    let { eventId, userEmail } = req.body;
  
    // Convert eventId to string (if needed)
    eventId = String(eventId);
  
    console.log('eventId:', eventId);
    console.log('userEmail:', userEmail);
  
    if (!eventId || !userEmail) {
      return res.status(400).json({ message: 'Event ID and User Email are required' });
    }
  
    try {
      // Use 'id' to query as it's defined in your event schema
      const event = await Event.findOne({ id: eventId, userEmail: userEmail });
  
      if (!event) {
        return res.status(404).json({ message: 'Event not found or email does not match' });
      }
  
      // Proceed to delete the event
      await Event.deleteOne({ id: eventId });
  
      // Send confirmation email
      sendConfirmationEmail(userEmail, eventId);
  
      // Respond to the frontend
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  });
  
  // Route to handle viewing event details
router.post('/view-event', authenticateToken, async (req, res) => {
   
    let { eventId, userEmail } = req.body;
    eventId = String(eventId);
  
    console.log('eventId:', eventId);
    console.log('userEmail:', userEmail);
  
    if (!eventId || !userEmail) {
      return res.status(400).json({ message: 'Event ID and User Email are required' });
    }
  
    try {
      // Use 'id' to query as it's defined in your event schema
      const event = await Event.findOne({ id: eventId, userEmail: userEmail });
  
      if (!event) {
        return res.status(404).json({ message: 'Event not found or email does not match' });
      }
  
      // Send back the event details
      return res.status(200).json({
        success: true,
        event: {
          id: event._id,
          name: event.name,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  });

  // Middleware to verify JWT
const authenticatedToken = (req, res, next) => {
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
  

  router.post(
    '/update-event',
    authenticatedToken,  // Use your existing authenticateToken middleware
    [
      check('eventId', 'Event ID is required').not().isEmpty(),
      check('eventName', 'Event Name is required').not().isEmpty(),
      check('eventDescription', 'Event Description is required').not().isEmpty(),
      check('eventDate', 'Event Date is required').not().isEmpty(),
      check('eventTime', 'Event Time is required').not().isEmpty(),
      check('eventLocation', 'Event Location is required').not().isEmpty(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
  
      let { eventId, eventName, eventDescription, eventDate, eventTime, eventLocation } = req.body;
      const userEmail = req.user.email; // Extracted from token
      eventId = String(eventId);
  
      try {
        // Find event by ID and ensure the event matches the user's email
        const event = await Event.findOne({ id: eventId, userEmail: userEmail });
  
        if (!event) {
          return res.status(404).json({ success: false, message: 'Event not found or email does not match' });
        }
  
        // Update the event details
        event.name = eventName;
        event.description = eventDescription;
        event.date = eventDate;
        event.time = eventTime;
        event.location = eventLocation;
  
        await event.save();
  
        // Send an email to the user notifying about the update
        const mailOptions = {
          from: process.env.EMAIL_USER, // Sender email
          to: userEmail, // Send email to the user
          subject: 'Event Updated Successfully',
          text: `Dear User,\n\nYour event '${eventName}' has been updated successfully.\n\nEvent Details:\nID: ${eventId}\nName: ${eventName}\nDate: ${eventDate}\nTime: ${eventTime}\nLocation: ${eventLocation}\n\nThank you!`,
        };
  
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('Error sending email:', err);
          } else {
            console.log('Email sent:', info.response);
          }
        });
  
        return res.status(200).json({
          success: true,
          message: 'Event updated successfully',
          updatedEvent: {
            id: event._id,
            name: event.name,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
          },
        });
      } catch (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }
  );
  
  router.get('/recent', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email; // Extract logged-in user's email from the token

        console.log("Fetching events for user:", userEmail); // Debugging log

        // Fetch all events except those created by the logged-in user
        const events = await Event.find({ userEmail: { $ne: userEmail } });

        res.status(200).json({ success: true, events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

router.get("/fetchAll", async (req, res) => {
  try {
    const events = await Event.find(); // Fetch all events
    res.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get event details by ID
router.get('/:eventId', async (req, res) => {
  try {
      const { eventId } = req.params;
      console.log("Backend:",eventId)
      const event = await Event.findById(eventId);

      if (!event) {
          return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
  } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Internal server error" });
  }
});
  
module.exports = router;
