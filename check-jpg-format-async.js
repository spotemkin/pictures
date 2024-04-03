// check all pic for jpg format
// run node --max-old-space-size=32768 ./check-jpg-format-async.js
const workerpool = require('workerpool');
const fs = require('fs');
const path = require('path');

// Get all JPEG files from a directory
const getAllFiles = (dir, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (path.extname(file).toLowerCase() === '.jpg') {
            fileList.push(filePath);
        }
    });
    return fileList;
};

const files = getAllFiles('D:\\autopics\\');

// Reduce the number of workers to manage memory usage
const pool = workerpool.pool('./worker-async.js', { maxWorkers: 16 });
let lastLoggedTime = Date.now();

const promises = files.map((file, index) => {
    return pool.exec('processFile', [file])
        .then(() => {
            if (Date.now() - lastLoggedTime >= 1000) {
                console.log(`Processing: ${file}`);
                lastLoggedTime = Date.now();
            }
        })
        .catch(err => console.error(err));
});

Promise.all(promises).then(() => {
    console.log('All files processed');
    pool.terminate();
}).catch(err => {
    console.error('Error processing files:', err);
    pool.terminate();
});
