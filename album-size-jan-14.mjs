<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Image Viewer</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="controls">
        <input type="text" id="filter-input" placeholder="Search albums...">
        <select id="width-filter">
            <option value="">All Widths</option>
            <option value="500">Up to 500 px</option>
            <option value="900">501 - 900 px</option>
            <option value="1300">901 - 1300 px</option>
            <option value="2600">1301 - 2600 px</option>
            <option value="MORE!">2601 px and more</option>
        </select>
        <button id="filter-button">Search</button>
        <input type="range" id="speed-slider" min="100" max="10000" value="2000" step="any">
        <button id="toggle-play">Pause</button>
        <button id="next-album">Next Album</button>
    </div>
    <img id="image-viewer" src="" alt="Random Album Image">
    <div id="album-description"></div>
    <div id="filmstrip"></div>
    <script src="script.js"></script>
</body>
</html>