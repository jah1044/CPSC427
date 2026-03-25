// [03/25/2026] load env + packages
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// [03/25/2026] import db + routes
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const imageRoutes = require("./routes/images");

const app = express();

// [03/25/2026] middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// [03/25/2026] test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

// [03/25/2026] auth routes
app.use("/auth", authRoutes);

// [03/25/2026] image routes + serve uploaded files
app.use("/images", imageRoutes);
app.use("/uploads", express.static("uploads"));

// [03/25/2026] start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});