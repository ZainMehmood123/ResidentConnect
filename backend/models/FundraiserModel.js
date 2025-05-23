// const mongoose = require("mongoose");

// const fundraiserSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true },
//     description: { type: String, required: true },
//     goal: { type: Number, required: true },
//     raised: { type: Number, default: 0 },
//     timeline: { type: String, required: true },
//     image: { type: String, required: true },
//     supporters: { type: Number, default: 0 },
//     category: { type: String, default: "Other" },
//     email: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Fundraiser", fundraiserSchema);

const mongoose = require("mongoose");

const fundraiserSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    goal: { type: Number, required: true },
    raised: { type: Number, default: 0 },
    timeline: { type: String, required: true },
    image: { type: String, required: true },
    supporters: { type: Number, default: 0 },
    category: { type: String, default: "Other" },
    email: { type: String, required: true },
    expenses: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fundraiser", fundraiserSchema);
