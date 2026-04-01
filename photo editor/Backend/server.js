// [03/25/2026] load env + packages
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// [03/25/2026] import db + routes
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/images");

const app = express();

// [04/01/2026] general rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later" }
});

// [04/01/2026] auth rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later" }
});

// [04/01/2026] security middleware
app.use(helmet());

// [03/25/2026] middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// [03/25/2026] test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

// [03/25/2026] auth routes
app.use("/auth", authLimiter, authRoutes);

// [03/25/2026] image routes + serve uploaded files
app.use("/images", imageRoutes);
app.use("/uploads", express.static("uploads"));

// [03/25/2026] start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});