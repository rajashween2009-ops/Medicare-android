import fs from 'node:fs';
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(manifestPath)) throw new Error(`Android manifest not found: ${manifestPath}`);
let xml = fs.readFileSync(manifestPath, 'utf8');
const perms = ['RECEIVE_BOOT_COMPLETED', 'SCHEDULE_EXACT_ALARM', 'POST_NOTIFICATIONS', 'WAKE_LOCK', 'VIBRATE'];
const close = xml.indexOf('>');
if (close < 0) throw new Error('Invalid Android manifest');
for (const p of perms) {
  const full = 'android.permission.' + p;
  if (!xml.includes(full)) {
    xml = xml.slice(0, close + 1) + '\n    <uses-permission android:name="' + full + '" />' + xml.slice(close + 1);
  }
}
fs.writeFileSync(manifestPath, xml);
