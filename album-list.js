const fs = require('fs').promises;
const path = require('path');

// Directory to scan
const directoryPath = 'd:\\autopics';

// Function to list directories and format their names
const listDirectories = async () => {
    try {
        const items = await fs.readdir(directoryPath, { withFileTypes: true });
        const directories = items
            .filter(item => item.isDirectory())
            .map(dir => dir.name.replace(/-/g, ' ')); // Replace dashes with spaces

        await fs.writeFile('album-list.txt', directories.join('\n'));
        console.log('Album list has been created.');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

listDirectories();
