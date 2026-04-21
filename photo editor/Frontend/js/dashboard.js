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
  document.getElementById("logoutButton")?.addEventListener("click", logoutUser);
  document.getElementById("refreshDashboardButton")?.addEventListener("click", initializeDashboard);
  document.getElementById("openUploadButton")?.addEventListener("click", showUploadPanel);
  document.getElementById("closeUploadButton")?.addEventListener("click", hideUploadPanel);
  document.getElementById("uploadButton")?.addEventListener("click", uploadFromDashboard);
  document.getElementById("bulkDeleteButton")?.addEventListener("click", handleBulkDelete);
  document.getElementById("selectAllButton")?.addEventListener("click", selectAllVisibleProjects);
  document.getElementById("clearSelectionButton")?.addEventListener("click", clearSelection);
  document.getElementById("projectSearchInput")?.addEventListener("input", handleSearchInput);

  // [04/01/2026] sidebar buttons can scroll to sections without adding more pages
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

// [04/01/2026] load user data and project data together
async function initializeDashboard() {
  try {
    await loadUserSummary();
    await loadGallery();
  } catch (error) {
    console.error("Dashboard init error:", error);
    alert("Could not load dashboard data. Please log in again if the problem continues.");
  }
}

// [04/01/2026] fetch the logged-in user for the top bar and summary panel
async function loadUserSummary() {
  const user = await makeRequest("/auth/me");
  localStorage.setItem("user", JSON.stringify(user));

  document.getElementById("displayUsername").textContent = user.username || "User";
  document.getElementById("displayEmail").textContent = user.email || "-";
}

// [04/01/2026] fetch all projects and repaint the dashboard
async function loadGallery() {
  const images = await makeRequest("/images");
  dashboardImages = Array.isArray(images) ? images : [];
  filteredImages = [...dashboardImages];

  // [04/01/2026] remove deleted selections so the bulk toolbar stays accurate
  const validIds = new Set(dashboardImages.map((image) => image.id));
  [...selectedImageIds].forEach((id) => {
    if (!validIds.has(id)) {
      selectedImageIds.delete(id);
    }
  });

  renderContinueEditing();
  renderProjectsGrid();
  renderStoragePulse();
  renderRecentExports();
  updateBulkToolbarState();
  document.getElementById("displayProjectCount").textContent = String(dashboardImages.length);
}

