document.addEventListener('DOMContentLoaded', function () {
    const imageView = document.getElementById('image-viewer');
    const albumDescription = document.getElementById('album-description');
    const speedSlider = document.getElementById('speed-slider');
    const togglePlayButton = document.getElementById('toggle-play');
    const nextAlbumButton = document.getElementById('next-album');
    const filterInput = document.getElementById('filter-input');
    const filterButton = document.getElementById('filter-button');
    const widthFilterSelect = document.getElementById('width-filter');
    const filmstrip = document.getElementById('filmstrip');

    let currentImages = [];
    let currentIndex = 0;
    let intervalId;
    let isPlaying = true;

    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
    });

    const loadAlbumImages = async () => {
        const imagePromises = currentImages.map(imageId =>
            loadImage(`/image?id=${encodeURIComponent(imageId)}`)
        );
        await Promise.all(imagePromises);
    };

    const fetchRandomImages = async (filter = '', widthFilter = '') => {
        try {
            const response = await fetch(`/api/random-images?filter=${encodeURIComponent(filter)}&width=${encodeURIComponent(widthFilter)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error fetching images');
            }
            const data = await response.json();
            currentImages = data.images;
            currentIndex = 0;
            albumDescription.textContent = data.description;
            await loadAlbumImages();
            populateFilmstrip();
            updateImageDisplay();
            if (isPlaying) {
                startSlideshow();
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            albumDescription.textContent = error.message;
            currentImages = [];
        }
    };

    const calculateFilmstripWidth = () => {
        const imageWidth = 100; // Assuming each filmstrip image is 100px wide
        return Math.floor(window.innerWidth / imageWidth);
    };

    const populateFilmstrip = () => {
        filmstrip.innerHTML = '';
        const maxImages = calculateFilmstripWidth();
        const startIndex = Math.max(currentIndex - Math.floor(maxImages / 2), 0);
        const endIndex = Math.min(startIndex + maxImages, currentImages.length);
        for (let i = startIndex; i < endIndex; i++) {
            const img = document.createElement('img');
            img.className = 'filmstrip-img' + (i === currentIndex ? ' selected' : '');
            img.src = /image?id=${encodeURIComponent(currentImages[i])};
            img.dataset.imageId = currentImages[i];
            img.onclick = () => {
                currentIndex = i;
                updateImageDisplay();
            };
            filmstrip.appendChild(img);
        }
        filmstrip.style.justifyContent = startIndex === 0 ? 'flex-start' : 'center';
    };
    const updateImageDisplay = () => {
        if (currentIndex >= currentImages.length) {
            fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        } else {
            const selectedImageId = currentImages[currentIndex];
            imageView.src = `/image?id=${encodeURIComponent(selectedImageId)}`;
            currentIndex++;
            populateFilmstrip();
            document.querySelectorAll('.filmstrip-img').forEach((img) => {
                img.classList.toggle('selected', selectedImageId === img.dataset.imageId);
            });
        }
    };

    const startSlideshow = () => {
        clearInterval(intervalId);
        intervalId = setInterval(updateImageDisplay, speedSlider.value);
    };

    const togglePlay = () => {
        isPlaying = !isPlaying;
        togglePlayButton.textContent = isPlaying ? 'Pause' : 'Play';
        if (isPlaying) {
            startSlideshow();
        } else {
            clearInterval(intervalId);
        }
    };

    const goToNextAlbum = () => {
        clearInterval(intervalId);
        fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        if (isPlaying) {
            startSlideshow();
        }
    };

    // Touch events for filmstrip on mobile devices
    let touchStartX = 0;
    filmstrip.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, false);

    filmstrip.addEventListener('touchmove', (e) => {
        const touchEndX = e.touches[0].clientX;
        filmstrip.scrollLeft += touchStartX - touchEndX;
        touchStartX = touchEndX;
    }, false);
    speedSlider.addEventListener('change', startSlideshow);
    togglePlayButton.addEventListener('click', togglePlay);
    nextAlbumButton.addEventListener('click', goToNextAlbum);
    filterButton.addEventListener('click', () => fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value));
    widthFilterSelect.addEventListener('change', () => fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value));

    fetchRandomImages();
});