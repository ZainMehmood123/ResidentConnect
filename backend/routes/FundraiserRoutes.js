// const express = require("express");
// const router = express.Router();
// const Fundraiser = require("../models/FundraiserModel");

// router.post("/create", async (req, res) => {
//   try {
//     const { title, description, goal, timeline, image, email } = req.body;

//     if (!title || !description || !goal || !timeline || !image || !email) {
//       return res.status(400).json({ message: "All fields are required." });
//     }

//     const newFundraiser = new Fundraiser({
//       title,
//       description,
//       goal,
//       timeline,
//       image,
//       email,
//       raised: 0,
//       supporters: 0,
//       category: "Other",
//     });

//     const savedFundraiser = await newFundraiser.save();
//     res.status(201).json(savedFundraiser);
//   } catch (err) {
//     console.error("Error saving fundraiser:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // GET all fundraisers
// router.get("/all", async (req, res) => {
//   try {
//     const fundraisers = await Fundraiser.find();
//     res.status(200).json(fundraisers);
//   } catch (error) {
//     console.error("Error fetching fundraisers:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// // UPDATE fundraiser by ID
// router.put("/update/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedFundraiser = await Fundraiser.findByIdAndUpdate(id, req.body, {
//       new: true,
//     });

//     if (!updatedFundraiser) {
//       return res.status(404).json({ message: "Fundraiser not found" });
//     }

//     res.status(200).json(updatedFundraiser);
//   } catch (error) {
//     console.error("Error updating fundraiser:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Fundraiser = require("../models/FundraiserModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Create a fundraiser
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { title, description, goal, timeline, image, email } = req.body;

    if (!title || !description || !goal || !timeline || !image || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Email must match authenticated user" });
    }

    const newFundraiser = new Fundraiser({
      title,
      description,
      goal: parseFloat(goal),
      timeline,
      image,
      email,
      raised: 0,
      supporters: 0,
      category: "Other",
      expenses: [],
    });

    const savedFundraiser = await newFundraiser.save();
    res.status(201).json(savedFundraiser);
  } catch (err) {
    console.error("Error saving fundraiser:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all fundraisers
router.get("/all", async (req, res) => {
  try {
    const fundraisers = await Fundraiser.find();
    res.status(200).json(fundraisers);
  } catch (error) {
    console.error("Error fetching fundraisers:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update fundraiser by ID
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goal, timeline, image } = req.body;

    const fundraiser = await Fundraiser.findById(id);
    if (!fundraiser) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    if (fundraiser.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Only the fundraiser creator can update" });
    }

    const updatedFundraiser = await Fundraiser.findByIdAndUpdate(
      id,
      { title, description, goal: parseFloat(goal), timeline, image },
      { new: true }
    );

    if (!updatedFundraiser) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    res.status(200).json(updatedFundraiser);
  } catch (error) {
    console.error("Error updating fundraiser:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Create Stripe Checkout Session
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  const { amount, currency, fundraiserId } = req.body;
  try {
    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser)
      return res.status(404).json({ message: "Fundraiser not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency || "usd",
            product_data: { name: `Donation to ${fundraiser.title}` },
            unit_amount: Math.round(amount), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://${req.headers.host}/api/fundraisers/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${req.headers.host}/api/fundraisers/cancel`,
      metadata: { fundraiserId, userEmail: req.user.email },
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session", error });
  }
});

// Handle successful payment
router.get("/success", async (req, res) => {
  const { session_id } = req.query;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { fundraiserId, userEmail } = session.metadata;
    const amount = session.amount_total / 100; // Convert cents to dollars

    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ message: "Fundraiser not found" });
    }

    const newRaised = Math.min(fundraiser.raised + amount, fundraiser.goal);
    const newSupporters = fundraiser.supporters + 1;

    const updatedFundraiser = await Fundraiser.findByIdAndUpdate(
      fundraiserId,
      { raised: newRaised, supporters: newSupporters },
      { new: true }
    );

    if (newRaised >= fundraiser.goal) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const recipients = [fundraiser.email]; // Replace with User model query if available
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipients,
        subject: `Thank You! ${fundraiser.title} Goal Reached!`,
        text: `Dear Residents,\n\nWe are thrilled to announce that our fundraiser "${
          fundraiser.title
        }" has reached its goal of $${fundraiser.goal.toLocaleString()}! Thank you to all ${newSupporters} supporters who made this possible.\n\nBest regards,\nSociety Management Team`,
      };

      await transporter.sendMail(mailOptions);
    }

    res.json(updatedFundraiser);
  } catch (error) {
    console.error("Error processing successful payment:", error);
    res.status(500).json({ message: "Error processing payment", error });
  }
});

// Handle canceled payment
router.get("/cancel", (req, res) => {
  res.json({ message: "Payment canceled" });
});

// Add expense
router.post("/:id/add-expense", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { description, amount } = req.body;
  try {
    const fundraiser = await Fundraiser.findById(id);
    if (!fundraiser)
      return res.status(404).json({ message: "Fundraiser not found" });

    if (fundraiser.email !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Only the fundraiser creator can add expenses" });
    }

    if (!description || !amount || parseFloat(amount) <= 0) {
      return res
        .status(400)
        .json({ message: "Valid description and amount are required" });
    }

    if (
      fundraiser.raised <
      fundraiser.expenses.reduce((sum, exp) => sum + exp.amount, 0) +
        parseFloat(amount)
    ) {
      return res
        .status(400)
        .json({ message: "Expense amount exceeds funds raised" });
    }

    fundraiser.expenses.push({
      description,
      amount: parseFloat(amount),
      date: new Date(),
    });
    await fundraiser.save();
    res.json(fundraiser);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Error adding expense", error });
  }
});

module.exports = router;
