import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('static/icons/icon-source.svg');

await sharp(svg).resize(192, 192).png().toFile('static/icons/icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('static/icons/icon-512.png');

console.log('Icons generated.');
