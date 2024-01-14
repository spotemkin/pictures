const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;
const albumListPath = 'album-list.txt';

let albumList = [];
let albumDescriptions = {};
let imageMap = new Map();

function generateRandomId() {
    let id;
    do {
        id = `pic-${Math.floor(Math.random() * 1e10)}`;
    } while (imageMap.has(id));
    return id;
}

async function initializeAlbumData() {
    try {
        const data = await fs.readFile(albumListPath, 'utf8');
        data.split('\n').forEach(line => {
            const [fullPath, description] = line.split('\t');
            albumDescriptions[fullPath] = description;
            albumList.push(fullPath);
        });

        for (let albumPath of albumList) {
            const files = await fs.readdir(albumPath);
            files.forEach(file => {
                if (file.endsWith('.jpg')) {
                    const imagePath = path.join(albumPath, file);
                    const imageId = generateRandomId();
                    imageMap.set(imageId, imagePath);
                }
            });
        }
    } catch (err) {
        console.error('Error initializing album data:', err);
    }
}

app.get('/api/random-images', async (req, res) => {
    const filterKeywords = req.query.filter ? req.query.filter.toLowerCase().split(' ') : [];
    let filteredAlbumList = albumList;

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
        const imageIds = imageFiles.map(file => {
            const imagePath = path.join(albumPath, file);
            for (let [id, path] of imageMap) {
                if (path === imagePath) return id;
            }
        });
        res.json({ images: imageIds, description: albumDescriptions[albumPath] });
    } catch (err) {
        res.status(500).send('Error reading album');
    }
});

app.get('/image', (req, res) => {
    const imageId = req.query.id;
    if (imageMap.has(imageId)) {
        res.sendFile(imageMap.get(imageId));
    } else {
        res.status(404).send('Image not found');
    }
});


app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    initializeAlbumData();
});
