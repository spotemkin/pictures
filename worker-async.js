const workerpool = require('workerpool');
const fs = require('fs');
const util = require('util');
const stream = require('stream');

const pipeline = util.promisify(stream.pipeline);

// Функция для проверки целостности файла JPEG
const checkJPGIntegrity = async (filePath) => {
    const isJpeg = (buffer) => {
        const len = buffer.length;
        return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[len - 2] === 0xFF && buffer[len - 1] === 0xD9;
    };

    try {
        const chunks = [];
        await pipeline(
            fs.createReadStream(filePath),
            new stream.Transform({
                transform(chunk, encoding, callback) {
                    chunks.push(chunk);
                    callback();
                }
            })
        );
        const buffer = Buffer.concat(chunks);
        return isJpeg(buffer);
    } catch (err) {
        console.error(`Error processing file ${filePath}: ${err}`);
        return false;
    }
};

const processFile = async (filePath) => {
    const isIntact = await checkJPGIntegrity(filePath);
    const targetFile = isIntact ? 'd:\\autopics\\jpg-correct-async.txt' : 'd:\\autopics\\jpg-wrong-async.txt';
    try {
        await fs.promises.appendFile(targetFile, `${filePath}\n`);
    } catch (err) {
        console.error(`Error writing to file: ${err}`);
    }
};

workerpool.worker({
    processFile: processFile
});
