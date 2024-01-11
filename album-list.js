const fs = require('fs').promises;
const path = require('path');

// Directory to scan
const directoryPath = 'd:\\autopics';

// Function to list directories and format their names
const listDirectories = async () => {
    try {
        const items = await fs.readdir(directoryPath, { withFileTypes: true });
        const directoryList = items
            .filter(item => item.isDirectory())
            .map(dir => {
                const fullPath = path.join(directoryPath, dir.name);
                const formattedName = dir.name.replace(/-/g, ' ');
                return `${fullPath}\t${formattedName}`;
            });

        await fs.writeFile('album-list.txt', directoryList.join('\n'));
        console.log('Album list has been created.');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

listDirectories();
