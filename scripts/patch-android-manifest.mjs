import fs from 'node:fs';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (!fs.existsSync(manifestPath)) throw new Error(`Android manifest not found: ${manifestPath}`);

let xml = fs.readFileSync(manifestPath, 'utf8');
const perms = [
  'RECEIVE_BOOT_COMPLETED',
  'SCHEDULE_EXACT_ALARM',
  'POST_NOTIFICATIONS',
  'WAKE_LOCK',
  'VIBRATE'
];

const appIdx = xml.indexOf('<application');
if (appIdx < 0) throw new Error('Invalid AndroidManifest.xml: <application not found');

const missing = perms
  .map((p) => `android.permission.${p}`)
  .filter((full) => !xml.includes(full))
  .map((full) => `    <uses-permission android:name="${full}" />`);

if (missing.length > 0) {
  xml = xml.slice(0, appIdx) + missing.join('\n') + '\n\n    ' + xml.slice(appIdx);
}

// Harden <application> attributes: disable unencrypted cleartext traffic and ADB backups
if (xml.includes('android:allowBackup="true"')) {
  xml = xml.replace('android:allowBackup="true"', 'android:allowBackup="false"');
} else if (!xml.includes('android:allowBackup=')) {
  xml = xml.replace('<application', '<application\n        android:allowBackup="false"');
}

if (xml.includes('android:usesCleartextTraffic="true"')) {
  xml = xml.replace('android:usesCleartextTraffic="true"', 'android:usesCleartextTraffic="false"');
} else if (!xml.includes('android:usesCleartextTraffic=')) {
  xml = xml.replace('<application', '<application\n        android:usesCleartextTraffic="false"');
}

fs.writeFileSync(manifestPath, xml, 'utf8');
console.log('Patched AndroidManifest.xml with permissions and security hardening.');
