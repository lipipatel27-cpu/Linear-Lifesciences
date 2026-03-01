import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

async function convertPdfToPng() {
    try {
        const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Point to the worker .mjs file
        GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;

        const pdfPath = resolve(__dirname, 'Linear logo.pdf');
        const outputPath = resolve(__dirname, 'public/images/linear_logo_cdr.png');

        const data = new Uint8Array(readFileSync(pdfPath));

        const standardFontDataUrl = resolve(__dirname, 'node_modules/pdfjs-dist/standard_fonts/') + '/';
        const loadingTask = getDocument({
            data,
            useSystemFonts: true,
            standardFontDataUrl,
        });
        const pdfDoc = await loadingTask.promise;

        console.log('PDF loaded, pages:', pdfDoc.numPages);

        const page = await pdfDoc.getPage(1);

        // High DPI: 4x scale for crisp logo
        const scale = 4;
        const viewport = page.getViewport({ scale });

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        // White background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;
        console.log('Rendered:', canvas.width, 'x', canvas.height);

        const buffer = canvas.toBuffer('image/png');
        writeFileSync(outputPath, buffer);
        console.log('SUCCESS: Saved PNG to:', outputPath);

        await pdfDoc.destroy();
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
    }
}

convertPdfToPng();
