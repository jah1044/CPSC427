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
    window.location.href = "login.html";
  }
}

// [04/01/2026] attach event listeners once after the page loads
function bindDashboardEvents() {
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

// [04/01/2026] load the current user's info into the dashboard
async function loadUserSummary() {
  const user = await makeRequest("/auth/me");
  localStorage.setItem("user", JSON.stringify(user));

  document.getElementById("displayUsername").textContent = user.username || "User";

  const topName = document.getElementById("displayUsernameTop");
  if (topName) {
    topName.textContent = user.username || "Account";
  }

  const avatar = document.querySelector(".account-chip__avatar");
  if (avatar && user.username) {
    avatar.textContent = user.username.charAt(0).toUpperCase();
  }
}

// [04/01/2026] load user summary and project gallery together
async function initializeDashboard() {
  try {
    await loadUserSummary();
    await loadGallery();
  } catch (error) {
    console.error("Dashboard init error:", error);
    alert("Could not load dashboard data.");
  }
}

// [04/01/2026] fetch all images for the logged-in user
async function loadGallery() {
  const images = await makeRequest("/images");
  dashboardImages = Array.isArray(images) ? images : [];
  filteredImages = [...dashboardImages];

  const validIds = new Set(dashboardImages.map((image) => image.id));
  [...selectedImageIds].forEach((id) => {
    if (!validIds.has(id)) {
      selectedImageIds.delete(id);
    }
  });

  renderProjectsGrid();
  renderStoragePulse();
  updateBulkToolbarState();
}

// [04/01/2026] render project cards with checkboxes and edit action
function renderProjectsGrid() {
  const grid = document.getElementById("projectsGrid");
  grid.innerHTML = "";

  if (!filteredImages.length) {
    grid.innerHTML = '<p class="empty-state">No projects yet. Upload an image to get started.</p>';
    return;
  }

  filteredImages.forEach((img) => {
    const isSelected = selectedImageIds.has(img.id);

    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card__select">
        <input type="checkbox" data-image-id="${img.id}" ${isSelected ? "checked" : ""} />
      </div>

      <div class="project-card__body">
        <h4>${escapeHtml(img.title || "Untitled")}</h4>

        <div class="card-actions">
          <button
            class="button button--primary"
            type="button"
            data-edit-id="${img.id}"
            data-file-path="${escapeHtml(img.originalFilePath || "")}"
          >
            Edit
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  wireProjectSelection();
  wireEditButtons();
}

// [04/01/2026] attach checkbox listeners after cards are rendered
function wireProjectSelection() {
  document.querySelectorAll("[data-image-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const imageId = Number(event.target.dataset.imageId);

      if (event.target.checked) {
        selectedImageIds.add(imageId);
      } else {
        selectedImageIds.delete(imageId);
      }

      updateBulkToolbarState();
    });
  });
}



// [04/01/2026] open editor page for the selected image
function wireEditButtons() {
  document.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const imageId = button.dataset.editId;
      const filePath = button.dataset.filePath;

      if (!imageId || !filePath) {
        alert("Could not open editor for this image.");
        return;
      }

      window.location.href = `editor.html?id=${imageId}&file=${encodeURIComponent(filePath)}`;
    });
  });
}

// [04/01/2026] update the storage pulse based on current image count
function renderStoragePulse() {
  const total = 20;
  const used = dashboardImages.length;
  const percent = Math.min((used / total) * 100, 100);

  document.getElementById("storageBarFill").style.width = `${percent}%`;
  document.getElementById("storageText").textContent = `${used} of ${total} project slots used`;
}

// [04/01/2026] show the upload panel
function showUploadPanel() {
  document.getElementById("uploadPanel").hidden = false;
}

// [04/01/2026] hide the upload panel
function hideUploadPanel() {
  document.getElementById("uploadPanel").hidden = true;
}

// [04/01/2026] upload a file, then refresh the dashboard automatically
async function uploadFromDashboard() {
  try {
    await handleUpload();
    await loadGallery();
    hideUploadPanel();

    const titleInput = document.getElementById("imgTitle");
    const fileInput = document.getElementById("imgFile");

    if (titleInput) titleInput.value = "";
    if (fileInput) fileInput.value = "";
  } catch (error) {
    console.error("Upload failed:", error);
    alert(error.message || "Upload failed.");
  }
}

// [04/01/2026] filter visible images by title
function handleSearchInput(e) {
  const term = e.target.value.toLowerCase();
  filteredImages = dashboardImages.filter((img) =>
    (img.title || "").toLowerCase().includes(term)
  );
  renderProjectsGrid();
  updateBulkToolbarState();
}

// [04/01/2026] select all images currently visible in the filtered grid
function selectAllVisibleProjects() {
  filteredImages.forEach((img) => {
    selectedImageIds.add(img.id);
  });

  renderProjectsGrid();
  updateBulkToolbarState();
}

// [04/01/2026] clear all current selections
function clearSelection() {
  selectedImageIds.clear();
  renderProjectsGrid();
  updateBulkToolbarState();
}

// [04/01/2026] delete all selected images using the existing backend route
async function handleBulkDelete() {
  if (selectedImageIds.size === 0) {
    alert("Select at least one image to delete.");
    return;
  }

  const confirmed = confirm(`Delete ${selectedImageIds.size} selected image(s)?`);
  if (!confirmed) return;

  try {
    for (const imageId of selectedImageIds) {
      await makeRequest(`/images/${imageId}`, "DELETE");
    }

    selectedImageIds.clear();
    await loadGallery();
    alert("Selected images deleted successfully.");
  } catch (error) {
    console.error("Bulk delete error:", error);
    alert(error.message || "Could not delete selected images.");
  }
}

// [04/01/2026] enable or disable the bulk delete button based on selections
function updateBulkToolbarState() {
  const deleteButton = document.getElementById("bulkDeleteButton");
  if (!deleteButton) return;

  deleteButton.disabled = selectedImageIds.size === 0;
  deleteButton.textContent =
    selectedImageIds.size > 0
      ? `Delete Selected (${selectedImageIds.size})`
      : "Delete Selected";
}

// [04/01/2026] escape text safely before rendering into HTML
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
