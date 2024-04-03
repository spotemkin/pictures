const workerpool = require('workerpool');
const fs = require('fs');
const path = require('path');

// Function to recursively list all files in a directory
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

// Get list of all JPG files
const files = getAllFiles('D:\\autopics\\');

// Create a worker pool
const pool = workerpool.pool('./worker.js', { maxWorkers: 24 });

// Process each file using the pool
const promises = files.map(file => {
    return pool.exec('processFile', [file])
        .then(result => console.log(result))
        .catch(err => console.error(err));
});

// Wait for all promises to resolve
Promise.all(promises).then(() => {
    console.log('All files processed');
    pool.terminate(); // Terminate the pool when done
}).catch(err => {
    console.error('Error processing files:', err);
    pool.terminate();
});
