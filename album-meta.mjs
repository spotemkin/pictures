import fs from 'fs';
import path from 'path';
import exifreader from 'exifreader';
import PQueue from 'p-queue';

const directoryPath = 'd:\\autopics';
const queue = new PQueue({ concurrency: 100 });
const outputStream = fs.createWriteStream('txt/ap-meta-down.txt', { flags: 'a' });
let globalHeaders = new Set(['FilePath']);

const processFile = async (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const tags = exifreader.load(fileBuffer, { expanded: true });
        const fileData = new Map([['FilePath', filePath]]);

        Object.keys(tags).forEach(tag => {
            if (typeof tags[tag].value === 'string' && tags[tag].value.trim() !== '') {
                fileData.set(tag, tags[tag].value);
                globalHeaders.add(tag);
            }
        });

        return fileData;
    } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
        return new Map([['FilePath', filePath]]);
    }
};

const writeToFile = async (dataMapArray) => {
    const headers = Array.from(globalHeaders);
    outputStream.write(headers.join(';') + '\n');

    for (const dataMap of dataMapArray) {
        const row = headers.map(header => dataMap.get(header) || '').join(';');
        outputStream.write(row + '\n');
    }
};

const extractMetadata = async () => {
    const fileDataArray = [];

    const processDirectory = async (dirPath) => {
        const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const item of items) {
            if (item.isDirectory()) {
                await processDirectory(path.join(dirPath, item.name));
            } else {
                const filePath = path.join(dirPath, item.name);
                const fileData = await queue.add(() => processFile(filePath));
                fileDataArray.push(fileData);
            }
        }
    };

    try {
        await processDirectory(directoryPath);
        await queue.onIdle();
        await writeToFile(fileDataArray);
        outputStream.end();
    } catch (error) {
        console.error('Error occurred:', error);
    }
};

extractMetadata();
