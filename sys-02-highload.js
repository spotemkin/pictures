const puppeteer = require("puppeteer");

const runTest = async (threadId) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://imola.io");
    console.log(`Thread ${threadId} - Loaded page`);

    await page.waitForSelector("#image-viewer");
    console.log(`Thread ${threadId} - Found #image-viewer`);

    while (true) {
      // Логирование малых и больших изображений в слайдшоу
      for (let i = 0; i < 10; i++) {
        // Цикл для просмотра первых 10 изображений
        const imageUrl = await page.$eval("#image-viewer", (img) => img.src);
        console.log(`Thread ${threadId} - Large Image: ${imageUrl}`);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Ждём 5 секунд для следующего изображения
      }

      // Переход к следующему альбому
      await page.click("#next-album");
      console.log(`Thread ${threadId} - Clicked next album`);

      // Ждём появления новых изображений
      await page.waitForSelector("#image-viewer");
      console.log(`Thread ${threadId} - Loaded new album`);
    }
  } catch (error) {
    console.error(`Thread ${threadId} - Error:`, error);
  } finally {
    await browser.close();
    console.log(`Thread ${threadId} - Browser closed`);
  }
};

const runLoadTest = async (threadCount) => {
  const threads = [];

  for (let i = 0; i < threadCount; i++) {
    threads.push(runTest(i));
  }

  await Promise.all(threads);
  console.log("Load test completed");
};

// Запуск 32 потоков
runLoadTest(32);
