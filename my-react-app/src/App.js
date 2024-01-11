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
        if (data.images.length === 0) {
          console.error('No images found for the filter:', filter);
          setIsPlaying(false); // Остановим слайдшоу, если изображений нет
          document.getElementById('album-description').textContent = 'No images found';
        } else {
          setImages(data.images);
          setCurrentIndex(0);
          document.getElementById('album-description').textContent = data.description;
        }
      })
      .catch((error) => {
        console.error('Error fetching images:', error);
        document.getElementById('album-description').textContent = error.message;
        setImages([]);
        setIsPlaying(false); // Остановим слайдшоу в случае ошибки
      });
  };

  const updateImageDisplay = () => {
    if (currentIndex >= images.length) {
      console.log('End of album reached, fetching new album.');
      fetchAlbum(filterTerm);
    } else {
      document.getElementById('image-viewer').src = `/image?path=${encodeURIComponent(images[currentIndex])}`;
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      const id = setInterval(updateImageDisplay, sliderValue);
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  useEffect(() => {
    if (isPlaying && images.length > 0) {
      const id = setInterval(updateImageDisplay, sliderValue);
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
    }

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [images, currentIndex, sliderValue, isPlaying]);

  useEffect(() => {
    fetchAlbum(filterTerm);
  }, [filterTerm]);

  useEffect(() => {
    // Стартуем слайдшоу при монтировании компонента
    if (images.length > 0 && isPlaying) {
      const id = setInterval(updateImageDisplay, sliderValue);
      setIntervalId(id);
    }
    return () => clearInterval(intervalId);
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
          onChange={(e) => setSliderValue(Number(e.target.value))}
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
