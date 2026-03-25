// ================================
// [03/25/2026]
// LOAD DEPENDENCIES AND ENV VARIABLES
// ================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");

// ================================
// [03/25/2026]
// IMPORT DATABASE AND ROUTES
// ================================
const db = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// ================================
// [03/25/2026]
// AUTH ROUTES
// ================================
app.use("/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});