const fs = require('fs');
const path = require('path');

async function convertPdfToPng() {
    try {
        const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
        const { createCanvas } = require('canvas');

        const pdfPath = path.resolve(__dirname, 'Linear logo.pdf');
        const outputPath = path.resolve(__dirname, 'public/images/linear_logo_cdr.png');

        const data = new Uint8Array(fs.readFileSync(pdfPath));

        // Use legacy build which works in Node.js
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdfDoc = await loadingTask.promise;

        console.log('PDF loaded, pages:', pdfDoc.numPages);

        const page = await pdfDoc.getPage(1);

        // High DPI for crisp logo: 4x scale (around 300 DPI equivalent)
        const scale = 4;
        const viewport = page.getViewport({ scale });

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // White background for clean rendering
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;
        console.log('Rendered at scale', scale, ':', canvas.width, 'x', canvas.height);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        console.log('Saved to:', outputPath);
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
    }
}

convertPdfToPng();