// [04/01/2026] show only the most recently edited projects in the continue editing strip
function renderContinueEditing() {
  const container = document.getElementById("continueEditingRow");
  container.innerHTML = "";

  if (!dashboardImages.length) {
    container.innerHTML = '<p class="empty-state">Your recently updated projects will appear here.</p>';
    return;
  }

  const recent = [...dashboardImages]
    .sort((a, b) => new Date(b.lastEditedAt || b.uploadedAt) - new Date(a.lastEditedAt || a.uploadedAt))
    .slice(0, 3);

  recent.forEach((image) => {
    const card = document.createElement("article");
    card.className = "continue-card";
    card.innerHTML = `
      <img src="${buildImageUrl(image.originalFilePath)}" alt="${escapeHtml(image.title)}" />
      <div class="continue-card__content">
        <p class="eyebrow">Continue Editing</p>
        <h4>${escapeHtml(image.title || "Untitled Project")}</h4>
        <p>Last updated ${formatDate(image.lastEditedAt || image.uploadedAt)}</p>
        <div class="card-actions">
          <button class="button button--primary" type="button" data-action="edit" data-id="${image.id}">Edit</button>
          <button class="button button--ghost" type="button" data-action="versions" data-id="${image.id}">Versions</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  wireProjectActionButtons(container);
}

// [04/01/2026] main project grid with bulk actions and hover metadata
function renderProjectsGrid() {
  const grid = document.getElementById("projectsGrid");
  grid.innerHTML = "";

  if (!filteredImages.length) {
    grid.innerHTML = '<p class="empty-state">No matching projects found.</p>';
    return;
  }

  filteredImages.forEach((image) => {
    const isChecked = selectedImageIds.has(image.id);

    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `
      <label class="project-card__select">
        <input type="checkbox" data-image-select="${image.id}" ${isChecked ? "checked" : ""} />
        <span>Select</span>
      </label>

      <div class="project-card__preview">
        <img src="${buildImageUrl(image.originalFilePath)}" alt="${escapeHtml(image.title)}" />
        <div class="project-card__overlay">
          <button class="button button--primary" type="button" data-action="edit" data-id="${image.id}">Edit</button>
        </div>
      </div>

      <div class="project-card__body">
        <div class="project-card__title-row">
          <h4>${escapeHtml(image.title || "Untitled Project")}</h4>
          <span class="status-badge">In Progress</span>
        </div>

        <p class="project-card__meta">Created ${formatDate(image.uploadedAt)}</p>

        <div class="project-card__details">
          <span>1 image</span>
          <span>${formatFileSizeEstimate(image.originalFilePath)}</span>
        </div>

        <div class="card-actions">
          <button class="button button--ghost" type="button" data-action="versions" data-id="${image.id}">Versions</button>
          <button class="button button--ghost" type="button" data-action="delete" data-id="${image.id}">Delete</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  wireProjectSelection(grid);
  wireProjectActionButtons(grid);
}

// [04/01/2026] lightweight storage pulse based on project count instead of true cloud storage
function renderStoragePulse() {
  const totalSlots = 20;
  const usedSlots = dashboardImages.length;
  const percent = Math.min((usedSlots / totalSlots) * 100, 100);

  document.getElementById("storageBarFill").style.width = `${percent}%`;
  document.getElementById("storageText").textContent = `${usedSlots} of ${totalSlots} project slots used`;
}

// [04/01/2026] recent exports widget uses local browser history until a backend export history exists
function renderRecentExports() {
  const list = document.getElementById("recentExportsList");
  const exportsHistory = JSON.parse(localStorage.getItem("recentExports") || "[]");

  list.innerHTML = "";

  if (!exportsHistory.length) {
    list.innerHTML = "<li>No exports yet. Use the editor to export PNG files.</li>";
    return;
  }

  exportsHistory.slice(0, 5).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.title} — ${entry.date}`;
    list.appendChild(item);
  });
}

// [04/01/2026] make selection checkboxes update the bulk toolbar immediately
function wireProjectSelection(scopeElement) {
  scopeElement.querySelectorAll("[data-image-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const imageId = Number(event.target.dataset.imageSelect);
      if (event.target.checked) {
        selectedImageIds.add(imageId);
      } else {
        selectedImageIds.delete(imageId);
      }
      updateBulkToolbarState();
    });
  });
}

// [04/01/2026] one place to attach edit, delete, and versions events
function wireProjectActionButtons(scopeElement) {
  scopeElement.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const imageId = Number(button.dataset.id);

      if (action === "edit") {
        window.location.href = `editor.html?imageId=${imageId}`;
      }

      if (action === "delete") {
        await deleteImage(imageId);
      }

      if (action === "versions") {
        await showVersionHistory(imageId);
      }
    });
  });
}

// [04/01/2026] bulk toolbar only stays enabled when something is selected
function updateBulkToolbarState() {
  const deleteButton = document.getElementById("bulkDeleteButton");
  if (!deleteButton) return;

  deleteButton.disabled = selectedImageIds.size === 0;
  deleteButton.textContent = selectedImageIds.size
    ? `Delete Selected (${selectedImageIds.size})`
    : "Delete Selected";
}

// [04/01/2026] filter visible projects by title
function handleSearchInput(event) {
  const searchTerm = event.target.value.trim().toLowerCase();
  filteredImages = dashboardImages.filter((image) =>
    (image.title || "").toLowerCase().includes(searchTerm)
  );
  renderProjectsGrid();
  updateBulkToolbarState();
}

// [04/01/2026] select all currently visible cards
function selectAllVisibleProjects() {
  filteredImages.forEach((image) => selectedImageIds.add(image.id));
  renderProjectsGrid();
  updateBulkToolbarState();
}

// [04/01/2026] clear all current selections
function clearSelection() {
  selectedImageIds.clear();
  renderProjectsGrid();
  updateBulkToolbarState();
}

// [04/01/2026] bulk delete uses the existing backend delete route for each selected image
async function handleBulkDelete() {
  if (!selectedImageIds.size) return;

  const confirmDelete = confirm(`Delete ${selectedImageIds.size} selected project(s)?`);
  if (!confirmDelete) return;

  try {
    for (const imageId of selectedImageIds) {
      await makeRequest(`/images/${imageId}`, "DELETE");
    }

    selectedImageIds.clear();
    await loadGallery();
    alert("Selected projects deleted.");
  } catch (error) {
    console.error("Bulk delete error:", error);
    alert("Bulk delete failed.");
  }
}

// [04/01/2026] modal-free version history display keeps the project simple
async function showVersionHistory(imageId) {
  try {
    const versions = await makeRequest(`/images/versions/${imageId}`);
    if (!Array.isArray(versions) || !versions.length) {
      alert("No versions found for this image.");
      return;
    }

    const lines = versions.map((version) => `Version ${version.versionNumber} (ID: ${version.id})`).join("\n");
    const versionId = prompt(`Versions for image ${imageId}:\n${lines}\n\nEnter a version ID to restore, or leave blank to cancel:`);

    if (!versionId) return;

    await makeRequest(`/images/restore/${versionId}`, "POST");
    alert("Version restored successfully.");
    await loadGallery();
  } catch (error) {
    console.error("Version history error:", error);
    alert("Could not load or restore versions.");
  }
}

// [04/01/2026] dashboard upload reuses the existing upload helper
async function uploadFromDashboard() {
  await handleUpload();
}

// [04/01/2026] show and hide upload panel for a cleaner header
function showUploadPanel() {
  document.getElementById("uploadPanel").hidden = false;
}

function hideUploadPanel() {
  document.getElementById("uploadPanel").hidden = true;
}

// [04/01/2026] logout removes saved auth state
function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// [04/01/2026] build image URL in one place so it is easy to update later
function buildImageUrl(filePath) {
  return `${BASE_URL}/uploads/${filePath}`;
}

// [04/01/2026] format dates consistently across the dashboard
function formatDate(dateValue) {
  if (!dateValue) return "Unknown date";
  const date = new Date(dateValue);
  return date.toLocaleDateString();
}

// [04/01/2026] estimate file size for display until true file size is returned by the backend
function formatFileSizeEstimate(fileName) {
  if (!fileName) return "Unknown size";
  return "Image asset";
}

// [04/01/2026] protect rendered text from breaking HTML
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
