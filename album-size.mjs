import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import PQueue from 'p-queue';

const directoryPath = 'd:\\autopics';
const queue = new PQueue({ concurrency: 100 });
const outputStream = fs.createWriteStream('album-size.txt', { flags: 'a' });

const processFile = async (filePath) => {
    try {
        const fileStats = await fs.promises.stat(filePath);
        const imageSize = await sharp(filePath).metadata();
        const fileDetails = `${filePath}\t${imageSize.width}\t${imageSize.height}\t${fileStats.size}\n`;
        outputStream.write(fileDetails);
    } catch (error) {
        const errorMessage = `${filePath}\tError processing file: ${error.message}\n`;
        outputStream.write(errorMessage);
        console.error(errorMessage);
    }
};

const processDirectory = async (dirPath) => {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const item of items) {
        if (item.isDirectory()) {
            await processDirectory(path.join(dirPath, item.name));
        } else {
            const filePath = path.join(dirPath, item.name);
            queue.add(() => processFile(filePath));
        }
    }
};

const listFilesWithDetails = async () => {
    try {
        await processDirectory(directoryPath);
        await queue.onIdle();
        outputStream.end();
        console.log('File details have been created.');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

listFilesWithDetails();
