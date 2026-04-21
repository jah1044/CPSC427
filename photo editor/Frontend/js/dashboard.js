// [04/01/2026] dashboard state keeps the UI and selected projects in sync
let dashboardImages = [];
let filteredImages = [];
const selectedImageIds = new Set();

// [04/01/2026] dashboard bootstrapping
document.addEventListener("DOMContentLoaded", () => {
  protectDashboard();
  bindDashboardEvents();
  initializeDashboard();
});

// [04/01/2026] prevent access when no token exists
function protectDashboard() {
  if (!localStorage.getItem("token")) {
    window.location.href = "index.html";
  }
}

// [04/01/2026] attach event listeners once after the page loads
function bindDashboardEvents() {
  document.getElementById("refreshDashboardButton")?.addEventListener("click", initializeDashboard);
  document.getElementById("openUploadButton")?.addEventListener("click", showUploadPanel);
  document.getElementById("closeUploadButton")?.addEventListener("click", hideUploadPanel);
  document.getElementById("uploadButton")?.addEventListener("click", uploadFromDashboard);
  document.getElementById("bulkDeleteButton")?.addEventListener("click", handleBulkDelete);
  document.getElementById("selectAllButton")?.addEventListener("click", selectAllVisibleProjects);
  document.getElementById("clearSelectionButton")?.addEventListener("click", clearSelection);
  document.getElementById("projectSearchInput")?.addEventListener("input", handleSearchInput);

  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTarget;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

// ✅ FIXED: properly closed function
async function loadUserSummary() {
  const user = await makeRequest("/auth/me");
  localStorage.setItem("user", JSON.stringify(user));

  document.getElementById("displayUsername").textContent = user.username || "User";
  document.getElementById("displayEmail").textContent = user.email || "-";

  const topName = document.getElementById("displayUsernameTop");
  if (topName) {
    topName.textContent = user.username || "Account";
  }

  const avatar = document.querySelector(".account-chip__avatar");
  if (avatar && user.username) {
    avatar.textContent = user.username.charAt(0).toUpperCase();
  }
}

// [04/01/2026] load user + images
async function initializeDashboard() {
  try {
    await loadUserSummary();
    await loadGallery();
  } catch (error) {
    console.error("Dashboard init error:", error);
    alert("Could not load dashboard data.");
  }
}

// [04/01/2026] fetch all images
async function loadGallery() {
  const images = await makeRequest("/images");
  dashboardImages = Array.isArray(images) ? images : [];
  filteredImages = [...dashboardImages];

  renderProjectsGrid();
  renderStoragePulse();
  document.getElementById("displayProjectCount").textContent = dashboardImages.length;
}

// SIMPLE render (clean version)
function renderProjectsGrid() {
  const grid = document.getElementById("projectsGrid");
  grid.innerHTML = "";

  if (!filteredImages.length) {
    grid.innerHTML = '<p class="empty-state">No projects yet. Upload an image to get started.</p>';
    return;
  }

  filteredImages.forEach((img) => {
    const card = document.createElement("div");
    card.className = "project-card";
    card.innerHTML = `<p>${img.title || "Untitled"}</p>`;
    grid.appendChild(card);
  });
}

function renderStoragePulse() {
  const total = 20;
  const used = dashboardImages.length;
  const percent = (used / total) * 100;

  document.getElementById("storageBarFill").style.width = percent + "%";
  document.getElementById("storageText").textContent = `${used} of ${total} project slots used`;
}

// helpers
function showUploadPanel() {
  document.getElementById("uploadPanel").hidden = false;
}

function hideUploadPanel() {
  document.getElementById("uploadPanel").hidden = true;
}

async function uploadFromDashboard() {
  await handleUpload();
}

function handleSearchInput(e) {
  const term = e.target.value.toLowerCase();
  filteredImages = dashboardImages.filter(img =>
    (img.title || "").toLowerCase().includes(term)
  );
  renderProjectsGrid();
}

function selectAllVisibleProjects() {}
function clearSelection() {}
function handleBulkDelete() {}