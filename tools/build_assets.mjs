/* Build: embed IMG map (if marker present) + fonts/images into SW core. Version via arg. */
import fs from 'fs';

const HTML = 'C:\\EnglishKids\\index.html';
const SW = 'C:\\EnglishKids\\sw.js';
const idx = JSON.parse(fs.readFileSync('C:\\EnglishKids\\img\\index.json', 'utf8'));
const keys = Object.keys(idx).sort();
console.log('image count:', keys.length);

let html = fs.readFileSync(HTML, 'utf8');
const mapJs = '{' + keys.map((k) => JSON.stringify(k) + ':' + JSON.stringify(idx[k])).join(',') + '}';
if (html.includes('{/*IMG_MAP*/}')) {
  html = html.replace('{/*IMG_MAP*/}', mapJs);
  console.log('IMG map embedded (marker)');
} else {
  const re = /const IMG = \{[\s\S]*?\};/;
  if (!re.test(html)) throw new Error('IMG object not found to replace');
  html = html.replace(re, 'const IMG = ' + mapJs + ';');
  console.log('IMG map replaced (existing object)');
}
if (process.argv[2]) {
  const ver = 'الإصدار v' + process.argv[2];
  html = html.replace(/الإصدار v\d+\.\d+/, ver);
  console.log('version set to:', ver);
}
fs.writeFileSync(HTML, html, 'utf8');

// SW core: canonical base + fonts + images (avoids accumulated duplicates)
let sw = fs.readFileSync(SW, 'utf8');
const BASE = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './vosk/vosk.js',
  './audio/teacher/hello.wav', './audio/teacher/intro_letters.wav', './audio/teacher/intro_words.wav',
  './audio/teacher/intro_phrases.wav', './audio/teacher/intro_sentences.wav', './audio/teacher/intro_review.wav',
  './audio/teacher/your_turn.wav', './audio/teacher/listen_again.wav', './audio/teacher/praise3.wav',
  './audio/teacher/praise3b.wav', './audio/teacher/praise2.wav', './audio/teacher/praise1.wav',
  './audio/teacher/praise0.wav', './audio/teacher/cheer.wav'
];
const fonts = [
  './assets/fonts/cairo-arabic-400-normal.woff2', './assets/fonts/cairo-arabic-700-normal.woff2',
  './assets/fonts/cairo-arabic-800-normal.woff2', './assets/fonts/cairo-latin-400-normal.woff2',
  './assets/fonts/cairo-latin-700-normal.woff2', './assets/fonts/cairo-latin-800-normal.woff2'
];
const images = keys.map((k) => './' + idx[k]);
const core = JSON.stringify([...BASE, ...fonts, ...images], null, 2);
sw = sw.replace(/const CORE = [\s\S]*?\];/, 'const CORE = ' + core + ';');
fs.writeFileSync(SW, sw, 'utf8');
console.log('SW core total entries:', BASE.length + fonts.length + images.length);