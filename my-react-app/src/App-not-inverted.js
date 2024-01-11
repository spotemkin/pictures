import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const [sliderValue, setSliderValue] = useState(2000);

  const fetchAlbum = (filter = '') => {
    fetch(`/api/random-images?filter=${encodeURIComponent(filter)}`)
      .then((res) => res.json())
      .then((data) => {
        setImages(data.images);
        setCurrentIndex(0);
        document.getElementById('album-description').textContent = data.description;
      })
      .catch((error) => {
        console.error('Error fetching images:', error);
        document.getElementById('album-description').textContent = error.message;
        setImages([]);
      });
  };

  const updateImageDisplay = () => {
    if (currentIndex >= images.length) {
      fetchAlbum(filterTerm);
    } else if (images.length) {
      document.getElementById('image-viewer').src = `/image?path=${encodeURIComponent(images[currentIndex])}`;
      setCurrentIndex(currentIndex + 1);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      clearInterval(intervalId);
      setIntervalId(null);
    } else {
      setIntervalId(setInterval(updateImageDisplay, sliderValue));
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && images.length > 0) {
      clearInterval(intervalId);
      setIntervalId(setInterval(updateImageDisplay, sliderValue));
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [images, currentIndex, sliderValue, isPlaying]);

  useEffect(() => {
    fetchAlbum();
  }, []);

  return (
    <div>
      <div className="controls">
        <input
          type="text"
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          placeholder="Search albums..."
        />
        <button onClick={() => fetchAlbum(filterTerm)}>Search</button>
        <input
          type="range"
          min="500"
          max="10000"
          value={sliderValue}
          step="any"
          onChange={(e) => setSliderValue(e.target.value)}
        />
        <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={() => fetchAlbum(filterTerm)}>Next Album</button>
      </div>
      <img id="image-viewer" src="" alt="Random Album Image" />
      <div id="album-description"></div>
    </div>
  );
}

export default App;
