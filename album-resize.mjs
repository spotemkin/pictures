import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import PQueue from 'p-queue';

const sourceDirectoryPath = 'd:\\autopics';
const destinationDirectoryPath = 'd:\\auto-prv';
const queue = new PQueue({ concurrency: 100 });

const resizeAndSaveImage = async (sourcePath, destinationPath) => {
    try {
        await sharp(sourcePath)
            .resize(160, 120, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(destinationPath);
    } catch (error) {
        console.error(`Error processing file ${sourcePath}: ${error.message}`);
    }
};

const processDirectory = async (dirPath, parentDirectoryName) => {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            const newDirPath = path.join(dirPath.replace(sourceDirectoryPath, destinationDirectoryPath), item.name);
            if (!fs.existsSync(newDirPath)) {
                fs.mkdirSync(newDirPath, { recursive: true });
            }
            await processDirectory(path.join(dirPath, item.name), item.name);
        } else {
            const filePath = path.join(dirPath, item.name);
            const newFilePath = path.join(dirPath.replace(sourceDirectoryPath, destinationDirectoryPath), `${path.parse(item.name).name}-prv.jpg`);
            queue.add(() => resizeAndSaveImage(filePath, newFilePath));
        }
    }
};

const resizeImagesInDirectory = async () => {
    try {
        if (!fs.existsSync(destinationDirectoryPath)) {
            fs.mkdirSync(destinationDirectoryPath, { recursive: true });
        }
        await processDirectory(sourceDirectoryPath, '');
        await queue.onIdle();
        console.log('Image processing complete.');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

resizeImagesInDirectory();
