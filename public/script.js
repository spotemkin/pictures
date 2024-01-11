const imageView = document.getElementById('image-viewer');
const albumDescription = document.getElementById('album-description');
const speedSlider = document.getElementById('speed-slider');
const togglePlayButton = document.getElementById('toggle-play');
const nextAlbumButton = document.getElementById('next-album');
const filterInput = document.getElementById('filter-input');
const filterButton = document.getElementById('filter-button');

let currentImages = [];
let currentIndex = 0;
let intervalId;
let isPlaying = true;

const fetchRandomImages = async (filter = '') => {
    try {
        const response = await fetch(`/api/random-images?filter=${encodeURIComponent(filter)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error fetching images');
        }
        const data = await response.json();
        currentImages = data.images;
        currentIndex = 0;
        albumDescription.textContent = data.description;
    } catch (error) {
        console.error('Error fetching images:', error);
        albumDescription.textContent = error.message;
        currentImages = []; // Clear the image list
    }
};

const updateImageDisplay = () => {
    if (currentIndex >= currentImages.length) {
        fetchRandomImages(filterInput.value.trim());
    } else {
        imageView.src = `/image?path=${encodeURIComponent(currentImages[currentIndex])}`;
        currentIndex++;
    }
};

const startSlideshow = () => {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateImageDisplay, speedSlider.value);
};

const togglePlay = () => {
    if (isPlaying) {
        clearInterval(intervalId);
        togglePlayButton.textContent = 'Play';
    } else {
        startSlideshow();
        togglePlayButton.textContent = 'Stop';
    }
    isPlaying = !isPlaying;
};

const goToNextAlbum = () => {
    fetchRandomImages(filterInput.value.trim()).then(() => {
        if (isPlaying) startSlideshow();
    });
};

speedSlider.addEventListener('change', () => {
    if (isPlaying) startSlideshow();
});

togglePlayButton.addEventListener('click', togglePlay);
nextAlbumButton.addEventListener('click', goToNextAlbum);

filterButton.addEventListener('click', () => {
    fetchRandomImages(filterInput.value.trim()).then(() => {
        if (isPlaying) startSlideshow();
    });
});

fetchRandomImages().then(startSlideshow);
