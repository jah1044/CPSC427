// [03/25/2026] load packages
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const db = require("../config/db");
const auth = require("../middleware/auth");

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

const upload = multer({ storage });

// [03/25/2026] upload image
router.post("/upload", upload.single("image"), async (req, res) => {
  const { ownerId, title } = req.body || {};

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  if (!ownerId || !title) {
    return res.status(400).json({ message: "ownerId and title are required" });
  }

  try {
    const filePath = req.file.filename;

    const [result] = await db.promise().query(
      "INSERT INTO Images (ownerId, title, originalFilePath) VALUES (?, ?, ?)",
      [ownerId, title, filePath]
    );

    // [03/25/2026] save original as version 0
    await db.promise().query(
      "INSERT INTO ImageVersions (imageId, filePath, versionNumber) VALUES (?, ?, ?)",
      [result.insertId, filePath, 0]
    );

    res.status(201).json({
      message: "Image uploaded",
      imageId: result.insertId,
      file: filePath
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] save edited image version
router.post("/save", upload.single("image"), async (req, res) => {
  const { imageId } = req.body || {};

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  if (!imageId) {
    return res.status(400).json({ message: "Image ID is required" });
  }

  try {
    const [images] = await db.promise().query(
      "SELECT * FROM Images WHERE id = ?",
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const [versions] = await db.promise().query(
      "SELECT MAX(versionNumber) AS maxVersion FROM ImageVersions WHERE imageId = ?",
      [imageId]
    );

    const nextVersion = (versions[0].maxVersion || 0) + 1;
    const filePath = req.file.filename;

    await db.promise().query(
      "INSERT INTO ImageVersions (imageId, filePath, versionNumber) VALUES (?, ?, ?)",
      [imageId, filePath, nextVersion]
    );

    await db.promise().query(
      "UPDATE Images SET lastEditedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [imageId]
    );

    res.status(201).json({
      message: "Edited image version saved",
      imageId: Number(imageId),
      versionNumber: nextVersion,
      file: filePath
    });
  } catch (err) {
    console.error("Save version error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] get one image by id
router.get("/view/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Image ID is required" });
  }

  try {
    const [images] = await db.promise().query(
      "SELECT * FROM Images WHERE id = ?",
      [id]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.status(200).json(images[0]);
  } catch (err) {
    console.error("Get image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] get all versions for one image
router.get("/versions/:imageId", async (req, res) => {
  const { imageId } = req.params;

  if (!imageId) {
    return res.status(400).json({ message: "Image ID is required" });
  }

  try {
    const [images] = await db.promise().query(
      "SELECT * FROM Images WHERE id = ?",
      [imageId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const [versions] = await db.promise().query(
      "SELECT * FROM ImageVersions WHERE imageId = ? ORDER BY versionNumber ASC",
      [imageId]
    );

    res.status(200).json(versions);
  } catch (err) {
    console.error("Get versions error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/26/2026] delete one image version
router.delete("/version/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Version ID is required" });
  }

  try {
    const [versions] = await db.promise().query(
      "SELECT * FROM ImageVersions WHERE id = ?",
      [id]
    );

    if (versions.length === 0) {
      return res.status(404).json({ message: "Version not found" });
    }

    const version = versions[0];

    if (version.versionNumber === 0) {
      return res.status(400).json({ message: "Original version cannot be deleted here" });
    }

    await db.promise().query(
      "DELETE FROM ImageVersions WHERE id = ?",
      [id]
    );

    if (version.filePath) {
      const fullPath = `uploads/${version.filePath}`;

      try {
        await fsPromises.unlink(fullPath);
      } catch (fileErr) {
        if (fileErr.code !== "ENOENT") {
          console.error("File delete error:", fileErr);
        }
      }
    }

    res.status(200).json({ message: "Image version deleted successfully" });
  } catch (err) {
    console.error("Delete version error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] delete image and all versions
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Image ID is required" });
  }

  try {
    const [images] = await db.promise().query(
      "SELECT * FROM Images WHERE id = ?",
      [id]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: "Image not found" });
    }

    const [versions] = await db.promise().query(
      "SELECT * FROM ImageVersions WHERE imageId = ?",
      [id]
    );

    const filesToDelete = new Set();

    if (images[0].originalFilePath) {
      filesToDelete.add(images[0].originalFilePath);
    }

    for (const version of versions) {
      if (version.filePath) {
        filesToDelete.add(version.filePath);
      }
    }

    await db.promise().query(
      "DELETE FROM Images WHERE id = ?",
      [id]
    );

    for (const fileName of filesToDelete) {
      const fullPath = `uploads/${fileName}`;

      try {
        await fsPromises.unlink(fullPath);
      } catch (fileErr) {
        if (fileErr.code !== "ENOENT") {
          console.error("File delete error:", fileErr);
        }
      }
    }

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Delete image error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// [03/25/2026] get all images for one user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const [images] = await db.promise().query(
      "SELECT * FROM Images WHERE ownerId = ? ORDER BY uploadedAt DESC",
      [userId]
    );

    res.status(200).json(images);
  } catch (err) {
    console.error("Get images error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;