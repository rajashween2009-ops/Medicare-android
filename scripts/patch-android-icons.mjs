import fs from 'node:fs';
import path from 'node:path';

const androidDir = process.argv[2] || 'android';
const resDir = path.join(androidDir, 'app', 'src', 'main', 'res');
if (!fs.existsSync(resDir)) throw new Error(`Android res dir not found: ${resDir}`);

const drawableDir = path.join(resDir, 'drawable');
const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(anydpiDir, { recursive: true });

// Adaptive icon background (Deep Teal #0F766E)
fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="#0F766E" android:pathData="M0,0h108v108h-108z" />
</vector>
`);

// Adaptive icon foreground (MediCare shield + crisp white medical cross)
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

// Monochrome status-bar notification icon (ic_stat_medicare)
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

// Adaptive launcher icon XMLs
const launcherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), launcherXml);
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), launcherXml);
console.log('Installed MediCare launcher & notification icons.');
