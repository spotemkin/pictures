const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;
const albumListPath = 'album-list.txt';

let albumList = [];
let albumDescriptions = {};

// Read album list and store the paths and descriptions
fs.readFile(albumListPath, 'utf8')
    .then(data => {
        data.split('\n').forEach(line => {
            const [fullPath, description] = line.split('\t');
            albumDescriptions[fullPath] = description;
            albumList.push(fullPath);
        });
    })
    .catch(err => console.error('Error reading album list:', err));

// API endpoint to get images from a random album with optional filter
app.get('/api/random-images', async (req, res) => {
    const filterKeywords = req.query.filter ? req.query.filter.toLowerCase().split(' ') : [];
    let filteredAlbumList = albumList;

    // Filter albums if filter is applied
    if (filterKeywords.length > 0) {
        filteredAlbumList = albumList.filter(albumPath => {
            const description = albumDescriptions[albumPath].toLowerCase();
            return filterKeywords.every(keyword => description.includes(keyword));
        });
    }

    if (filteredAlbumList.length === 0) {
        return res.status(404).json({ error: 'No album found' });
    }

    const randomAlbumIndex = Math.floor(Math.random() * filteredAlbumList.length);
    const albumPath = filteredAlbumList[randomAlbumIndex];

    try {
        const files = await fs.readdir(albumPath);
        const imageFiles = files.filter(file => file.endsWith('.jpg'));
        const imagePaths = imageFiles.map(file => path.join(albumPath, file));
        res.json({ images: imagePaths, description: albumDescriptions[albumPath] });
    } catch (err) {
        res.status(500).send('Error reading album');
    }
});

// Route to serve images from the local filesystem
app.get('/image', (req, res) => {
    const imagePath = req.query.path;
    res.sendFile(imagePath);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'my-react-app/build')));

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/my-react-app/build/index.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
