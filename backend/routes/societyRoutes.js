const express = require('express');
const router = express.Router();
const Society = require('../models/societyModel'); // Import the Society model

// POST route to add a new Society
router.post('/add-society', async (req, res) => {
  const { society_name, address, contact_number, email, website,read } = req.body;

  try {
    // Check if required fields are missing
    if (!society_name || !address || !contact_number || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newSociety = new Society({
      society_name,
      address,
      contact_number,
      email,
      website,
      read: read || false,
    });

    await newSociety.save();  // Save the new society to MongoDB
    res.status(201).json({ message: 'Society added successfully' });
  } catch (error) {
    console.error('Error adding society:', error);
    res.status(500).json({ error: 'Error adding society', details: error });
  }
});

// GET route to fetch all societies
router.get('/get-societies', async (req, res) => {
  try {
    const societies = await Society.find(); // Fetch all societies from the database
    res.status(200).json(societies); // Return the data as a JSON response
  } catch (error) {
    console.error('Error fetching societies:', error);
    res.status(500).json({ error: 'Error fetching societies', details: error });
  }
});

// PUT route to mark a notification as read
router.put('/mark-notification-read/:id', async (req, res) => {
  const { id } = req.params; // Get the society id from the URL
  try {
    const society = await Society.findById(id);

    if (!society) {
      return res.status(404).json({ error: 'Society not found' });
    }

    society.read = true; // Mark the notification as read
    await society.save(); // Save the updated society document

    res.status(200).json({ message: 'Society notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error marking notification as read' });
  }
});

module.exports = router;