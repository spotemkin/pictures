document.addEventListener("DOMContentLoaded", function () {
  const imageView = document.getElementById("image-viewer");
  const albumDescription = document.getElementById("album-description");
  const togglePlayButton = document.getElementById("toggle-play");
  const nextAlbumButton = document.getElementById("next-album");
  const filterInput = document.getElementById("filter-input");
  const filterButton = document.getElementById("filter-button");
  const widthFilterSelect = document.getElementById("width-filter");
  const filmstrip = document.getElementById("filmstrip");
  const detailsLink = document.getElementById("details-link");
  const contactInfo = document.getElementById("contact-info");
  const urlPath = window.location.pathname.slice(1);
  const searchQuery = urlPath.replace(/-/g, " ");
  const lowerCasePath = urlPath.toLowerCase();
  const albumCountElement = document.getElementById("album-count");
  const imageCountElement = document.getElementById("image-count");

  if (urlPath !== lowerCasePath) {
    window.history.replaceState(null, "", lowerCasePath);
  }
  if (searchQuery) {
    filterInput.value = decodeURIComponent(searchQuery);
  }

  let currentImages = [];
  let currentIndex = 0;
  let intervalId;
  let isPlaying = true;
  let isFullScreen = false;

  const ensurePreviewImage = async (keyword) => {
    if (!keyword) return;
    try {
      const response = await fetch(
        `/api/search/${keyword.replace(/\s+/g, "-")}`
      );
      if (!response.ok) throw new Error("Failed to ensure preview image");
      const data = await response.json();
      console.log("Preview image is ready:", data.path);
    } catch (error) {
      console.error("Error ensuring preview image:", error);
    }
  };

  const fetchRandomImages = async (filter = "", widthFilter = "") => {
    try {
      const response = await fetch(
        `/api/random-preview?filter=${encodeURIComponent(
          filter
        )}&width=${encodeURIComponent(widthFilter)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching images");
      }
      const data = await response.json();
      currentImages = data.images;
      currentIndex = 0;
      albumDescription.textContent = data.description;
      albumCountElement.textContent = `${data.matchingAlbums}`;
      imageCountElement.textContent = `${data.matchingImages}`;
      populateFilmstrip();
      updateImageDisplay();
      if (isPlaying) startSlideshow();
    } catch (error) {
      console.error("Error fetching images:", error);
      albumDescription.textContent = error.message;
      albumCountElement.textContent = "";
      imageCountElement.textContent = "";
      currentImages = [];
    }
  };

  const calculateFilmstripWidth = () => Math.floor(window.innerWidth / 100);

  const populateFilmstrip = () => {
    filmstrip.innerHTML = "";
    const maxImages = calculateFilmstripWidth();
    const startIndex = Math.max(currentIndex - Math.floor(maxImages / 2), 0);
    const endIndex = Math.min(startIndex + maxImages, currentImages.length);
    for (let i = startIndex; i < endIndex; i++) {
      const img = document.createElement("img");
      img.className = "filmstrip-img" + (i === currentIndex ? " selected" : "");
      img.src = `/image?id=${encodeURIComponent(currentImages[i])}`;
      img.dataset.imageId = currentImages[i];
      img.onclick = () => {
        currentIndex = i;
        updateImageDisplay();
      };
      filmstrip.appendChild(img);
    }
    filmstrip.style.justifyContent = startIndex === 0 ? "flex-start" : "center";
  };

  const updateURL = (searchText) => {
    const newUrl = "/" + searchText.trim().replace(/\s+/g, "-").toLowerCase();
    if (window.location.pathname !== newUrl) {
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  };

  const adjustImageAspectRatio = (imgElement) => {
    const containerHeight =
      window.innerHeight -
      document.querySelector(".controls").offsetHeight -
      document.querySelector("#album-description").offsetHeight;
    imgElement.style.maxHeight = `${containerHeight}px`;
    imgElement.style.maxWidth = "100%";
    imgElement.style.width = "auto";
    imgElement.style.height = "auto";
  };

  const updateImageDisplay = () => {
    if (currentIndex >= currentImages.length) {
      fetchRandomImages(filterInput.value.trim(), widthFilterSelect.value);
    } else {
      const previewImageId = currentImages[currentIndex];
      const originalImageId = previewImageId.replace("-prv", "");
      imageView.onload = () => adjustImageAspectRatio(imageView);
      imageView.src = `/image?id=${encodeURIComponent(originalImageId)}`;

      currentIndex++;
      populateFilmstrip();
      document.querySelectorAll(".filmstrip-img").forEach((img) => {
        img.classList.toggle(
          "selected",
          previewImageId === img.dataset.imageId
        );
      });
    }
  };

  const startSlideshow = () => {
    if (currentImages.length > 0) {
      clearInterval(intervalId);
      intervalId = setInterval(updateImageDisplay, getSelectedDelay());
    } else {
      console.log("No images to display, slideshow not started");
    }
  };

  const togglePlay = () => {
    isPlaying = !isPlaying;
    togglePlayButton.textContent = isPlaying ? "Pause" : "Play";
    if (isPlaying) startSlideshow();
    else clearInterval(intervalId);
  };

  const goToNextAlbum = () => {
    clearInterval(intervalId);
    const searchText = filterInput.value.trim();
    updateURL(searchText);
    ensurePreviewImage(searchText)
      .then(() => fetchRandomImages(searchText, widthFilterSelect.value))
      .catch((error) => {
        console.error("Failed to prepare preview image:", error);
        fetchRandomImages();
      });
  };

  const getSelectedDelay = () => {
    const delayRadioButtons = document.querySelectorAll('input[name="delay"]');
    for (let radio of delayRadioButtons) {
      if (radio.checked) return radio.value;
    }
    return "5000";
  };

  filmstrip.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    false
  );

  filmstrip.addEventListener(
    "touchmove",
    (e) => {
      const touchEndX = e.touches[0].clientX;
      filmstrip.scrollLeft += touchStartX - touchEndX;
      touchStartX = touchEndX;
    },
    false
  );

  document.querySelectorAll('input[name="delay"]').forEach((radio) => {
    radio.addEventListener("change", startSlideshow);
  });

  togglePlayButton.addEventListener("click", togglePlay);
  nextAlbumButton.addEventListener("click", goToNextAlbum);
  filterButton.addEventListener("click", () => {
    const searchText = filterInput.value.trim();
    updateURL(searchText);
    ensurePreviewImage(searchText).then(() =>
      fetchRandomImages(searchText, widthFilterSelect.value)
    );
  });

  filterInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const searchText = filterInput.value.trim();
      updateURL(searchText);
      ensurePreviewImage(searchText);
      fetchRandomImages(searchText, widthFilterSelect.value);
    }
  });

  widthFilterSelect.addEventListener("change", () => {
    const searchText = filterInput.value.trim();
    updateURL(searchText);
    ensurePreviewImage(searchText)
      .then(() => fetchRandomImages(searchText, widthFilterSelect.value))
      .catch((error) => console.error("Error preparing preview image:", error));
  });

  imageView.addEventListener("click", toggleFullScreenMode);

  function toggleFullScreenMode() {
    if (!isFullScreen) {
      if (imageView.requestFullscreen) imageView.requestFullscreen();
      else if (imageView.webkitRequestFullscreen)
        imageView.webkitRequestFullscreen();
      else if (imageView.msRequestFullscreen) imageView.msRequestFullscreen();
      isFullScreen = true;
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
      isFullScreen = false;
    }
    updateImageDisplay();
  }

  detailsLink.addEventListener("click", (event) => {
    event.preventDefault();
    contactInfo.style.display =
      contactInfo.style.display === "none" ? "block" : "none";
  });

  if (searchQuery) {
    ensurePreviewImage(searchQuery)
      .then(() => fetchRandomImages(searchQuery, widthFilterSelect.value))
      .catch((error) => {
        console.error("Error during initial image preparation:", error);
        fetchRandomImages();
      });
  } else {
    console.log("No initial search query provided, loading a random album.");
    fetchRandomImages();
  }
});
