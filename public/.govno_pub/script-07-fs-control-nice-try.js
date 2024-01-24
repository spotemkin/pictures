document.addEventListener('DOMContentLoaded', function () {
    // Element references
    const imageView = document.getElementById('image-viewer');
    const albumDescription = document.getElementById('album-description');
    const togglePlayButton = document.getElementById('toggle-play');
    const nextAlbumButton = document.getElementById('next-album');
    const filterInput = document.getElementById('filter-input');
    const filterButton = document.getElementById('filter-button');
    const widthFilterSelect = document.getElementById('width-filter');
    const filmstrip = document.getElementById('filmstrip');
    const detailsLink = document.getElementById('details-link');
    const contactInfo = document.getElementById('contact-info');
    const fullscreenAlbumTitle = document.createElement('div'); // Element for album title in fullscreen mode

    // State variables
    let currentImages = [];
    let currentIndex = 0;
    let intervalId;
    let isPlaying = true;
    let isFullScreen = false;

    // Initialize fullscreen album title element
    fullscreenAlbumTitle.id = 'fullscreen-album-title';
    fullscreenAlbumTitle.style.display = 'none';
    fullscreenAlbumTitle.style.position = 'absolute';
    fullscreenAlbumTitle.style.bottom = '10%';
    fullscreenAlbumTitle.style.left = '50%';
    fullscreenAlbumTitle.style.transform = 'translateX(-50%)';
    fullscreenAlbumTitle.style.color = 'white';
    fullscreenAlbumTitle.style.fontSize = '2em';
    fullscreenAlbumTitle.style.zIndex = '1000';
    fullscreenAlbumTitle.style.opacity = '0.8';
    document.body.appendChild(fullscreenAlbumTitle);

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
        const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
        imgElement.style.width = aspectRatio >= 1 ? '100%' : 'auto';
        imgElement.style.height = aspectRatio < 1 ? '100%' : 'auto';
    }

    // Function to update the display of the currently selected image
    const updateImageDisplay = () => {
        if (currentIndex >= currentImages.length) {
            fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        } else {
            const selectedImageId = currentImages[currentIndex];
            imageView.onload = function () { adjustImageAspectRatio(imageView); };
            imageView.src = `/image?id=${encodeURIComponent(selectedImageId)}`;

            currentIndex++;
            populateFilmstrip();
            document.querySelectorAll('.filmstrip-img').forEach((img) => {
                img.classList.toggle('selected', selectedImageId === img.dataset.imageId);
            });

            // Update fullscreen album title
            if (isFullScreen) {
                fullscreenAlbumTitle.textContent = albumDescription.textContent;
            }
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

    // Event listeners for delay switch
    document.querySelectorAll('input[name="delay"]').forEach(radio => {
        radio.addEventListener('change', startSlideshow);
    });

    // Existing event listeners
    togglePlayButton.addEventListener('click', togglePlay);
    nextAlbumButton.addEventListener('click', goToNextAlbum);
    filterButton.addEventListener('click', () => fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value));
    filterInput.addEventListener('keypress', (e) => {
        if (e.keyCode === 13) { // Enter key
            fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
        }
    });
    widthFilterSelect.addEventListener('change', () => fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value));

    // Function to toggle full screen mode
    function toggleFullScreenMode() {
        if (!isFullScreen) {
            // Enter full screen
            if (imageView.requestFullscreen) {
                imageView.requestFullscreen();
            } else if (imageView.webkitRequestFullscreen) { // Safari
                imageView.webkitRequestFullscreen();
            } else if (imageView.msRequestFullscreen) { // IE11
                imageView.msRequestFullscreen();
            }
            fullscreenAlbumTitle.style.display = 'block';
            togglePlayButton.classList.add('fullscreen-control');
            nextAlbumButton.classList.add('fullscreen-control');
            isFullScreen = true;
        } else {
            // Exit full screen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE11
                document.msExitFullscreen();
            }
            fullscreenAlbumTitle.style.display = 'none';
            togglePlayButton.classList.remove('fullscreen-control');
            nextAlbumButton.classList.remove('fullscreen-control');
            isFullScreen = false;
        }
        updateImageDisplay();
    }

    imageView.addEventListener('click', toggleFullScreenMode);

    detailsLink.addEventListener('click', function (event) {
        event.preventDefault();
        contactInfo.style.display = contactInfo.style.display === 'none' ? 'block' : 'none';
    });

    // Initial fetch of images
    fetchRandomImages();
});
