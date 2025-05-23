// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const http = require("http");
// const socketIo = require("socket.io");
// require("dotenv").config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, { cors: { origin: "*" } });

// app.use(bodyParser.json({ limit: "10mb" }));
// app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
// app.use(cors());

// // MongoDB connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB Atlas"))
//   .catch((error) => console.error("Error connecting to MongoDB Atlas", error));

// // Sample API route
// app.get("/", (req, res) => {
//   res.send("API is working");
// });

// // Import and use routes
// const societyRoutes = require("./routes/societyRoutes");
// app.use("/api", societyRoutes);

// const registeredSocietyRoutes = require("./routes/RegisterdSocietyRoutes");
// app.use("/api", registeredSocietyRoutes);

// const rejectSocietyRoutes = require("./routes/RejectSociety");
// app.use("/api", rejectSocietyRoutes);

// const superAdminLoginRoutes = require("./routes/SuperAdminLoginRoutes");
// app.use("/api", superAdminLoginRoutes);

// const coAdminLoginRoutes = require("./routes/CoAdminLoginRoutes");
// app.use("/api/coadmin", coAdminLoginRoutes);

// const coAdminAddRoutes = require("./routes/CoAdminLoginRoutes");
// app.use("/api/coadminadd", coAdminAddRoutes);

// const otpRoutes = require("./routes/otpRoutes");
// app.use("/api/otp", otpRoutes);

// const otpverifyRoutes = require("./routes/otpRoutes");
// app.use("/api/otpveri", otpverifyRoutes);

// const resetsavedpasswordRoutes = require("./routes/otpRoutes");
// app.use("/api/coadminreset", resetsavedpasswordRoutes);

// const resetresidentsavedpasswordRoutes = require("./routes/otpRoutes");
// app.use("/api/residentreset", resetresidentsavedpasswordRoutes);

// const residentsignupcodeRoutes = require("./routes/ResidentSignupCodeRoutes");
// app.use("/api/residentsignupcode", residentsignupcodeRoutes);

// const signupRoutes = require("./routes/SignupUserRoutes");
// app.use("/api/signup", signupRoutes);

// const residentloginRoutes = require("./routes/SignupUserRoutes");
// app.use("/api/residentlogin", residentloginRoutes);

// const residentmanageRoutes = require("./routes/SignupUserRoutes");
// app.use("/api/manageresidents", residentmanageRoutes);

// const createeventRoutes = require("./routes/EventRoutes");
// app.use("/api/events", createeventRoutes);

// const deleteeventRoutes = require("./routes/EventRoutes");
// app.use("/api/eventsdelete", deleteeventRoutes);

// const vieweventRoutes = require("./routes/EventRoutes");
// app.use("/api/viewevents", vieweventRoutes);

// const updateeventRoutes = require("./routes/EventRoutes");
// app.use("/api/updateevents", updateeventRoutes);

// const profileRoutes = require("./routes/ProfileRoutes");
// app.use("/api/profiles", profileRoutes);

// const profilepictureRoutes = require("./routes/ProfileRoutes");
// app.use("/api/profiles/profile", profilepictureRoutes);

// const reportRoutes = require("./routes/ReportRoutes");
// app.use("/api/report", reportRoutes);

// const resourceSharing = require("./routes/ResourceSharingRoutes");
// app.use("/api/resources", resourceSharing);

// const emergencyAlerts = require("./routes/EmergencyAlertsRoutes");
// app.use("/api/emergency", emergencyAlerts);

// const visitor = require("./routes/VisitorRoutes");
// app.use("/api/visitor", visitor);

// const feedbackRoutes = require("./routes/FeedbackRoutes");
// app.use("/api/feedback", feedbackRoutes);

// const messagesRoutes = require("./routes/MessagesRoutes");
// app.use("/api/messages", messagesRoutes);

// const notificationRoutes = require("./routes/NotificationRoutes");
// app.use("/api/notifications", notificationRoutes);

// const fundraiserRoutes = require("./routes/FundraiserRoutes");
// app.use("/api/fundraisers", fundraiserRoutes);

