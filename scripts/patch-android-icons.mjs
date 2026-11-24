import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const androidDir = process.argv[2] || 'android';
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');
if (!fs.existsSync(resDir)) throw new Error(`Android res dir not found: ${resDir}`);

// 1. Remove Capacitor's drawable-v24 foreground overrides that hide custom icons on Android 7+
const v24Dir = path.join(resDir, 'drawable-v24');
if (fs.existsSync(v24Dir)) {
  for (const f of fs.readdirSync(v24Dir)) {
    if (f.includes('ic_launcher_foreground')) {
      fs.unlinkSync(path.join(v24Dir, f));
    }
  }
}

const drawableDir = path.join(resDir, 'drawable');
const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(anydpiDir, { recursive: true });

// 2. Adaptive icon background & foreground vectors
fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#0F766E" android:pathData="M0,0h108v108h-108z" />
</vector>
`);

fs.writeFileSync(path.join(drawableDir, 'ic_launcher_foreground.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#26FFFFFF"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="3.5"
        android:strokeLineJoin="round"
        android:pathData="M54,23 L78,32 V51 C78,66.6 67.6,79.4 54,84 C40.4,79.4 30,66.6 30,51 V32 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M50,39 h8 v28 h-8 z M40,49 h28 v8 h-28 z" />
</vector>
`);

fs.writeFileSync(path.join(drawableDir, 'ic_stat_medicare.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2 L20,5 V11.5 C20,16.8 16.6,21.2 12,22.5 C7.4,21.2 4,16.8 4,11.5 V5 Z M10.5,7.5 v3.5 h-3.5 v3 h3.5 v3.5 h3 v-3.5 h3.5 v-3 h-3.5 v-3.5 z" />
</vector>
`);

const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), launcherXml);
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), launcherXml);

// 3. Also overwrite legacy mipmap PNGs across all densities
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function makeIconPng(size, round = false, transparentBg = false) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = size / 2, cy = size / 2, r = size * 0.46;
  const armW = size * 0.14, armL = size * 0.50;
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      let inside = true;
      if (round) inside = (dx * dx + dy * dy) <= r * r;
      else {
        const corner = size * 0.20, ax = Math.abs(dx), ay = Math.abs(dy), half = size * 0.46;
        if (ax > half || ay > half) inside = false;
        else if (ax > half - corner && ay > half - corner) {
          const cdx = ax - (half - corner), cdy = ay - (half - corner);
          inside = (cdx * cdx + cdy * cdy) <= corner * corner;
        }
      }
      const inCross = (Math.abs(dx) <= armW / 2 && Math.abs(dy) <= armL / 2) ||
                      (Math.abs(dy) <= armW / 2 && Math.abs(dx) <= armL / 2);
      if (inCross) {
        raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255; raw[px + 3] = 255;
      } else if (!inside || transparentBg) {
        raw[px] = 0; raw[px + 1] = 0; raw[px + 2] = 0; raw[px + 3] = 0;
      } else {
        raw[px] = 15; raw[px + 1] = 118; raw[px + 2] = 110; raw[px + 3] = 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, sz] of Object.entries(densities)) {
  const dir = path.join(resDir, `mipmap-${d}`);
  if (!fs.existsSync(dir)) continue;
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), makeIconPng(sz, false, false));
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), makeIconPng(sz, true, false));
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), makeIconPng(Math.round(sz * 1.5), false, true));
}
console.log('Replaced all Android launcher & notification icons with MediCare logo.')
