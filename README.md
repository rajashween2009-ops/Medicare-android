# MediCare — Android project

A senior-friendly medicine organiser packaged with Capacitor. Medicine data stays on the device. This version includes native daily phone-notification scheduling for Android and iOS builds.

## Build an Android APK

Requirements: Node.js 22+, Android Studio with Android SDK, and Java 21.

1. Extract this folder.
2. In a terminal opened in this folder, run:
   ```bash
   npm install
   npm run build
   npx cap add android
   node scripts/patch-android-manifest.mjs
   npx cap sync android
   npx cap open android
   ```
3. In Android Studio, wait for Gradle sync, then choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. Android Studio will show the generated `app-debug.apk`.

## Build using the included GitHub workflow

1. Upload the contents of this folder to a GitHub repository.
2. Open **Actions** and run **Build MediCare Android APK** (or push to `main`).
3. Download the `MediCare-Android-APK` artifact from the completed workflow run.

## Native medicine notifications

- A repeating daily phone notification is scheduled for each saved medicine time.
- Adding or removing a medicine updates the scheduled reminders.
- Android 13+ requires notification permission. Android 12+ may ask the user to allow exact alarms; if declined, delivery may be less precise. Keep notifications enabled and review battery/background restrictions on the phone.
- Notification text uses the medicine name and dose entered by the user. The app does not choose or recommend a dose. Enter only details confirmed from the prescription and care team.
- Notifications have not been tested on a physical device in this environment. Test each reminder on the target phone before relying on it. Keep prescription and caregiver/clinician instructions as the source of truth.

## Data and privacy

- Medicine, contact and medical-ID data are stored locally in app browser storage. There is no cloud backup or caregiver sync.
- No sample medication, contact, or medical-ID records are prefilled.
- Tailwind CSS and Google Fonts still load from CDNs, so some styling requires internet access.
- This is a debug-build project, not a signed Play Store release. A signed Android App Bundle, privacy policy, store listing, final icon, and privacy/security review are still required before publication.

## iOS

The project can add an iOS target with `npx cap add ios` and `npx cap sync ios`, but building/signing requires macOS and Xcode. Test native notifications on a real iPhone before relying on them.

## Safety note

MediCare is a reminder and record-keeping tool, not medical advice. It cannot verify prescriptions or guarantee notification delivery. Do not rely on it as the only reminder for critical medication.
