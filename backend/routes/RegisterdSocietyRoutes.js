const express = require('express');
const router = express.Router();
const RegisteredSociety = require('../models/RegisterdSocietyModel');
const CoadminLogin = require('../models/CoAdminLoginModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // Import nodemailer
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Function to generate a unique society code
const generateUniqueSocietyCode = async () => {
  let isUnique = false;
  let newSocietyCode = '';

  while (!isUnique) {
    // Generate a random 3-character society code
    newSocietyCode = crypto.randomBytes(2).toString('hex').slice(0, 3);

    // Check if the code already exists in the database
    const existingSociety = await RegisteredSociety.findOne({ society_code: newSocietyCode });

    // If no existing society with the same code, it's unique
    if (!existingSociety) {
      isUnique = true;
    }
  }

  return newSocietyCode;
};

// @route GET /api/registered-societies
// @desc Fetch all registered societies
router.get('/registered-societies', async (req, res) => {
  try {
    // Fetch all registered societies sorted by creation date (most recent first)
    const societies = await RegisteredSociety.find().sort({ created_at: -1 });
    res.status(200).json(societies); // Send fetched data as JSON response
  } catch (error) {
    console.error('Error fetching registered societies:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
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


// @route POST /api/register-society
// @desc Register a new society and also create co-admin credentials
router.post('/register-society', async (req, res) => {
  try {
    const { society_name, email } = req.body;

    if (!society_name || !email) {
      return res.status(400).json({ message: 'Society name and email are required' });
    }

    // Check if society already exists
    const existingSociety = await RegisteredSociety.findOne({ society_name });
    if (existingSociety) {
      return res.status(400).json({ message: 'Society already registered' });
    }

     // Generate a unique society code
     const society_code = await generateUniqueSocietyCode();

    // Register society
    const newSociety = new RegisteredSociety({ society_name,email,
      society_code});
    await newSociety.save();

    // Auto-generate credentials
    const generatedPassword = crypto.randomBytes(4).toString('hex').slice(0, 8);

        // Hash password
    const hashedPassword = await hashPassword(generatedPassword);

    

    // Create co-admin credentials
    const newCoadmin = new CoadminLogin({
      coadmin_name: "Coadmin",
      society_name,
      society_code,
      email,
      password: hashedPassword,
    });
    await newCoadmin.save();

    // Send an email to the society admin
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Using Gmail
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: email, // Recipient email
      subject: 'Society Registration Successful',
      text: `Dear User,

Your society "${society_name}" has been successfully registered. Below are your society details:

- Society Name: ${society_name}
- Society Code: ${society_code}
- Email: ${email}
- Password: ${generatedPassword}

Please keep this information secure.

Best Regards,
Your Team`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Society registered but failed to send email', error: err });
      } else {
        console.log('Email sent:', info.response);
        res.status(201).json({
          message: 'Society registered successfully, co-admin credentials created, and email sent.',
          society: newSociety,
          credentials: {
            email,
            password: generatedPassword,
            society_code: society_code,
          },
        });
      }
    });
  } catch (error) {
    console.error('Error registering society:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;
