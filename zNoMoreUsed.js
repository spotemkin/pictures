// script and server left

// Function to load images for the current album
const loadAlbumImages = async () => {
  const imagePromises = currentImages.map((imageId) =>
    loadImage(`/image?id=${encodeURIComponent(imageId)}`)
  );
  await Promise.all(imagePromises);
};

// Function to load an image and adjust its aspect ratio
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      adjustImageAspectRatio(img);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });

async function ensurePreviewImage(albumKeywords) {
  // Reducing the entire request to lowercase to unify processing
  const keywords = albumKeywords
    .toLowerCase()
    .split("-")
    .map((kw) => kw.trim());
  const previewDirectory = "public/preview";
  const previewFilename = `imola-${keywords.join("-")}.jpg`;
  const fullPath = path.join(previewDirectory, previewFilename);

  try {
    await accessAsync(fullPath, fs.constants.F_OK);
    console.log("Preview image already exists:", fullPath);
    return fullPath;
  } catch {
    // Search for the corresponding album using all the keywords
    const albumPaths = Array.from(imageDetails.keys());
    const matchingAlbumPath = albumPaths.find((albumPath) =>
      keywords.every((keyword) => albumPath.toLowerCase().includes(keyword))
    );

    if (!matchingAlbumPath) {
      throw new Error(
        "No matching album found for the keywords: " + albumKeywords
      );
    }

    const images = imageDetails.get(matchingAlbumPath);
    const largeImage = images.find((img) => !img.path.includes("-prv"));

    if (!largeImage) {
      throw new Error("No image found in the selected album.");
    }

    // Copying the selected image to the preview directory
    const imageBuffer = await fs.promises.readFile(largeImage.path);
    await writeFileAsync(fullPath, imageBuffer);
    console.log("Created new preview image:", fullPath);
    return fullPath;
  }
}

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
