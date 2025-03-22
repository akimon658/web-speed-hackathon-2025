import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function convertJpgToAvif(directory) {
  try {
    const files = await fs.promises.readdir(directory);

    for (const file of files) {
      if (file.toLowerCase().endsWith('.jpeg')) {
        const filePath = path.join(directory, file);
        const outputFilePath = path.join(directory, `${path.parse(file).name}.avif`);

        await sharp(filePath)
          .resize({ width: 400, withoutEnlargement: true, fit: 'inside' })
          .avif({
            quality: 30,
          })
          .toFile(outputFilePath);

        console.log(`Converted ${file} to ${path.parse(file).name}.avif`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

convertJpgToAvif(path.resolve(import.meta.dirname, '../../public/images/'));
