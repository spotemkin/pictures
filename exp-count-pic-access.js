const fs = require('fs').promises;

const logFile = 'exp-access.txt';
const outputFile = 'exp-count-pic-access.txt';
const hashRegex = /\/image\?id=pic-(\d{10})(?![\d-])/;

async function processLogs() {
  try {
    const data = await fs.readFile(logFile, 'utf8');
    const lines = data.split('\n');

    const hashCounts = {};
    lines.forEach(line => {
      const match = line.match(hashRegex);
      if (match) {
        const hash = match[1];
        hashCounts[hash] = (hashCounts[hash] || 0) + 1;
      }
    });

    const uniqueHashes = Object.keys(hashCounts).map(hash => ({ hash, count: hashCounts[hash] }));
    uniqueHashes.sort((a, b) => b.count - a.count);

    const outputData = uniqueHashes.map(({ hash, count }) => `${hash};${count};`).join('\n');
    await fs.writeFile(outputFile, outputData);
  } catch (error) {
    console.error('Error processing log file:', error);
  }
}

processLogs();
