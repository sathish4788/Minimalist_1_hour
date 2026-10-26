import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const svgPath = path.resolve('public', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public', 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public', 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 512x512 Maskable PNG (with 15% safe padding)
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#0F172A',
    })
    .png()
    .toFile(path.resolve('public', 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 192x192 Maskable PNG (with 15% safe padding: ~154x154 inner padded to 192x192)
  await sharp(svgBuffer)
    .resize(154, 154)
    .extend({
      top: 19,
      bottom: 19,
      left: 19,
      right: 19,
      background: '#0F172A',
    })
    .png()
    .toFile(path.resolve('public', 'pwa-maskable-192x192.png'));
  console.log('Generated pwa-maskable-192x192.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public', 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 32x32 Favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('public', 'favicon.ico'));
  console.log('Generated favicon.ico');
}

generateIcons().catch(console.error);
