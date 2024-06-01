const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// Конфигурация
const ALBUM_LIST_PATH = "album-list-ubnt.txt";
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://imola.io";
const CONCURRENT_REQUESTS = 64; // Количество параллельных запросов
const MIN_VIEW_TIME = 20000; // Минимальное время просмотра в миллисекундах
const MAX_VIEW_TIME = 200000; // Максимальное время просмотра в миллисекундах

// Чтение файла с альбомами и извлечение строк с ключевыми словами
function readAlbumKeywords(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data
    .split("\n")
    .map((line) => {
      const parts = line.split(";");
      if (parts.length >= 5) {
        return parts[4]
          .trim()
          .split(" ")
          .filter((word) => word);
      }
      return [];
    })
    .filter((keywords) => keywords.length > 0);
}

// Генерация случайной комбинации ключевых слов из одной строки
function getRandomKeywordCombination(keywords) {
  const combination = [];
  const numKeywords = Math.floor(Math.random() * keywords.length) + 1;
  const shuffledKeywords = keywords.sort(() => 0.5 - Math.random());
  for (let i = 0; i < numKeywords; i++) {
    combination.push(shuffledKeywords[i]);
  }
  return combination.join("-");
}

// Функция для запуска одного потока запросов
async function startRequestStream(id, browser, keywordSets) {
  const page = await browser.newPage();

  // Обработчик для логирования загрузки изображений
  page.on("response", async (response) => {
    const url = response.url();
    const status = response.status();
    const request = response.request();
    const resourceType = request.resourceType();

    if (resourceType === "image") {
      console.log(
        `Thread ${id}: Image Loaded - URL: ${url}, Status: ${status}`
      );
    }
  });

  while (true) {
    try {
      const keywords =
        keywordSets[Math.floor(Math.random() * keywordSets.length)];
      const keywordCombination = getRandomKeywordCombination(keywords);
      const url = `${BASE_URL}/${keywordCombination}`;
      await page.goto(url);

      // Получаем список всех изображений на странице
      const imageUrls = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.map((img) => img.src);
      });

      // Загружаем все изображения на странице
      for (const imageUrl of imageUrls) {
        const imageResponse = await page.goto(imageUrl);
        console.log(
          `Thread ${id}: Image Loaded - URL: ${imageUrl}, Status: ${imageResponse.status()}`
        );
      }

      console.log(`Thread ${id}: URL: ${url}, Status: Page loaded`);
    } catch (error) {
      console.error(`Thread ${id}: Error fetching URL: ${error.message}`);
    }

    const viewTime =
      Math.floor(Math.random() * (MAX_VIEW_TIME - MIN_VIEW_TIME + 1)) +
      MIN_VIEW_TIME;
    await new Promise((resolve) => setTimeout(resolve, viewTime));
  }
}

// Основная функция для запуска нагрузочного тестирования
async function runLoadTest() {
  const keywordSets = readAlbumKeywords(ALBUM_LIST_PATH);
  const browser = await puppeteer.launch({ headless: true });
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(startRequestStream(i + 1, browser, keywordSets));
  }
  await Promise.all(promises);
  await browser.close();
}

runLoadTest().catch((error) => {
  console.error("Load test failed:", error);
});
