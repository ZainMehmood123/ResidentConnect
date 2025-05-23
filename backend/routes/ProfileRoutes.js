const express = require('express');
const jwt = require('jsonwebtoken');
const ResidentsSignup = require("../models/SignupUserModel");
const Profile = require('../models/ProfileModel'); // Import Profile model
const UserChat = require('../models/user');
require('dotenv').config(); // Make sure dotenv is loaded
const router = express.Router();

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

// Get profile by email (now authenticated)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Use email from the JWT payload (i.e., req.user.email)
    const profile = await Profile.findOne({ email: req.user.email }); // Find profile based on the email in the token
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Format DOB to only return the date (YYYY-MM-DD)
    if (profile.DOB) {
      const date = new Date(profile.DOB);
      profile.DOB = date.toISOString().split('T')[0]; // This will drop time and give date as YYYY-MM-DD
    }

    res.json({ profile }); // Send the profile as response
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// PUT route to update only the profile picture in both Profile and User models
router.put('/picture', authenticateToken, async (req, res) => {
  const { profilePic } = req.body; // Extract the profilePic from the request body
  const email = req.user.email; // Get email from JWT token payload

  if (!profilePic) {
    return res.status(400).json({ error: 'Profile picture is required.' });
  }

  try {
    // Find and update the profile picture in the Profile model
    const updatedProfile = await Profile.findOneAndUpdate(
      { email }, // Use email to find the user profile
      { profilePic }, // Only update the profilePic field
      { new: true } // Return the updated document
    );

    // Find and update the avatar in the User model
    const updatedUser = await UserChat.findOneAndUpdate(
      { email }, // Use email to find the user in the User model
      { avatar: profilePic }, // Update the avatar field with the profilePic value
      { new: true } // Return the updated document
    );

    if (!updatedProfile || !updatedUser) {
      return res.status(404).json({ error: 'Profile or User not found' });
    }

    res.json({ 
      message: 'Profile picture updated successfully', 
      profilePic: updatedProfile.profilePic,
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, contact, DOB, Gender, Password } = req.body;
  const email = req.user.email; // Use email from the token payload

  try {
    // Validate required fields
    

    // Find profile by email and update it, or create a new one if it doesn't exist
    const profile = await Profile.findOneAndUpdate(
      { email }, // Filter by email from token
      { name, contact, DOB, Gender, Password}, // Update fields
      { new: true, upsert: true } // Options: Return the updated doc; create if not found
    );

    res.json({ message: 'Profile saved successfully', profile });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/contacts/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    // Search in both collections
    const profileResults = await Profile.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { contact: { $regex: query, $options: "i" } },
      ],
    });

    const residentResults = await ResidentsSignup.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
      ],
    });

    let results = [...profileResults, ...residentResults];

    // If found in both, prioritize the one with profilePic
    const uniqueResults = {};
    results.forEach((entry) => {
      if (!uniqueResults[entry.email] || entry.profilePic) {
        uniqueResults[entry.email] = entry;
      }
    });

    res.json(Object.values(uniqueResults));
  } catch (error) {
    console.error("Error searching contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
