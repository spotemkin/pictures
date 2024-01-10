const fs = require('fs');
const path = require('path');

const checkJPGIntegrity = (filePath) => {
  const data = fs.readFileSync(filePath);
  return data[0] === 0xFF && data[1] === 0xD8 && data[data.length - 2] === 0xFF && data[data.length - 1] === 0xD9;
};

const directoryPath = 'd:/autopics/'; // Dir path

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    if (path.extname(file).toLowerCase() === '.jpg') {
      const isIntact = checkJPGIntegrity(filePath);
      console.log(`File ${file} is ${isIntact ? 'intact' : 'corrupted'}`);
    }
  });
});
