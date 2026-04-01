
async function handleUpload() {
    // get the elements from dashboard
    const fileInput = document.getElementById('imgFile');
    const titleInput = document.getElementById('imgTitle');

    // validation
    if (!fileInput || !fileInput.files[0]) {
        alert("Please select an image file to upload.");
        return;
    }

    const file = fileInput.files[0];
    const title = titleInput.value.trim() || "Untitled Image";

    
    const formData = new FormData();
    
 
    formData.append('image', file); 
    formData.append('title', title);

    try {
        console.log("Attempting to upload:", title);


        const response = await makeRequest('/images/upload', 'POST', formData, true);

        if (response) {
            alert("Upload Successful! Image metadata saved to MySQL.");
            
            // Clear the inputs
            titleInput.value = '';
            fileInput.value = '';

            if (typeof loadGallery === "function") {
                loadGallery();
            } else {
                window.location.reload();
            }
        }
    } catch (error) {
        console.error("Upload Error:", error);
        alert("Upload failed. Make sure the backend is running and you are logged in.");
    }
}


// Delete uploaded images
async function deleteImage(imageId) {
    if (!confirm("Are you sure you want to delete this image and all its versions?")) {
        return;
    }

    try {
        await makeRequest(`/images/${imageId}`, 'DELETE');
        alert("Image deleted successfully.");
        
        if (typeof loadGallery === "function") {
            loadGallery();
        } else {
            window.location.reload();
        }
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Could not delete image.");
    }
}
