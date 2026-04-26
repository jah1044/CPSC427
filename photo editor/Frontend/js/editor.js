// ==========================================================
// Photo Editor Capstone Project
// File: editor.js
// Description: Loads images into the canvas, supports preview mode,
// saves versions, and restores versions.
// Date: 04/2026
// ==========================================================

let currentImg = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);

    let imageId = params.get("id");
    let filePath = params.get("file");

    // Fallback if the server removes the URL values
    if (!imageId) {
        imageId = localStorage.getItem("currentImageId");
    }

    if (!filePath) {
        filePath = localStorage.getItem("currentImagePath");
    }

    console.log("IMAGE ID:", imageId);
    console.log("FILE PATH:", filePath);

    if (!imageId || !filePath) {
        console.warn("No image selected. Loading preview mode.");
        enablePreviewMode();
        loadPreviewCanvas();
        wirePreviewSliders();
        return;
    }

    localStorage.setItem("currentImageId", imageId);
    localStorage.setItem("currentImagePath", filePath);

    loadImageToCanvas(imageId, filePath);
    loadVersionHistory(imageId);
    wireEditorSliders();
});

function wireEditorSliders() {
    document.getElementById("scale")?.addEventListener("input", redraw);
    document.getElementById("br")?.addEventListener("input", redraw);
    document.getElementById("contrast")?.addEventListener("input", redraw);
    document.getElementById("rBalance")?.addEventListener("input", redraw);
    document.getElementById("gBalance")?.addEventListener("input", redraw);
    document.getElementById("bBalance")?.addEventListener("input", redraw);

    document.getElementById("saveVersionButton")?.addEventListener("click", saveCurrentVersion);
}

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

function wirePreviewSliders() {
    document.getElementById("scale")?.addEventListener("input", loadPreviewCanvas);
    document.getElementById("br")?.addEventListener("input", loadPreviewCanvas);
}

function loadPreviewCanvas() {
    const canvas = document.getElementById("editorCanvas");

    if (!canvas) {
        console.error("editorCanvas not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const scale = document.getElementById("scale")
        ? document.getElementById("scale").value / 100
        : 1;

    const brightness = document.getElementById("br")
        ? document.getElementById("br").value / 100
        : 1;

    canvas.width = Math.max(1, Math.floor(900 * scale));
    canvas.height = Math.max(1, Math.floor(560 * scale));
    canvas.dataset.imageId = "";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.filter = `brightness(${brightness})`;

    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "#c7d2fe");
    bg.addColorStop(0.5, "#bfdbfe");
    bg.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    roundRect(ctx, canvas.width * 0.155, canvas.height * 0.125, canvas.width * 0.69, canvas.height * 0.68, 24);
    ctx.fill();

    const inner = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    inner.addColorStop(0, "#dbeafe");
    inner.addColorStop(1, "#c4b5fd");
    ctx.fillStyle = inner;
    roundRect(ctx, canvas.width * 0.195, canvas.height * 0.19, canvas.width * 0.61, canvas.height * 0.44, 18);
    ctx.fill();

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

    ctx.fillStyle = "#111827";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Editor Preview", canvas.width * 0.34, canvas.height * 0.72);

    ctx.fillStyle = "#475569";
    ctx.font = "20px Arial";
    ctx.fillText("Canvas demo for landing page screenshots", canvas.width * 0.24, canvas.height * 0.78);

    ctx.restore();
}

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

function loadImageToCanvas(imageId, filePath) {
    const canvas = document.getElementById("editorCanvas");

    if (!canvas) {
        console.error("editorCanvas not found.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.crossOrigin = "anonymous";

    const imageUrl = formatImageUrl(filePath);

    console.log("LOADING IMAGE:", imageUrl);

    img.src = imageUrl;

    img.onload = () => {
        currentImg = img;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.dataset.imageId = imageId;
    };

    img.onerror = () => {
        console.error("FAILED TO LOAD IMAGE:", imageUrl);
        alert("Could not load image. Check the console for the image path.");
    };
}

function formatImageUrl(filePath) {
    if (!filePath) return "";

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
    }

    if (filePath.startsWith("/uploads/")) {
        return `http://localhost:5000${filePath}`;
    }

    if (filePath.startsWith("uploads/")) {
        return `http://localhost:5000/${filePath}`;
    }

    return `http://localhost:5000/uploads/${filePath}`;
}

function redraw() {
    if (!currentImg) return;

    const canvas = document.getElementById("editorCanvas");
    const ctx = canvas.getContext("2d");

    if (typeof applyFiltersToCanvas === "function") {
        applyFiltersToCanvas(ctx, currentImg, canvas);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);
    }
}

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

async function loadVersionHistory(imageId) {
    try {
        const versions = await makeRequest(`/images/versions/${imageId}`);
        renderVersionList(versions, imageId);
    } catch (err) {
        console.error("Load versions error:", err);
    }
}

function renderVersionList(versions, imageId) {
    const list = document.getElementById("versionList");

    if (!list) return;

    list.innerHTML = "";

    if (!versions || !versions.length) {
        list.innerHTML = "<p>No versions yet.</p>";
        return;
    }

    versions.forEach((v) => {
        const item = document.createElement("div");
        item.className = "version-item";

        item.innerHTML = `
            <span>${v.versionNumber === 0 ? "Original" : "Version " + v.versionNumber}</span>
            <button type="button" onclick="restoreVersion(${v.id}, '${escapeHtml(v.filePath)}', ${imageId})">
                Restore
            </button>
        `;

        list.appendChild(item);
    });
}

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

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}