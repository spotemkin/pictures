require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const morgan = require("morgan");

const app = express();
const port = process.env.PIC_SERVER_PORT;
const albumDataPath = process.env.ALBUM_LIST_PATH || "album-list-ubnt.txt";

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs/exp-access.log"),
  { flags: "a" }
);
app.use(morgan("combined", { stream: accessLogStream }));

let imageDetails = new Map();

async function ensurePreviewImage(albumKeywords) {
  const keywords = albumKeywords
    .toLowerCase()
    .split("-")
    .map((kw) => kw.trim());
  const previewDirectory = "public/preview";
  const previewFilename = `imola-${keywords.join("-")}.jpg`;
  const fullPath = path.join(previewDirectory, previewFilename);

  try {
    await fsPromises.access(fullPath, fs.constants.F_OK);
    console.log("Preview image already exists:", fullPath);
    return fullPath;
  } catch {
    const albumPaths = Array.from(imageDetails.keys());
    const matchingAlbumPaths = albumPaths.filter((albumPath) =>
      keywords.every((keyword) => albumPath.toLowerCase().includes(keyword))
    );

    if (matchingAlbumPaths.length === 0) {
      throw new Error(
        "No matching album found for the keywords: " + albumKeywords
      );
    }

    const randomAlbumPath =
      matchingAlbumPaths[Math.floor(Math.random() * matchingAlbumPaths.length)];
    const images = imageDetails.get(randomAlbumPath);
    const largeImages = images.filter((img) => !img.path.includes("-prv"));

    if (largeImages.length === 0) {
      throw new Error("No large image found in the selected album.");
    }

    const randomLargeImage =
      largeImages[Math.floor(Math.random() * largeImages.length)];
    const imageBuffer = await fsPromises.readFile(randomLargeImage.path);
    await fsPromises.writeFile(fullPath, imageBuffer);
    console.log("Created new preview image:", fullPath);
    return fullPath;
  }
}

function generateRandomId() {
  let id;
  do {
    id = `pic-${Math.floor(Math.random() * 1e10)}`;
  } while (imageDetails.has(id));
  return id;
}

async function initializeAlbumData() {
  try {
    const data = await fsPromises.readFile(albumDataPath, "utf8");
    const lines = data.split("\n");

    for (const line of lines) {
      const parts = line.split(";");
      if (parts.length < 5) {
        console.warn(`Incorrect string format: ${line}`);
        continue;
      }

      const [imagePath, width, height, , description] = parts;
      const albumPath = path.dirname(imagePath);
      const imageId = generateRandomId();

      if (!imageDetails.has(albumPath)) {
        imageDetails.set(albumPath, []);
      }
      imageDetails.get(albumPath).push({
        id: imageId,
        path: imagePath,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        description: description
          ? description.trim()
          : parts.slice(4).join(" ").trim(),
      });

      const previewPath = imagePath
        .replace("/auto/", "/auto-prv/")
        .replace(/(\.[^.]+)$/, "-prv$1");
      const previewId = imageId + "-prv";
      imageDetails.get(albumPath).push({
        id: previewId,
        path: previewPath,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        description: description
          ? description.trim()
          : parts.slice(4).join(" ").trim(),
      });
    }
  } catch (err) {
    console.error("Error initializing album data:", err);
  }
}

function filterImages(images, filterKeywords, sizeFilter) {
  const sizeRanges = {
    500: { min: 0, max: 500 },
    900: { min: 501, max: 900 },
    1300: { min: 901, max: 1300 },
    2600: { min: 1301, max: 2600 },
    "MORE!": { min: 2601, max: Infinity },
  };

  return images.filter(({ width, height, description }) => {
    const descriptionMatch =
      !filterKeywords.length ||
      filterKeywords.every((keyword) =>
        description.toLowerCase().includes(keyword)
      );
    let sizeMatch = true;

    if (sizeFilter && sizeRanges[sizeFilter]) {
      const { min, max } = sizeRanges[sizeFilter];
      const largestDimension = Math.max(width, height);
      sizeMatch = largestDimension >= min && largestDimension <= max;
    }

    return descriptionMatch && sizeMatch;
  });
}

app.get("/api/random-images", async (req, res) => {
  const filterKeywords = req.query.filter
    ? req.query.filter.toLowerCase().split(" ")
    : [];
  const widthFilter = req.query.width;
  const albums = new Map();

  imageDetails.forEach((images, albumPath) => {
    if (!albums.has(albumPath)) {
      albums.set(albumPath, []);
    }
    albums.get(albumPath).push(...images);
  });

  let filteredAlbums = Array.from(albums.entries()).filter(
    ([albumPath, images]) =>
      filterImages(images, filterKeywords, widthFilter).length > 0
  );

  if (filteredAlbums.length === 0) {
    return res.status(404).json({ error: "No album found" });
  }

  const randomAlbumImages =
    filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)][1];
  const filteredImages = filterImages(
    randomAlbumImages,
    filterKeywords,
    widthFilter
  );

  res.json({
    images: filteredImages.map((image) => image.id),
    description: randomAlbumImages[0].description,
  });
});

app.get("/api/random-preview", async (req, res) => {
  try {
    const filterKeywords = req.query.filter
      ? req.query.filter.toLowerCase().split(" ")
      : [];
    const widthFilter = req.query.width;
    const albums = new Map();

    imageDetails.forEach((images, albumPath) => {
      albums.set(
        albumPath,
        images.filter((image) => image.id.endsWith("-prv"))
      );
    });

    let filteredAlbums = Array.from(albums.entries()).filter(
      ([albumPath, images]) =>
        filterImages(images, filterKeywords, widthFilter).length > 0
    );

    if (filteredAlbums.length === 0) {
      return res.status(404).json({ error: "No album found" });
    }

    const randomAlbumImages =
      filteredAlbums[Math.floor(Math.random() * filteredAlbums.length)][1];
    const filteredImages = filterImages(
      randomAlbumImages,
      filterKeywords,
      widthFilter
    );

    res.json({
      images: filteredImages.map((image) => image.id),
      description: randomAlbumImages[0].description,
    });
  } catch (err) {
    console.error("Error during API call:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/image", async (req, res) => {
  const imageId = req.query.id;
  let found = false;
  for (const images of imageDetails.values()) {
    for (const detail of images) {
      if (detail.id === imageId) {
        return res.sendFile(path.resolve(detail.path));
      }
    }
  }
  if (!found) {
    res.status(404).send("Image not found");
  }
});

app.get("/api/search/:keyword", async (req, res) => {
  const keyword = req.params.keyword;
  console.log("Received API call for keyword:", keyword);
  try {
    const previewImage = await ensurePreviewImage(keyword);
    res.json({ message: "Preview image ready", path: previewImage });
  } catch (error) {
    console.error("Error in creating preview image:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static("public"));

app.use((err, req, res, next) => {
  const errorLogStream = fs.createWriteStream(
    path.join(__dirname, "logs/exp-error.log"),
    { flags: "a" }
  );
  errorLogStream.write(
    `[${new Date().toISOString()}] Error: ${err.message}\nStack: ${err.stack}\n`
  );
  res.status(500).send("Internal Server Error");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  initializeAlbumData();
});
