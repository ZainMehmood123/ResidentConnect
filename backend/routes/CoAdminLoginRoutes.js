const express = require('express');
const jwt = require('jsonwebtoken');
const CoAdminLogin = require('../models/CoAdminLoginModel');
const nodemailer = require('nodemailer');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find Co-Admin by email
    const user = await CoAdminLogin.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Log passwords for debugging (remove this in production)
    console.log('Provided Password:', password);
    console.log('Hashed Password:', user.password);

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log('Password Match:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        coadmin_name: user.coadmin_name,
        society_name: user.society_name,
        society_code: user.society_code,
      },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    // Return token
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add Co-Admin Route
router.post('/add', async (req, res) => {
  const { coadmin_name, email, society_name, society_code } = req.body;

  try {
    // Generate random password
    const generatedPassword = crypto.randomBytes(4).toString('hex').slice(0, 8);

    // Hash password
    const hashedPassword = await hashPassword(generatedPassword);

    // Check for existing Co-Admin with the same email and society_code
    const existingCoAdmin = await CoAdminLogin.findOne({ email, society_code });
    if (existingCoAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'A Co-admin already exists with this email and society code' 
      });
    }

    // Create new Co-Admin
    const newCoadmin = new CoAdminLogin({
      coadmin_name: coadmin_name || 'CoAdmin',
      society_name,
      society_code,
      email,
      password: hashedPassword,
    });

    // Save to database
    await newCoadmin.save();

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Co-Admin Registration Successful',
      text: `Dear ${coadmin_name || 'User'},
      
You have been successfully registered as a Co-Admin for the society "${society_name}". Below are your login details:

- Email: ${email}
- Password: ${generatedPassword}

Please use these credentials to log in to the system. Make sure to change your password after logging in for the first time.

Best Regards,
Your Team`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({
          success: true,
          message: 'Co-admin added but failed to send email',
          error: err,
        });
      } else {
        console.log('Email sent:', info.response);
        return res.status(201).json({
          success: true,
          message: 'Co-admin added successfully and email sent.',
          coadmin: {
            coadmin_name,
            email,
            society_name,
            society_code,
          },
        });
      }
    });
  } catch (error) {
    console.error('Error adding co-admin:', error);
    res.status(500).json({ success: false, message: 'Error adding co-admin', details: error.message });
  }
});
module.exports = router;
