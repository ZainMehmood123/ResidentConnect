const express = require('express');
const jwt = require('jsonwebtoken'); // Import jwt package for token generation
const SuperAdminLogin = require('../models/SuperAdminLoginModel'); // Import the model
require('dotenv').config(); // Load environment variables from .env file
const router = express.Router();

// Login Route for SuperAdmin
router.post('/superadminlogin', async (req, res) => {
  const { email, password } = req.body; // Extract email and password from request body

  try {
    // Find user by email
    const user = await SuperAdminLogin.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials', // Invalid email response
      });
    }

    // Check if the passwords match (plain text comparison)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials', // Invalid password response
      });
    }

    // Generate JWT token if credentials match
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '3h' });

    // Send the token and success message
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token, // Send the token back to the client
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error', // Server error response
    });
  }
});

module.exports = router;
