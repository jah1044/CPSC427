function applyFiltersToCanvas(ctx, img, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
}

function applySepia() {
    console.log("Sepia clicked");
}

function applyBlur() {
    console.log("Blur clicked");
}

function applyEdgeDetection() {
    console.log("Edge clicked");
}

function downloadImage(type) {
    const canvas = document.getElementById('editorCanvas');

    const link = document.createElement('a');
    link.download = `image.${type}`;
    link.href = canvas.toDataURL(`image/${type}`);
    link.click();
}
