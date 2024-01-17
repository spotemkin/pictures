document.addEventListener('DOMContentLoaded', function () {
    const imageView = document.getElementById('image-viewer');
    const albumDescription = document.getElementById('album-description');
    // Removed speedSlider as it's replaced by radio buttons
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

    // Function to load an image and adjust its aspect ratio
    const loadImage = src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            adjustImageAspectRatio(img);
            resolve();
        };
        img.onerror = reject;
        img.src = src;
    });

    // Function to load images for the current album
    const loadAlbumImages = async () => {
        const imagePromises = currentImages.map(imageId =>
            loadImage(`/image?id=${encodeURIComponent(imageId)}`)
        );
        await Promise.all(imagePromises);
    };

    // Function to fetch random images based on filters
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

    // Function to calculate the number of images to show in the filmstrip
    const calculateFilmstripWidth = () => {
        const imageWidth = 100; // Assuming each filmstrip image is 100px wide
        return Math.floor(window.innerWidth / imageWidth);
    };

    // Function to populate the filmstrip with images
    const populateFilmstrip = () => {
        filmstrip.innerHTML = '';
        const maxImages = calculateFilmstripWidth();
        const startIndex = Math.max(currentIndex - Math.floor(maxImages / 2), 0);
        const endIndex = Math.min(startIndex + maxImages, currentImages.length);
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
        filmstrip.style.justifyContent = startIndex === 0 ? 'flex-start' : 'center';
    };

    // Function to adjust image aspect ratio
    function adjustImageAspectRatio(imgElement) {
        var aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        imgElement.style.width = aspectRatio >= 1 ? '100%' : 'auto';
        imgElement.style.height = aspectRatio < 1 ? '100%' : 'auto';
    }

    // Function to update the display
    // of the currently selected image
    const updateImageDisplay = () => {
        if (currentIndex >= currentImages.length) {
            fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        } else {
            const selectedImageId = currentImages[currentIndex];
            imageView.onload = function() { adjustImageAspectRatio(imageView); };
            imageView.src = `/image?id=${encodeURIComponent(selectedImageId)}`;

            currentIndex++;
            populateFilmstrip();
            document.querySelectorAll('.filmstrip-img').forEach((img) => {
                img.classList.toggle('selected', selectedImageId === img.dataset.imageId);
            });
        }
    };

    // Function to start the slideshow
    const startSlideshow = () => {
        clearInterval(intervalId);
        intervalId = setInterval(updateImageDisplay, getSelectedDelay());
    };

    // Function to toggle the slideshow play/pause state
    const togglePlay = () => {
        isPlaying = !isPlaying;
        togglePlayButton.textContent = isPlaying ? 'Pause' : 'Play';
        if (isPlaying) {
            startSlideshow();
        } else {
            clearInterval(intervalId);
        }
    };

    // Function to go to the next album
    const goToNextAlbum = () => {
        clearInterval(intervalId);
        fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        if (isPlaying) {
            startSlideshow();
        }
    };

    // Helper function to get the selected delay value from the radio buttons
    const getSelectedDelay = () => {
        const delayRadioButtons = document.querySelectorAll('input[name="delay"]');
        for (let radio of delayRadioButtons) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return '5000'; // Default value
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

    // Event listeners for the new delay switch
    document.querySelectorAll('input[name="delay"]').forEach(radio => {
        radio.addEventListener('change', startSlideshow);
    });

    // Existing event listeners
    togglePlayButton.addEventListener('click', togglePlay);
    nextAlbumButton.addEventListener('click', goToNextAlbum);
    filterButton.addEventListener('click', () => fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value));
    filterInput.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) {
            fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        }
    });
    widthFilterSelect.addEventListener('change', () => fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value));

    // Initial fetch of images
    fetchRandomImages();
});
