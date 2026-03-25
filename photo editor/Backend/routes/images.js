// [03/25/2026] load packages
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// [03/25/2026] configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// [03/25/2026] upload image
router.post("/upload", upload.single("image"), async (req, res) => {
  const { ownerId, title } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = req.file.filename;

    await db.promise().query(
      "INSERT INTO Images (ownerId, title, originalFilePath) VALUES (?, ?, ?)",
      [ownerId, title, filePath]
    );

    res.json({ message: "Image uploaded", file: filePath });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] get user images
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [images] = await db.promise().query(
      "SELECT * FROM Images WHERE ownerId = ?",
      [userId]
    );

    res.json(images);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;