// const coadminanalytics = require("./routes/CoAdminAnalyticsRoutes");
// app.use("/api/coadminanalytics", coadminanalytics);

// const superadminanalytics = require("./routes/SuperAdminAnalyticsRoutes");
// app.use("/api/developer", superadminanalytics);
// // Store online users
// const onlineUsers = new Map();

// // Socket.IO for real-time features
// io.on("connection", (socket) => {
//   console.log("New client connected:", socket.id);

//   // Register user with their userId
//   socket.on("register", (userId) => {
//     onlineUsers.set(userId, socket.id);
//     io.emit("onlineStatus", { userId, online: true });
//     console.log(`User ${userId} is online`);
//   });

//   // Handle sending messages
//   socket.on("sendMessage", async (message) => {
//     try {
//       const Message = require("./models/MessagesModel");
//       const newMessage = new Message(message);

//       const populatedMessage = await Message.findById(newMessage._id)
//         .populate("sender", "name avatar")
//         .populate("recipient", "name avatar");

//       // Emit to recipient if online
//       const recipientSocketId = onlineUsers.get(message.recipient);
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit("newMessage", populatedMessage);
//         // Update unread count for recipient if they're not viewing the sender's chat
//         const unreadCount = await Message.countDocuments({
//           sender: message.sender,
//           recipient: message.recipient,
//           status: "sent",
//         });
//         io.to(recipientSocketId).emit("unreadCountUpdate", {
//           sender: message.sender,
//           count: unreadCount,
//         });
//       }
//       // Emit to sender as well (for their own message confirmation)
//       io.to(onlineUsers.get(message.sender)).emit(
//         "newMessage",
//         populatedMessage
//       );
//     } catch (error) {
//       console.error("Error broadcasting message:", error);
//     }
//   });

//   socket.on("typing", ({ sender, recipient }) => {
//     const recipientSocketId = onlineUsers.get(recipient);
//     if (recipientSocketId) {
//       io.to(recipientSocketId).emit("typing", { sender, recipient });
//     }
//   });

//   socket.on("disconnect", () => {
//     const userId = [...onlineUsers.entries()].find(
//       ([_, sid]) => sid === socket.id
//     )?.[0];
//     if (userId) {
//       onlineUsers.delete(userId);
//       io.emit("onlineStatus", { userId, online: false });
//       console.log(`User ${userId} is offline`);
//     }
//   });
// });

// // 404 fallback
// app.use((req, res, next) => {
//   res.status(404).json({ error: "Route not found" });
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const nodemailer = require("nodemailer");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cors());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.error("Error connecting to MongoDB Atlas:", error));

// Sample API route
app.get("/", (req, res) => {
  res.send("API is working");
});

// Authentication Middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Import and use routes
const societyRoutes = require("./routes/societyRoutes");
app.use("/api", societyRoutes);

const registeredSocietyRoutes = require("./routes/RegisterdSocietyRoutes");
app.use("/api", registeredSocietyRoutes);

const rejectSocietyRoutes = require("./routes/RejectSociety");
app.use("/api", rejectSocietyRoutes);

const superAdminLoginRoutes = require("./routes/SuperAdminLoginRoutes");
app.use("/api", superAdminLoginRoutes);

const coAdminLoginRoutes = require("./routes/CoAdminLoginRoutes");
app.use("/api/coadmin", coAdminLoginRoutes);

const coAdminAddRoutes = require("./routes/CoAdminLoginRoutes");
app.use("/api/coadminadd", coAdminAddRoutes);

const otpRoutes = require("./routes/otpRoutes");
app.use("/api/otp", otpRoutes);

const otpverifyRoutes = require("./routes/otpRoutes");
app.use("/api/otpveri", otpverifyRoutes);

const resetsavedpasswordRoutes = require("./routes/otpRoutes");
app.use("/api/coadminreset", resetsavedpasswordRoutes);

const resetresidentsavedpasswordRoutes = require("./routes/otpRoutes");
app.use("/api/residentreset", resetresidentsavedpasswordRoutes);

