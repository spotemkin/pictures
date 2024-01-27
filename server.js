require('dotenv').config({ path: '.env.local' });
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PIC_SERVER_PORT;
const albumDataPath = process.env.ALBUM_LIST_PATH || 'album-list-ubnt.txt';

const morgan = require('morgan');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/exp-access.txt'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));

let imageDetails = new Map();

function generateRandomId() {
    let id;
    do {
        id = `pic-${Math.floor(Math.random() * 1e10)}`;
    } while (imageDetails.has(id));
    return id;
}

function initializeAlbumData() {
    try {
        const data = fs.readFileSync(albumDataPath, 'utf8');
        data.split('\n').forEach(line => {
            const parts = line.split(';');
            if (parts.length < 5) {
                console.warn(`Incorrect string format: ${line}`);
                return;
            }
            const [imagePath, width, height, , description] = parts;
            const imageId = generateRandomId();
            imageDetails.set(imageId, {
                path: imagePath,
                width: parseInt(width, 10),
                height: parseInt(height, 10),
                description: description ? description.trim() : parts.slice(4).join(' ').trim()
            });

            const previewPath = imagePath.replace('/auto/', '/auto-prv/').replace(/(\.[^.]+)$/, '-prv$1');
            const previewId = imageId + '-prv';
            imageDetails.set(previewId, {
                ...imageDetails.get(imageId),
                path: previewPath
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
        let sizeMatch = true; // Default to true if no size filter is applied

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

    // Get album using original images
    imageDetails.forEach((details, id) => {
        const albumPath = path.dirname(details.path);
        if (!albums.has(albumPath)) {
            albums.set(albumPath, []);
        }
        albums.get(albumPath).push({ id, ...details });
    });

    // filtr random album
    let filteredAlbums = Array.from(albums.entries()).filter(([albumPath, images]) => {
        return filterImages(images, filterKeywords, widthFilter).length > 0;
    });

    if (filteredAlbums.length === 0) {
        return res.status(404).json({ error: 'No album found' });
    }

    const [randomAlbumPath, randomAlbumImages] = filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];
    const filteredImages = filterImages(randomAlbumImages, filterKeywords, widthFilter);

    res.json({
        images: filteredImages.map(image => image.id),
        description: randomAlbumImages[0].description
    });
});

app.get('/api/random-preview', async (req, res) => {
    try {
        const filterKeywords = req.query.filter ? req.query.filter.toLowerCase().split(' ') : [];
           const widthFilter = req.query.width;
           const albums = new Map();
           // Get album using preview images
           imageDetails.forEach((details, id) => {
               if (!id.endsWith('-prv')) return; // work only with preview
               const albumPath = path.dirname(details.path);
               if (!albums.has(albumPath)) {
                   albums.set(albumPath, []);
               }
               albums.get(albumPath).push({ id, ...details });
           });
           // filtr random album
           let filteredAlbums = Array.from(albums.entries()).filter(([albumPath, images]) => {
               return filterImages(images, filterKeywords, widthFilter).length > 0;
           });
           if (filteredAlbums.length === 0) {
               return res.status(404).json({ error: 'No album found' });
           }
           const [randomAlbumPath, randomAlbumImages] = filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];
           const filteredImages = filterImages(randomAlbumImages, filterKeywords, widthFilter);
           res.json({
               images: filteredImages.map(image => image.id),
               description: randomAlbumImages[0].description
           });
       } catch (err)
       {console.log(err)}
});

app.get('/image', (req, res) => {
    const imageId = req.query.id;
    if (imageDetails.has(imageId)) {
        res.sendFile(imageDetails.get(imageId).path);
    } else {
        res.status(404).send('Image not found');
    }
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    const errorLogStream = fs.createWriteStream(path.join(__dirname, 'logs/exp-error.txt'), { flags: 'a' });
    errorLogStream.write(`[${new Date().toISOString()}] Error: ${err.message}\nStack: ${err.stack}\n`);
    res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    initializeAlbumData();
});