const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer'); // Import nodemailer

// @route POST /api/reject-society
// @desc Send rejection email for society registration
router.post('/reject-society', async (req, res) => {
  try {
    const { society_name, address, email, contact_number } = req.body;

    // Validate input
    if (!society_name || !email || !address || !contact_number) {
      return res.status(400).json({ message: 'Incomplete society details' });
    }

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email provider
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: email, // Recipient email
      subject: 'Society Registration Rejected',
      text: `Dear User,

We regret to inform you that your society registration request has been rejected. Below are the details of your society:

- Society Name: ${society_name}
- Address: ${address}
- Email: ${email}
- Contact Number: ${contact_number}

This decision was made as your society is not recognized in our records. Please contact support for further clarification.

Best Regards,
Your Team`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending rejection email:', err);
        return res.status(500).json({ message: 'Failed to send rejection email', error: err.message });
      } else {
        console.log('Rejection email sent:', info.response);
        return res.status(200).json({ message: 'Rejection email sent successfully' });
      }
    });
  } catch (error) {
    console.error('Error processing rejection email:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;
