// make TAGS (from name), path, size info for all JPG in d:\auto-create and save in txt

import fs from "fs";
import path from "path";
import sharp from "sharp";
import PQueue from "p-queue";

const directoryPath = "d:\\auto-create";
const queue = new PQueue({ concurrency: 64 });
const outputStream = fs.createWriteStream("album-list-wind.txt", {
  flags: "a",
});

const formatName = (name) => name.replace(/[_-]/g, " ");

const processFile = async (filePath, directoryName) => {
  try {
    const fileStats = await fs.promises.stat(filePath);
    const imageSize = await sharp(filePath).metadata();
    const directoryNameFormatted = formatName(directoryName);
    const fileDetails = `${filePath};${imageSize.width};${imageSize.height};${fileStats.size};${directoryNameFormatted};\n`;
    outputStream.write(fileDetails);
  } catch (error) {
    const errorMessage = `${filePath};Error processing file: ${error.message}\n`;
    outputStream.write(errorMessage);
    console.error(errorMessage);
  }
};

const processDirectory = async (dirPath, parentDirectoryName) => {
  const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      const directoryPath = path.join(dirPath, item.name);
      await processDirectory(directoryPath, item.name);
    } else {
      const filePath = path.join(dirPath, item.name);
      queue.add(() => processFile(filePath, parentDirectoryName));
    }
  }
};

const listFilesWithDetails = async () => {
  try {
    await processDirectory(directoryPath, "");
    await queue.onIdle();
    outputStream.end();
    console.log("File details have been created.");
  } catch (err) {
    console.error("Error:", err.message);
  }
};

listFilesWithDetails();