const residentsignupcodeRoutes = require("./routes/ResidentSignupCodeRoutes");
app.use("/api/residentsignupcode", residentsignupcodeRoutes);

const signupRoutes = require("./routes/SignupUserRoutes");
app.use("/api/signup", signupRoutes);

const residentloginRoutes = require("./routes/SignupUserRoutes");
app.use("/api/residentlogin", residentloginRoutes);

const residentmanageRoutes = require("./routes/SignupUserRoutes");
app.use("/api/manageresidents", residentmanageRoutes);

const createeventRoutes = require("./routes/EventRoutes");
app.use("/api/events", createeventRoutes);

const deleteeventRoutes = require("./routes/EventRoutes");
app.use("/api/eventsdelete", deleteeventRoutes);

const vieweventRoutes = require("./routes/EventRoutes");
app.use("/api/viewevents", vieweventRoutes);

const updateeventRoutes = require("./routes/EventRoutes");
app.use("/api/updateevents", updateeventRoutes);

const profileRoutes = require("./routes/ProfileRoutes");
app.use("/api/profiles", profileRoutes);

const profilepictureRoutes = require("./routes/ProfileRoutes");
app.use("/api/profiles/profile", profilepictureRoutes);

const reportRoutes = require("./routes/ReportRoutes");
app.use("/api/report", reportRoutes);

const resourceSharing = require("./routes/ResourceSharingRoutes");
app.use("/api/resources", resourceSharing);

const emergencyAlerts = require("./routes/EmergencyAlertsRoutes");
app.use("/api/emergency", emergencyAlerts);

const visitor = require("./routes/VisitorRoutes");
app.use("/api/visitor", visitor);

const feedbackRoutes = require("./routes/FeedbackRoutes");
app.use("/api/feedback", feedbackRoutes);

const messagesRoutes = require("./routes/MessagesRoutes");
app.use("/api/messages", messagesRoutes);

const notificationRoutes = require("./routes/NotificationRoutes");
app.use("/api/notifications", notificationRoutes);

const fundraiserRoutes = require("./routes/FundraiserRoutes");
app.use("/api/fundraisers", fundraiserRoutes);

const coadminanalytics = require("./routes/CoAdminAnalyticsRoutes");
app.use("/api/coadminanalytics", coadminanalytics);

const superadminanalytics = require("./routes/SuperAdminAnalyticsRoutes");
app.use("/api/developer", superadminanalytics);

// Store online users
const onlineUsers = new Map();

// Socket.IO for real-time features
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Register user with their userId
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("onlineStatus", { userId, online: true });
    console.log(`User ${userId} is online`);
  });

  // Handle sending messages
  socket.on("sendMessage", async (message) => {
    try {
      const Message = require("./models/MessagesModel");
      const newMessage = new Message(message);

      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "name avatar")
        .populate("recipient", "name avatar");

      // Emit to recipient if online
      const recipientSocketId = onlineUsers.get(message.recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", populatedMessage);
        // Update unread count for recipient if they're not viewing the sender's chat
        const unreadCount = await Message.countDocuments({
          sender: message.sender,
          recipient: message.recipient,
          status: "sent",
        });
        io.to(recipientSocketId).emit("unreadCountUpdate", {
          sender: message.sender,
          count: unreadCount,
        });
      }
      // Emit to sender as well (for their own message confirmation)
      io.to(onlineUsers.get(message.sender)).emit(
        "newMessage",
        populatedMessage
      );
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  });

  socket.on("typing", ({ sender, recipient }) => {
    const recipientSocketId = onlineUsers.get(recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("typing", { sender, recipient });
    }
  });

  socket.on("disconnect", () => {
    const userId = [...onlineUsers.entries()].find(
      ([_, sid]) => sid === socket.id
    )?.[0];
    if (userId) {
      onlineUsers.delete(userId);
      io.emit("onlineStatus", { userId, online: false });
      console.log(`User ${userId} is offline`);
    }
  });
});

// 404 fallback
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
