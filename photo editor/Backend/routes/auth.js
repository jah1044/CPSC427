// [03/25/2026] load packages
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db");

// [03/25/2026] register user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body || {};

  // validate input
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // check if email already exists
    const [existingUser] = await db.promise().query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert new user
    await db.promise().query(
      "INSERT INTO Users (username, email, passwordHash) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  // validate input
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // find user by email
    const [users] = await db.promise().query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = users[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      userId: user.id,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;