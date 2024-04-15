require('dotenv').config({ path: '.env.local' });
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PIC_SERVER_PORT;
const albumDataPath = process.env.ALBUM_LIST_PATH || 'album-list-ubnt.txt';
const morgan = require('morgan');

// Setting up the access log stream for logging requests
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/exp-access.txt'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));

// Generate a random unique identifier for each image
let imageDetails = new Map();

function generateRandomId() {
    let id;
    do {
        id = `pic-${Math.floor(Math.random() * 1e10)}`;
    } while (imageDetails.has(id));
    return id;
}

// Initialize album data using a structured Map
function initializeAlbumData() {
    try {
        const data = fs.readFileSync(albumDataPath, 'utf8');
        data.split('\n').forEach(line => {
            const parts = line.split(';');
            if (parts.length < 5) {
                console.warn(`Incorrect string format: ${line}`);
                return;
            }

            // Destructuring the line into relevant parts
            const [imagePath, width, height, , description] = parts;
            const albumPath = path.dirname(imagePath);
            const imageId = generateRandomId();
            // Storing image details in the map with album path as key
            if (!imageDetails.has(albumPath)) {
                imageDetails.set(albumPath, []);
            }
            imageDetails.get(albumPath).push({
                id: imageId,
                path: imagePath,
                width: parseInt(width, 10),
                height: parseInt(height, 10),
                description: description ? description.trim() : parts.slice(4).join(' ').trim()
            });

            // Generate preview path and id, then store them as well
            const previewPath = imagePath.replace('/auto/', '/auto-prv/').replace(/(\.[^.]+)$/, '-prv$1');
            const previewId = imageId + '-prv';
            imageDetails.get(albumPath).push({
                id: previewId,
                path: previewPath,
                width: parseInt(width, 10),
                height: parseInt(height, 10),
                description: description ? description.trim() : parts.slice(4).join(' ').trim()
            });
        });
    } catch (err) {
        console.error('Error initializing album data:', err);
    }
}

// Function to filter images based on keywords and size
function filterImages(images, filterKeywords, sizeFilter) {
    const sizeRanges = {
        "500": { min: 0, max: 500 },
        "900": { min: 501, max: 900 },
        "1300": { min: 901, max: 1300 },
        "2600": { min: 1301, max: 2600 },
        "MORE!": { min: 2601, max: Infinity }
    };

    return images.filter(({ width, height, description }) => {
        // Check if image matches the description keywords
        const descriptionMatch = !filterKeywords.length || filterKeywords.every(keyword => description.toLowerCase().includes(keyword));
        let sizeMatch = true; // Default to true if no size filter is applied

        // Check if image matches the size filter
        if (sizeFilter && sizeRanges[sizeFilter]) {
            const { min, max } = sizeRanges[sizeFilter];
            const largestDimension = Math.max(width, height);
            sizeMatch = largestDimension >= min && largestDimension <= max;
        }

        return descriptionMatch && sizeMatch;
    });
}

// API endpoint to fetch random images based on filters
app.get('/api/random-images', async (req, res) => {
    const filterKeywords = req.query.filter ? req.query.filter.toLowerCase().split(' ') : [];
    const widthFilter = req.query.width;
    const albums = new Map();

    // Get album using original images
    imageDetails.forEach((images, albumPath) => {
        if (!albums.has(albumPath)) {
            albums.set(albumPath, []);
        }
        albums.get(albumPath).push(...images);
    });

    // Filter random album
    let filteredAlbums = Array.from(albums.entries()).filter(([albumPath, images]) => {
        return filterImages(images, filterKeywords, widthFilter).length > 0;
    });

    if (filteredAlbums.length === 0) {
        return res.status(404).json({ error: 'No album found' });
    }

    // Select a random album and its images
    const [randomAlbumPath, randomAlbumImages] = filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];
    const filteredImages = filterImages(randomAlbumImages, filterKeywords, widthFilter);

    // Send the filtered images in response
    res.json({
        images: filteredImages.map(image => image.id),
        description: randomAlbumImages[0].description
    });
});

// API endpoint to fetch random previews based on filters
app.get('/api/random-preview', async (req, res) => {
    try {
        // Extract filters from query parameters
        const filterKeywords = req.query.filter ? req.query.filter.toLowerCase().split(' ') : [];
        const widthFilter = req.query.width;
        const albums = new Map();

        // Get album using preview images
        imageDetails.forEach((images, albumPath) => {
            albums.set(albumPath, images.filter(image => image.id.endsWith('-prv')));
        });

        // Filter random album
        let filteredAlbums = Array.from(albums.entries()).filter(([albumPath, images]) => {
            return filterImages(images, filterKeywords, widthFilter).length > 0;
        });

        if (filteredAlbums.length === 0) {
            return res.status(404).json({ error: 'No album found' });
        }

        // Select a random album and its preview images
        const [randomAlbumPath, randomAlbumImages] = filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)];
        const filteredImages = filterImages(randomAlbumImages, filterKeywords, widthFilter);

        // Send the filtered preview images in response
        res.json({
            images: filteredImages.map(image => image.id),
            description: randomAlbumImages[0].description
        });
    } catch (err) {
        console.error('Error during API call:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to serve individual images by ID
app.get('/image', (req, res) => {
    const imageId = req.query.id;
    let found = false;
    imageDetails.forEach(images => {
        images.forEach(detail => {
            if (detail.id === imageId) {
                res.sendFile(detail.path);
                found = true;
            }
        });
    });
    if (!found) {
        res.status(404).send('Image not found');
    }
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware for handling server-side errors
app.use((err, req, res, next) => {
    const errorLogStream = fs.createWriteStream(path.join(__dirname, 'logs/exp-error.txt'), { flags: 'a' });
    errorLogStream.write(`[${new Date().toISOString()}] Error: ${err.message}\nStack: ${err.stack}\n`);
    res.status(500).send('Internal Server Error');
});

// Catch all URI and return index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server and initialize album data
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    initializeAlbumData();
});