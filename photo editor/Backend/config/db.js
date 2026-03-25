// [03/25/2026] load env + mysql
require("dotenv").config();
const mysql = require("mysql2");

// [03/25/2026] create db connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// [03/25/2026] connect to mysql
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

module.exports = db;