// ==========================================================
// Photo Editor Capstone Project
// File: editor.js
// Description: Loads images into the canvas, supports preview mode, saves versions, and restores versions.
// Date: 04/2026
// ==========================================================

let currentImg = null;

// load image from URL parameter when page loads
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const imageId = params.get("id");
    const filePath = params.get("file");

    // [04/22/2026] allow preview mode with no selected image
    if (!imageId || !filePath) {
        enablePreviewMode();
        loadPreviewCanvas();
        wirePreviewSliders();
        return;
    }

    loadImageToCanvas(imageId, filePath);
    loadVersionHistory(imageId);

    // wire up sliders
    document.getElementById("scale").addEventListener("input", redraw);
    document.getElementById("br").addEventListener("input", redraw);
    document.getElementById("contrast").addEventListener("input", redraw);
    document.getElementById("rBalance").addEventListener("input", redraw);
    document.getElementById("gBalance").addEventListener("input", redraw);
    document.getElementById("bBalance").addEventListener("input", redraw);
});

// [04/22/2026] change editor UI for screenshot/demo mode
function enablePreviewMode() {
    const title = document.getElementById("editorTitle");
    const saveButton = document.getElementById("saveVersionButton");
    const versionsPanel = document.getElementById("versionsPanel");

    if (title) {
        title.textContent = "Demo Preview";
    }

    if (saveButton) {
        saveButton.style.display = "none";
    }

    if (versionsPanel) {
        versionsPanel.style.display = "none";
    }
}

// [04/22/2026] let preview mode sliders still redraw the demo canvas
function wirePreviewSliders() {
    document.getElementById("scale").addEventListener("input", loadPreviewCanvas);
    document.getElementById("br").addEventListener("input", loadPreviewCanvas);
}

// [04/22/2026] draw a demo canvas so the editor can be previewed without a real image
function loadPreviewCanvas() {
    const canvas = document.getElementById("editorCanvas");
    const ctx = canvas.getContext("2d");

    const scale = document.getElementById("scale") ? document.getElementById("scale").value / 100 : 1;
    const brightness = document.getElementById("br") ? document.getElementById("br").value / 100 : 1;

    canvas.width = Math.max(1, Math.floor(900 * scale));
    canvas.height = Math.max(1, Math.floor(560 * scale));
    canvas.dataset.imageId = "";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.filter = `brightness(${brightness})`;

    // background
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#c7d2fe");
    bg.addColorStop(0.5, "#bfdbfe");
    bg.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // photo-like frame
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    roundRect(ctx, canvas.width * 0.155, canvas.height * 0.125, canvas.width * 0.69, canvas.height * 0.68, 24);
    ctx.fill();

    // fake image area
    const inner = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    inner.addColorStop(0, "#dbeafe");
    inner.addColorStop(1, "#c4b5fd");
    ctx.fillStyle = inner;
    roundRect(ctx, canvas.width * 0.195, canvas.height * 0.19, canvas.width * 0.61, canvas.height * 0.44, 18);
    ctx.fill();

    // decorative shapes
    ctx.fillStyle = "rgba(79,70,229,0.22)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.325, canvas.height * 0.375, canvas.width * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(37,99,235,0.28)";
    ctx.beginPath();
    ctx.moveTo(canvas.width * 0.52, canvas.height * 0.555);
    ctx.lineTo(canvas.width * 0.69, canvas.height * 0.285);
    ctx.lineTo(canvas.width * 0.78, canvas.height * 0.555);
    ctx.closePath();
    ctx.fill();

    // label text
    ctx.fillStyle = "#111827";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Editor Preview", canvas.width * 0.34, canvas.height * 0.72);

    ctx.fillStyle = "#475569";
    ctx.font = "20px Arial";
    ctx.fillText("Canvas demo for landing page screenshots", canvas.width * 0.24, canvas.height * 0.78);

    ctx.restore();
}

// helper to draw rounded rectangles on canvas
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// load the image onto the canvas
function loadImageToCanvas(imageId, filePath) {
    const canvas = document.getElementById("editorCanvas");
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `http://localhost:5000/uploads/${filePath}`;

    img.onload = () => {
        currentImg = img;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        // store imageId on canvas for save/restore to use
        canvas.dataset.imageId = imageId;
    };

    img.onerror = () => {
        alert("Could not load image.");
    };
}

// redraw canvas with all active filters and slider values
function redraw() {
    if (!currentImg) return;
    const canvas = document.getElementById("editorCanvas");
    const ctx = canvas.getContext("2d");
    applyFiltersToCanvas(ctx, currentImg, canvas);
}

// save current canvas state as a new version
async function saveCurrentVersion() {
    const canvas = document.getElementById("editorCanvas");
    const imageId = canvas.dataset.imageId;

    if (!imageId) {
        alert("Preview mode only. Load a real image to save a version.");
        return;
    }

    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "version.png");
        formData.append("imageId", imageId);

        try {
            await makeRequest("/images/save", "POST", formData);
            alert("Version saved!");
            loadVersionHistory(imageId);
        } catch (err) {
            console.error("Save version error:", err);
            alert(err.message || "Could not save version.");
        }
    }, "image/png");
}

// load version history from backend and render the list
async function loadVersionHistory(imageId) {
    try {
        const versions = await makeRequest(`/images/versions/${imageId}`);
        renderVersionList(versions, imageId);
    } catch (err) {
        console.error("Load versions error:", err);
    }
}

// render version list in the aside panel
function renderVersionList(versions, imageId) {
    const list = document.getElementById("versionList");
    list.innerHTML = "";

    if (!versions.length) {
        list.innerHTML = "<p>No versions yet.</p>";
        return;
    }

    versions.forEach((v) => {
        const item = document.createElement("div");
        item.className = "version-item";
        item.innerHTML = `
            <span>${v.versionNumber === 0 ? "Original" : "Version " + v.versionNumber}</span>
            <button onclick="restoreVersion(${v.id}, '${v.filePath}', ${imageId})">Restore</button>
        `;
        list.appendChild(item);
    });
}

// restore a previous version by reloading that file onto the canvas
async function restoreVersion(versionId, filePath, imageId) {
    const confirmed = confirm("Restore this version? Unsaved changes will be lost.");
    if (!confirmed) return;

    try {
        await makeRequest(`/images/restore/${versionId}`, "POST");
        loadImageToCanvas(imageId, filePath);
        loadVersionHistory(imageId);
        alert("Version restored.");
    } catch (err) {
        console.error("Restore error:", err);
        alert(err.message || "Could not restore version.");
    }
}
