// ==========================================================
// Photo Editor Capstone Project
// File: auth.js
// Description: Handles account registration, login, profile updates, password changes, password reset, and account deletion.
// Date: 04/2026
// ==========================================================

// [03/25/2026] load packages
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const db = require("../config/db");
const rateLimit = require("express-rate-limit");

// [04/21/2026] limit repeated login attempts ONLY
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts, please try again later" }
});

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
router.post("/login", loginLimiter, async (req, res) => {
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

    // [03/26/2026] create token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/26/2026] get logged in user
router.get("/me", auth, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      "SELECT id, username, email FROM Users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(users[0]);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [04/01/2026] update profile
router.put("/update-profile", auth, async (req, res) => {
  const { username, email } = req.body || {};

  if (!username || !email) {
    return res.status(400).json({ message: "Username and email are required" });
  }

  try {
    const [existingUser] = await db.promise().query(
      "SELECT * FROM Users WHERE email = ? AND id != ?",
      [email, req.user.id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    await db.promise().query(
      "UPDATE Users SET username = ?, email = ? WHERE id = ?",
      [username, email, req.user.id]
    );

    res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [04/01/2026] change password
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  try {
    const [users] = await db.promise().query(
      "SELECT * FROM Users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.promise().query(
      "UPDATE Users SET passwordHash = ? WHERE id = ?",
      [hashedPassword, req.user.id]
    );

    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [04/01/2026] request password reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const [users] = await db.promise().query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(200).json({ message: "If the account exists, a reset token has been generated" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    await db.promise().query(
      "UPDATE Users SET resetToken = ?, resetTokenExpires = ? WHERE email = ?",
      [resetToken, resetTokenExpires, email]
    );

    res.status(200).json({
      message: "Reset token generated",
      resetToken
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [04/01/2026] reset password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body || {};

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  try {
    const [users] = await db.promise().query(
      "SELECT * FROM Users WHERE resetToken = ? AND resetTokenExpires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.promise().query(
      "UPDATE Users SET passwordHash = ?, resetToken = NULL, resetTokenExpires = NULL WHERE id = ?",
      [hashedPassword, users[0].id]
    );

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [04/01/2026] delete account
router.delete("/delete-account", auth, async (req, res) => {
  try {
    await db.promise().query(
      "DELETE FROM Users WHERE id = ?",
      [req.user.id]
    );

    res.status(200).json({ message: "Account deleted" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
