// ==========================================================
// Photo Editor Capstone Project
// File: filters.js
// Description: Applies Canvas image filters and pixel-processing effects such as brightness, sepia, blur, and edge detection.
// Date: 04/2026
// ==========================================================

// active filter state

let sepiaActive = false;

let blurActive = false;

let edgeActive = false;



// base image which is set by editor.js when image loads

let baseImageData = null;



function setBaseImageData(ctx, canvas) {

    baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

}



// main render function, this applies all active adjustments in order

function applyFiltersToCanvas(ctx, img, canvas) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);



    // scale

    const scale = document.getElementById('scale').value / 100;

    const w = img.naturalWidth * scale;

    const h = img.naturalHeight * scale;

    canvas.width = w;

    canvas.height = h;

    ctx.drawImage(img, 0, 0, w, h);



    // get pixel data to change

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);



    // brightness

    const brightness = document.getElementById('br').value / 100;

    imageData = applyBrightness(imageData, brightness);



    // filters (only one active at a time)

    if (sepiaActive) imageData = applySepiaToData(imageData);

    if (blurActive) imageData = applyBlurToData(imageData, canvas.width, canvas.height);

    if (edgeActive) imageData = applyEdgeToData(imageData, canvas.width, canvas.height);



    ctx.putImageData(imageData, 0, 0);

}



// brightness, multiply each RGB channel by factor

function applyBrightness(imageData, factor) {

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {

        data[i]     = Math.min(255, data[i]     * factor); // R

        data[i + 1] = Math.min(255, data[i + 1] * factor); // G

        data[i + 2] = Math.min(255, data[i + 2] * factor); // B

    }

    return imageData;

}



// sepia standard sepia matrix per pixel

function applySepiaToData(imageData) {

    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {

        const r = data[i], g = data[i + 1], b = data[i + 2];

        data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);

        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);

        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);

    }

    return imageData;

}



// blur simple box blur using 3x3 kernel

function applyBlurToData(imageData, width, height) {

    const src = new Uint8ClampedArray(imageData.data);

    const dst = imageData.data;

    for (let y = 1; y < height - 1; y++) {

        for (let x = 1; x < width - 1; x++) {

            for (let c = 0; c < 3; c++) {

                let sum = 0;

                for (let ky = -1; ky <= 1; ky++) {

                    for (let kx = -1; kx <= 1; kx++) {

                        const idx = ((y + ky) * width + (x + kx)) * 4 + c;

                        sum += src[idx];

                    }

                }

                const idx = (y * width + x) * 4 + c;

                dst[idx] = sum / 9;

            }

        }

    }

    return imageData;

}



// edge detection

function applyEdgeToData(imageData, width, height) {

    const src = new Uint8ClampedArray(imageData.data);

    const dst = imageData.data;

    for (let y = 1; y < height - 1; y++) {

        for (let x = 1; x < width - 1; x++) {

            const idx = (y * width + x) * 4;

            // grayscale the 3x3 neighborhood first

            const px = (cx, cy) => {

                const i = ((y + cy) * width + (x + cx)) * 4;

                return 0.299 * src[i] + 0.587 * src[i+1] + 0.114 * src[i+2];

            };

            const gx =

                -px(-1,-1) + px(1,-1) +

                -2*px(-1,0) + 2*px(1,0) +

                -px(-1,1) + px(1,1);

            const gy =

                -px(-1,-1) - 2*px(0,-1) - px(1,-1) +

                 px(-1,1)  + 2*px(0,1)  + px(1,1);

            const mag = Math.min(255, Math.sqrt(gx*gx + gy*gy));

            dst[idx] = dst[idx+1] = dst[idx+2] = mag;

        }

    }

    return imageData;

}



// toggle buttons

function applySepia() {

    sepiaActive = !sepiaActive;

    blurActive = false;

    edgeActive = false;

    redraw();

}



function applyBlur() {

    blurActive = !blurActive;

    sepiaActive = false;

    edgeActive = false;

    redraw();

}



function applyEdgeDetection() {

    edgeActive = !edgeActive;

    sepiaActive = false;

    blurActive = false;

    redraw();

}



function downloadImage(type) {

    const canvas = document.getElementById('editorCanvas');

    const link = document.createElement('a');

    link.download = `image.${type}`;

    link.href = canvas.toDataURL(`image/${type}`);

    link.click();

}
