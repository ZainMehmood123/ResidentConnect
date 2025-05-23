const express = require('express');
const bcrypt = require('bcrypt');
const CoAdminLogin = require('../models/CoAdminLoginModel');
const User = require('../models/SignupUserModel'); // Import User model
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure dotenv is loaded

const OTP_STORE = {}; // Temporary in-memory store for OTPs

// Endpoint to send OTP
router.post('/send-otp', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000);
  const expirationTime = Date.now() + 40 * 1000; // OTP valid for 5 minutes

  // Save OTP and expiration time in memory, replacing any existing OTP for this email
  OTP_STORE[email] = { otp, expirationTime };

  // Log email and OTP for debugging
  console.log(`Sending OTP to email: ${email}`);
  console.log(`Generated OTP: ${otp}`);

  // Create a transporter to send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Replace with your email
      pass: process.env.EMAIL_PASS, // Replace with your password or app-specific password
    },
  });

  // Debugging check: Log the email user and pass (Do not log in production!)
  console.log('Email user:', process.env.EMAIL_USER);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is ${otp}. It is valid for 40 second.`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending OTP:', error); // Log the full error
      return res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
    console.log('Email sent successfully:', info); // Log the email sending info
    res.json({ message: 'OTP sent successfully', info });
  });
});

// Endpoint to verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
  
    const storedData = OTP_STORE[email];
    console.log(`Received OTP verification request for email: ${email}`);
  
    if (!storedData) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }
  
    console.log(`Stored OTP for ${email}: ${storedData.otp}`);
    console.log(`Entered OTP: ${otp}`);
  
    const { otp: storedOtp, expirationTime } = storedData;
  
    // Convert both OTP values to strings and trim any extra spaces
    const cleanedOtp = otp.toString().trim(); // Clean the entered OTP
    const cleanedStoredOtp = storedOtp.toString().trim(); // Clean the stored OTP
  
    console.log(`Cleaned OTP: ${cleanedOtp}`);
    console.log(`Cleaned Stored OTP: ${cleanedStoredOtp}`);
    console.log(`Type of cleanedOtp: ${typeof cleanedOtp}`); // Check type
    console.log(`Type of cleanedStoredOtp: ${typeof cleanedStoredOtp}`); // Check type
  
    // Debug the expiration time
    console.log(`Current time: ${Date.now()}`);
    console.log(`Expiration time: ${expirationTime}`);
  
    // Compare the cleaned OTP values and check expiration time
    if (cleanedOtp === cleanedStoredOtp && Date.now() <= expirationTime) {
      console.log(`OTP verification successful for ${email}`);
      delete OTP_STORE[email]; // Invalidate OTP after successful verification
      return res.json({ message: 'OTP verified successfully' });
    }
  
    console.log(`OTP verification failed for ${email}`);
    res.status(400).json({ error: 'Invalid or expired OTP' });
  });
  
// Function to hash password using bcrypt
const hashPassword = async (password) => {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Password hashing failed');
    }
  };
  
  router.post('/update-password', async (req, res) => {
    const { email, societyCode, newPassword } = req.body; // Get email, society code, and new password from the request body
  
    if (!email || !societyCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, society code, and new password are required' });
    }else{
      console.log("Society Code:",societyCode)
    }
  
    try {
      // Find Co-Admin by email and society code
      const user = await CoAdminLogin.findOne({ email, society_code: societyCode });
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found or society code does not match' });
      }
  
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
  
      // Update the password in the database
      user.password = hashedPassword;
      await user.save();
  
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  
  

  // Route to update password
// Route to update password
router.post('/residentupdate-password', async (req, res) => {
    console.log('Received request body:', req.body); // Log request body to check its content
    const { email, newPassword } = req.body;
  
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const hashedPassword = await hashPassword(newPassword);
      user.password = hashedPassword;
      await user.save();
  
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  
  module.exports = router;
