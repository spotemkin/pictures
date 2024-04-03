const fs = require('fs').promises;
const path = require('path');

// Path to the log file containing paths of corrupted JPG files
const logFilePath = 'd:\\autopics\\jpg-wrong-async.txt';

// Function to delete a file
const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
        console.log(`Deleted: ${filePath}`);
    } catch (err) {
        console.error(`Error deleting ${filePath}:`, err.message);
    }
};

// Main function to process the log file and delete each listed file
const processLogFile = async () => {
    try {
        const fileContent = await fs.readFile(logFilePath, 'utf8');
        const files = fileContent.split('\n');

        for (const file of files) {
            if (file) await deleteFile(file);
        }

        console.log('All listed files have been processed.');
    } catch (err) {
        console.error('Error reading log file:', err.message);
    }
};

processLogFile();
