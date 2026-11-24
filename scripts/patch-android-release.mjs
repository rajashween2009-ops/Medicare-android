import fs from 'node:fs';
import path from 'node:path';

const appBuildGradlePath = path.resolve(process.cwd(), 'android', 'app', 'build.gradle');

if (!fs.existsSync(appBuildGradlePath)) {
  console.warn(`android/app/build.gradle not found at ${appBuildGradlePath}; skipping release patch.`);
  process.exit(0);
}

let gradle = fs.readFileSync(appBuildGradlePath, 'utf8');
let changed = false;

const signingConfigBlock = `    signingConfigs {
        release {
            def keystorePath = System.getenv("ANDROID_KEYSTORE_PATH") ?: project.findProperty("RELEASE_STORE_FILE")
            if (keystorePath) {
                storeFile file(keystorePath)
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: project.findProperty("RELEASE_STORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: project.findProperty("RELEASE_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD") ?: project.findProperty("RELEASE_KEY_PASSWORD")
            }
        }
    }`;

if (!gradle.includes('signingConfigs')) {
  if (/buildTypes\s*\{/.test(gradle)) {
    gradle = gradle.replace(/(\s*buildTypes\s*\{)/, `\n${signingConfigBlock}$1`);
    changed = true;
  } else {
    console.warn('Could not find buildTypes block in android/app/build.gradle to insert signingConfigs.');
  }
}

const releaseBlockReplacement = `        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            if (signingConfigs.release.storeFile != null) {
                signingConfig signingConfigs.release
            }
        }`;

if (/release\s*\{[\s\S]*?\}/.test(gradle)) {
  const updated = gradle.replace(/\s*release\s*\{[\s\S]*?\}/, `\n${releaseBlockReplacement}`);
  if (updated !== gradle) {
    gradle = updated;
    changed = true;
  }
} else if (/buildTypes\s*\{/.test(gradle)) {
  gradle = gradle.replace(/(buildTypes\s*\{)/, `$1\n${releaseBlockReplacement}`);
  changed = true;
}

if (changed) {
  fs.writeFileSync(appBuildGradlePath, gradle, 'utf8');
  console.log('Patched android/app/build.gradle with R8 minification and release signing configuration.');
} else {
  console.log('android/app/build.gradle already configured for R8 minification and release signing.');
}
