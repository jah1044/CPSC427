let currentImg = null;



// load image from URL parameter when page loads

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);

    const imageId = params.get("id");

    const filePath = params.get("file");



    if (!imageId || !filePath) {

        alert("No image specified.");

        window.location.href = "dashboard.html";

        return;

    }



    loadImageToCanvas(imageId, filePath);

    loadVersionHistory(imageId);



    // wire up sliders

    document.getElementById("scale").addEventListener("input", redraw);

    document.getElementById("br").addEventListener("input", redraw);

});



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

        alert("No image loaded.");

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
