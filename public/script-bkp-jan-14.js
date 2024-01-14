document.addEventListener('DOMContentLoaded', function () {
    const imageView = document.getElementById('image-viewer');
    const albumDescription = document.getElementById('album-description');
    const speedSlider = document.getElementById('speed-slider');
    const togglePlayButton = document.getElementById('toggle-play');
    const nextAlbumButton = document.getElementById('next-album');
    const filterInput = document.getElementById('filter-input');
    const filterButton = document.getElementById('filter-button');
    const filmstrip = document.getElementById('filmstrip');

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
            populateFilmstrip();
            updateImageDisplay();
        } catch (error) {
            console.error('Error fetching images:', error);
            albumDescription.textContent = error.message;
            currentImages = [];
        }
    };

    const populateFilmstrip = () => {
        filmstrip.innerHTML = '';
        const startIndex = Math.max(currentIndex - 5, 0);
        const endIndex = Math.min(startIndex + 11, currentImages.length);
        for (let i = startIndex; i < endIndex; i++) {
            const img = document.createElement('img');
            img.className = 'filmstrip-img' + (i === currentIndex ? ' selected' : '');
            img.src = `/image?id=${encodeURIComponent(currentImages[i])}`;
            img.dataset.imageId = currentImages[i];
            img.onclick = () => {
                currentIndex = i;
                updateImageDisplay();
            };
            filmstrip.appendChild(img);
        }
    };

    const updateImageDisplay = () => {
        if (currentIndex >= currentImages.length) {
            fetchRandomImages(filterInput.value.trim());
        } else {
            const selectedImageId = currentImages[currentIndex];
            imageView.src = `/image?id=${encodeURIComponent(selectedImageId)}`;
            currentIndex++;
            populateFilmstrip();
            document.querySelectorAll('.filmstrip-img').forEach((img, index) => {
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
        fetchRandomImages(filterInput.value.trim());
        if (isPlaying) {
            startSlideshow();
        }
    };

    speedSlider.addEventListener('change', startSlideshow);
    togglePlayButton.addEventListener('click', togglePlay);
    nextAlbumButton.addEventListener('click', goToNextAlbum);
    filterButton.addEventListener('click', () => fetchRandomImages(filterInput.value.trim()));

    fetchRandomImages();
});
