const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();
const port = 3000;
const albumListPath = 'album-list.txt';

// Настройка логирования с Morgan
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan(':date[iso] - :remote-addr - :user-agent - :url', { stream: accessLogStream }));

// Ограничение запросов
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10, // Ограничение: 10 запросов на IP
    message: 'Too many albums requested from this IP, please try again after an hour'
});

// Применение ограничения к API
app.use('/api/random-images', limiter);

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
    res.sendFile(imagePath); // Убрать root, если путь уже абсолютный
});

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
