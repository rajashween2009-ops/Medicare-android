import fs from 'node:fs';
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(manifestPath)) throw new Error(`Android manifest not found: ${manifestPath}`);
let xml = fs.readFileSync(manifestPath, 'utf8');
const permission = '<uses-permission android:name=\"android.permission.SCHEDULE_EXACT_ALARM\" />';
if (!xml.includes('android.permission.SCHEDULE_EXACT_ALARM')) {
  const close = xml.indexOf('>');
  if (close < 0) throw new Error('Invalid Android manifest');
  xml = xml.slice(0, close + 1) + '\n    ' + permission + xml.slice(close + 1);
  fs.writeFileSync(manifestPath, xml);
}
