require('dotenv').config({ path: '.env.local' });
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PIC_SERVER_PORT;
const albumDataPath = process.env.ALBUM_LIST_PATH || 'album-list.txt';

let imageDetails = new Map();

function generateRandomId() {
    let id;
    do {
        id = `pic-${Math.floor(Math.random() * 1e10)}`;
    } while (imageDetails.has(id));
    return id;
}

function getPreviewImagePath(originalPath) {
    const directory = path.dirname(originalPath);
    const filename = path.basename(originalPath);
    const extensionIndex = filename.lastIndexOf('.');
    const name = filename.substring(0, extensionIndex);
    const extension = filename.substring(extensionIndex);
    return path.join(directory.replace('autopics', 'auto-prv'), `${name}-prv${extension}`);
}

async function initializeAlbumData() {
    try {
        const data = await fs.readFile(albumDataPath, 'utf8');
        data.split('\n').forEach(line => {
            const parts = line.split(';');
            if (parts.length < 5) {
                console.warn(`Invalid line: ${line}`);
                return;
            }
            const [imagePath, width, height, , description] = parts;
            const imageId = generateRandomId();
            imageDetails.set(imageId, {
                path: imagePath,
                previewPath: getPreviewImagePath(imagePath),
                width: parseInt(width, 10),
                height: parseInt(height, 10),
                description: description ? description.trim() : parts.slice(4).join(' ').trim()
            });
        });
    } catch (err) {
        console.error('Error initializing album data:', err);
    }
}

function filterImages(images, filterKeywords, sizeFilter) {
    const sizeRanges = {
        "500": { min: 0, max: 500 },
        "900": { min: 501, max: 900 },
        "1300": { min: 901, max: 1300 },
        "2600": { min: 1301, max: 2600 },
        "MORE!": { min: 2601, max: Infinity }
    };

    return images.filter(({ width, height, description }) => {
        const descriptionMatch = !filterKeywords.length || filterKeywords.every(keyword => description.toLowerCase().includes(keyword));
        let sizeMatch = true;

        if (sizeFilter && sizeRanges[sizeFilter]) {
            const { min, max } = sizeRanges[sizeFilter];
            const largestDimension = Math.max(width, height);
            sizeMatch = largestDimension >= min && largestDimension <= max;
        }

        return descriptionMatch && sizeMatch;
    });
}

app.get('/api/random-images', async (req, res) => {
    const filterKeywords = req.query.filter ? req.query.filter.toLowerCase().split(' ') : [];
    const widthFilter = req.query.width;
    const albums = new Map();

    imageDetails.forEach((details, id) => {
        const albumPath = path.dirname(details.path);
        if (!albums.has(albumPath)) {
            albums.set(albumPath, []);
        }
        albums.get(albumPath).push({ id, ...details });
    });

    let filteredAlbums = Array.from(albums.entries()).filter(([albumPath, images]) => {
        return filterImages(images, filterKeywords, widthFilter).length > 0;
    });

    if (filteredAlbums.length === 0) {
        return res.status(404).json({ error: 'No album found' });
    }

    const [randomAlbumPath, randomAlbumImages] = filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];
    const filteredImages = filterImages(randomAlbumImages, filterKeywords, widthFilter);

    res.json({
        images: filteredImages.map(({ id, previewPath }) => ({ id, previewPath })),
        description: randomAlbumImages[0].description
    });
});

app.get('/image', (req, res) => {
    const imageId = req.query.id;
    const preview = req.query.preview === 'true';

    if (imageDetails.has(imageId)) {
        const imagePath = preview ? imageDetails.get(imageId).previewPath : imageDetails.get(imageId).path;
        res.sendFile(imagePath);
    } else {
        res.status(404).send('Image not found');
    }
});

app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    initializeAlbumData();
});
