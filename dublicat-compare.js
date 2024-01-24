const fs = require('fs');
const path = require('path');

const inputFile = 'txt/hash-list-autopics.txt'; // Путь к исходному файлу
const outputFile = 'txt/hash-list-bingo.txt'; // Путь к выходному файлу

// Чтение и обработка файла
fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const lines = data.split('\n');
  const hashDict = {};

  // Создаем словарь хешей
  lines.forEach(line => {
    const [hash, filePath] = line.split(';');
    if (hash && filePath) {
      if (!hashDict[hash]) {
        hashDict[hash] = [];
      }
      hashDict[hash].push(filePath);
    }
  });

  // Фильтруем хеши, которые встречаются более одного раза
  const duplicates = Object.entries(hashDict).filter(([_, paths]) => paths.length > 1);

  // Запись результатов в файл
  const outputData = duplicates.map(([hash, paths]) => `${hash};${paths.join(';')}`).join('\n');
  fs.writeFile(outputFile, outputData, err => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('Duplicates written to file:', outputFile);
    }
  });
});
