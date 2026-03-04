# CPSC Capstone Project – Online Photo Editor

Contributors:

+ Joey Hudak – [@jah1044](https://www.github.com/jah1044)
+ Team Member 2 – [GitHub Username]
+ Team Member 3 – [GitHub Username]


## Project Overview

This project is a **web-based photo editor** developed for our Capstone course.  
The application allows users to create accounts, upload images, edit them directly in the browser, and save or download the edited versions.

Users will be able to apply basic photo adjustments such as brightness and contrast as well as filters like grayscale, blur, and sepia.  
All uploaded images and user account information are stored on the server with metadata stored in a **MySQL database**.

---

# Project Components

## User Account System
- Sign up / Log in / Log out
- User profile page
- Account information stored in the database

Stored user data includes:
- username
- email
- password (hashed)
- account creation date

---

## Image Upload System
Users can upload image files including:

- JPG
- PNG
- WEBP

Uploaded images are stored on the server. The database stores metadata such as:

- filename
- file path
- file size
- upload date
- owner ID

---

## Photo Editor

The editor runs in the browser using the **Canvas API**.

Users can apply the following adjustments:

- Resize / scale image
- Brightness adjustment
- Contrast adjustment
- RGB color balance
- Convert image to grayscale

Available filters:

- Blur
- Sharpen
- Sepia
- Edge detection

---

## Saving and Exporting Images

Users can save edited images in two ways:

- Save as a **new version**
- Overwrite the current image

Users can also download images as:

- PNG
- JPG

When edits are saved, the system updates the image record in the database.

---

# Database Structure (MySQL)

The project uses a **MySQL database** with the following tables.

### Users
Stores account information.

Fields:
- id
- username
- email
- passwordHash
- createdAt

### Images
Stores uploaded image metadata.

Fields:
- id
- ownerId
- title
- uploadedAt
- lastEditedAt

### ImageVersions
Stores different versions of edited images.

Fields:
- id
- imageId
- filePath
- versionNumber
- createdAt

Version **0** represents the original uploaded image.

---

# Nice-to-Have Features (If Time Allows)

- Crop images
- Rotate and flip images
- Undo / redo history
- Preset filters
- Shareable image links
- Delete uploaded images
- Drag-and-drop upload

---

# Tech Stack

Frontend
- HTML
- CSS
- JavaScript
- Canvas API

Backend
- Node.js
- Express.js

File Upload Handling
- Multer

Authentication
- bcrypt
- passport (optional)

Database
- MySQL

Optional Image Processing Libraries
- CamanJS
- glfx.js
- Sharp
- Jimp

---

# Running the Project

This project was developed for a **Capstone course project**.

## Requirements

+ Node.js (latest LTS version recommended)
+ MySQL Server
+ npm

---

## Setup

Clone the repository:
