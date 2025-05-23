const express = require('express');
const nodemailer = require('nodemailer'); // For sending emails
const ResidentSignupCode = require('../models/ResidentSignupCodeModel'); // Import the model
require('dotenv').config(); // Make sure dotenv is loaded
const router = express.Router();

// Route to add a new resident signup code
router.post('/add', async (req, res) => {
  const { society_name, society_code, email } = req.body;

  try {
    // Check if email already exists
    const existingRecord = await ResidentSignupCode.findOne({ email });
    if (existingRecord) {
      console.log('Email already exists:', email); // Debug log
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Autogenerate a unique resident signup code
    const residentsignupcode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create a new ResidentSignupCode record
    const newResidentSignupCode = new ResidentSignupCode({
      society_name,
      society_code,
      email,
      residentsignupcode,
    });

    // Save the record to the database
    const savedRecord = await newResidentSignupCode.save();
    
    // Email logic (add logs if necessary)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Resident Signup Code',
      text: `Dear User,

Your resident signup code for society "${society_name}" has been successfully created. Below are your details:

- Society Name: ${society_name}
- Signup Code: ${residentsignupcode}

Please keep this information secure.

Best Regards,
Your Team`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({
          success: false,
          message: 'Signup code created but failed to send email',
          error: err.message,
        });
      }

      console.log('Email sent:', info.response);
      res.status(201).json({
        success: true,
        message: 'Resident signup code created successfully and email sent',
        data: savedRecord,
      });
    });
  } catch (error) {
    console.error('Error adding resident signup code:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while adding the resident signup code',
      error: error.message,
    });
  }
});

module.exports = router;
