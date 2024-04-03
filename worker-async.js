const workerpool = require('workerpool');
const fs = require('fs').promises;

const checkJPGIntegrity = async (filePath) => {
    const data = await fs.readFile(filePath);
    return data[0] === 0xFF && data[1] === 0xD8 && data[data.length - 2] === 0xFF && data[data.length - 1] === 0xD9;
};

const processFile = async (filePath) => {
    const isIntact = await checkJPGIntegrity(filePath);
    if (isIntact) {
        await fs.appendFile('d:\\autopics\\jpg-correct-async.txt', `${filePath}\n`);
    } else {
        await fs.appendFile('d:\\autopics\\jpg-wrong-async.txt', `${filePath}\n`);
    }
};


workerpool.worker({
    processFile: processFile
});
