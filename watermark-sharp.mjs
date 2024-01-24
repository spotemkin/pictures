import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function processImage(filePath) {
    try {
        const outputDirPath = path.join('test');
        const outputFilePath = path.join(outputDirPath, path.basename(filePath));

        await fs.mkdir(outputDirPath, { recursive: true });

        const width = 1080;
        const height = 1920;
        const watermarkText = 'domiz.org/SomeUserName';
        const fontSize = 30;

        const imageBuffer = await fs.readFile(filePath);
        const metadata = await sharp(imageBuffer).metadata();
        const shouldResize = metadata.width > width || metadata.height > height;
        const offsetX = fontSize + 2;
        const offsetY = fontSize + 2;


        // SVG for the watermark with blurred text outline and solid text on top
        const svgWatermark = `
        <svg height="${fontSize + 30}" width="${watermarkText.length * fontSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="textBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" />
            </filter>
        </defs>
        <text x="60%" y="60%" font-family="SF Pro Text" font-size="${fontSize}" fill="#ffffff" stroke="white" stroke-width="4" stroke-opacity="0.1" filter="url(#textBlur)" text-anchor="middle" alignment-baseline="middle" dominant-baseline="central">${watermarkText}</text>
        <text x="60%" y="60%" font-family="SF Pro Text" font-size="${fontSize}" fill="#979797" text-anchor="middle" alignment-baseline="middle" dominant-baseline="central">${watermarkText}</text>
        </svg>`;

        const svgBuffer = Buffer.from(svgWatermark);

        const sharpResult = await sharp(imageBuffer)
            .resize({ width: shouldResize ? width : null, height: shouldResize ? height : null, fit: 'inside' })
            .composite([{
                input: svgBuffer,
                gravity: 'southeast',
                blend: 'over'
            }])
            .jpeg({ quality: 90 })
            .toBuffer();

        await fs.writeFile(outputFilePath, sharpResult);

        return {
            storagePath: outputFilePath,
            mediaType: 'IMAGE',
            width: shouldResize ? width : metadata.width,
            height: shouldResize ? height : metadata.height,
        };
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}

async function processImagesInDirectory(sourceDir) {
    try {
        const files = await fs.readdir(sourceDir);
        for (const file of files) {
            const filePath = path.join(sourceDir, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                console.log(`Processing ${filePath}`);
                const result = await processImage(filePath);
                console.log(`Processed image saved at ${result.storagePath}`);
            }
        }
    } catch (error) {
        console.error('Error processing images in directory:', error);
    }
}

const sourceDir = 'd:\\test-sharp';
processImagesInDirectory(sourceDir);
