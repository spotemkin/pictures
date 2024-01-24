const fs = require('fs');
const path = require('path');
const dhash = require('dhashjs'); // Импорт всей библиотеки
const { createWriteStream, readdir, stat } = fs;
const async = require('async');
const { promisify } = require('util');

const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);

const baseDirectory = 'D:\\autopics'; // Исходная директория
const outputFile = 'txt/hash-list-autopics.txt'; // Выходной файл
const maxFilesAtOnce = 100; // Максимальное количество одновременно обрабатываемых файлов
const threadCount = 32; // Количество потоков в пуле

const writeStream = createWriteStream(outputFile, { flags: 'a' });

async function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        // Используем dhash напрямую
        const hashData = await dhash(content); 
        const relativePath = path.relative(baseDirectory, filePath);
        writeStream.write(`${hashData};${relativePath};\n`);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
    }
}

async function processDirectory(directory) {
    const files = await readdirAsync(directory);
    const fileProcessingTasks = files.map(file => {
        return async () => {
            const filePath = path.join(directory, file);
            const fileStat = await statAsync(filePath);
            if (fileStat.isDirectory()) {
                await processDirectory(filePath);
            } else {
                await processFile(filePath);
            }
        };
    });

    const limitedParallelTasks = async.parallelLimit(fileProcessingTasks, maxFilesAtOnce);
    await limitedParallelTasks;
}

async function hashDirectories(baseDir) {
    const directories = await readdirAsync(baseDir);
    const pool = async.cargo(async (dirPaths, callback) => {
        await Promise.all(dirPaths.map(processDirectory));
        callback();
    }, threadCount);

    pool.drain(() => {
        writeStream.end();
        console.log('All directories have been processed.');
    });

    directories.forEach(dirPath => {
        const fullPath = path.join(baseDir, dirPath);
        pool.push(fullPath);
    });
}

hashDirectories(baseDirectory).catch(console.error);
