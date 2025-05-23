const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcrypt'); // Import bcrypt module
const nodemailer = require('nodemailer'); // Import Nodemailer
const User = require('../models/SignupUserModel');
const ResidentSignupCode = require('../models/ResidentSignupCodeModel'); // Import ResidentSignupCode model
const UserContact=require('../models/user');
require('dotenv').config(); // Make sure dotenv is loaded

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail for sending email
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS,  // Your email password or an app-specific password
  },
});

// Endpoint to fetch all residents
// Endpoint to fetch all residents
router.get('/accounts', async (req, res) => {
  try {
    const residents = await User.find({}, 'firstName lastName email society_name status'); // Include 'status' field here
    res.status(200).json(residents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching residents', error });
  }
});

// Route to activate a resident's account
router.put('/activate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Get the new status from the request body

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Find the resident by their ID and update the status to the new value
    const updatedResident = await User.findByIdAndUpdate(
      id,
      { status }, // Update the status field to 'Active'
      { new: true } // Return the updated document
    );

    if (!updatedResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Send an email to the resident
    const mailOptions = {
      from: 'your-email@gmail.com', // Sender's email address
      to: updatedResident.email,   // Resident's email from the database
      subject: 'Account Activated',
      text: `Dear ${updatedResident.firstName},\n\nYour account has been activated. You can now log in and access your account.\n\nBest regards,\nResident Connect Team`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Respond with success message
    res.status(200).json({
      message: 'Resident activated successfully and notified via email',
      resident: updatedResident,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error activating resident', error });
  }
});



// Endpoint to deactivate a resident's account
router.put('/deactivate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Get the new status from the request body

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Find the resident by their ID and update the status to the new value
    const updatedResident = await User.findByIdAndUpdate(
      id,
      { status }, // Update the status field
      { new: true } // Return the updated document
    );

    if (!updatedResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Send an email to the resident
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: updatedResident.email,
      subject: 'Account Deactivated!',
      text: `Dear ${updatedResident.firstName},\n\nYour account has been deactivated. If you have any questions, please contact support.\n\nBest regards,\nResident Connect Team
  
  Best regards,
  The ResidentConnect Team`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Respond with success message
    res.status(200).json({
      message: 'Resident deactivated successfully and notified via email',
      resident: updatedResident,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating resident', error });
  }
});







// Function to hash password using bcrypt
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10); // Generate salt
  return bcrypt.hash(password, salt); // Hash the password
};


// Function to send the welcome email
const sendWelcomeEmail = async (userEmail, societyName,firstname,lastname) => {
    fullname= firstname+lastname;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Welcome to ResidentConnect!',
    text: `Dear ${fullname},

Thank you for signing up for ResidentConnect! We're glad to have you on board.

ResidentConnect is a community-driven app designed to make society life easier. It helps you stay connected with your neighbors, report issues, stay updated on events, and much more. You can access important society information, such as events, maintenance schedules, and community discussions, all in one place.

Your society details:
Society Name: ${societyName}

We hope you enjoy using ResidentConnect, and we’re here to support you with any questions or concerns.

Best regards,
The ResidentConnect Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username (email)
    const user = await User.findOne({ email: username }); // Adjust key if necessary
    if (!user) {
      return res.status(400).json({ message: 'Invalid email.!' });
    }

    // Check if the account is active
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    // Compare provided password with hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid Password.!' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    // Login successful
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      username: user.firstName, // Optional: include user data if needed
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Signup Route
router.post('/add', async (req, res) => {
  try {
    const { firstName, lastName, email, residentcode, password } = req.body;

    // Validate input fields
    if (!firstName || !lastName || !email || !residentcode || !password) {
      console.log("Validation failed: Missing fields.");
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the email and residentcode pair exist in ResidentSignupCode collection
    const residentDetails = await ResidentSignupCode.findOne({ email, residentsignupcode: residentcode });
    if (!residentDetails) {
      console.log("Invalid email or resident code:", { email, residentcode });
      return res.status(400).json({ message: 'Invalid email or resident code' });
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(password);

    // Create a new user in the User collection
    const newUser = new User({
      firstName,
      lastName,
      email,
      residentcode,
      society_name: residentDetails.society_name, // Get society name from ResidentSignupCode
      society_code: residentDetails.society_code, // Get society code from ResidentSignupCode
      password: hashedPassword, // Save hashed password
      status: "Active",
    });

    // Save the new user and get the generated _id
    const savedUser = await newUser.save();
    const userId = savedUser._id; // Capture the generated _id from User collection
    console.log("Generated _id for newUser:", userId);

    // Transform data to fit the UserContact model and reuse the same _id
    const userName = `${firstName} ${lastName}`;
    const newUserContact = new UserContact({
      _id: userId, // Explicitly set the _id to match newUser's _id
      name: userName, // Required field in userSchema
      role: "Resident", // Assuming a default role for new users (adjust as needed)
      avatar: "https://randomuser.me/api/portraits/men/32.jpg", // Default avatar from userSchema
      online: false, // Default value from userSchema
      email: email, // Match the email for uniqueness
      createdAt: new Date(), // Use current date as default from userSchema
    });

    // Save the newUserContact with the same _id
    await newUserContact.save();
    console.log("Saved newUserContact with _id:", userId);

    // Send welcome email
    await sendWelcomeEmail(email, residentDetails.society_name, firstName, lastName);

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});
  
module.exports = router;
