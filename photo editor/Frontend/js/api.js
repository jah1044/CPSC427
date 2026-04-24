// ==========================================================
// Photo Editor Capstone Project
// File: api.js
// Description: Reusable frontend helper for backend requests and JWT Authorization headers.
// Date: 04/2026
// ==========================================================

const BASE_URL = "http://localhost:5000";

// reusable api request helper

async function makeRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {}
  };

  if (body && !(body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    options.body = body;
  }
  
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }
  if (response.status === 401) {
  console.error("401 Unauthorized - NOT redirecting for debug");
  return;
}
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}
