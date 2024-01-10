const workerpool = require('workerpool');
const fs = require('fs');

const checkJPGIntegrity = (filePath) => {
    const data = fs.readFileSync(filePath);
    return data[0] === 0xFF && data[1] === 0xD8 && data[data.length - 2] === 0xFF && data[data.length - 1] === 0xD9;
};

const processFile = (filePath) => {
    const isIntact = checkJPGIntegrity(filePath);
    if (isIntact) {
        fs.appendFileSync('d:\\autopics\\jpg-correct.txt', `${filePath}\n`);
    } else {
        fs.appendFileSync('d:\\autopics\\jpg-wrong.txt', `${filePath}\n`);
    }
    return `Processed: ${filePath}`;
};

// Register the function with the worker pool
workerpool.worker({
    processFile: processFile
});
