# MediCare Security & Privacy Overview

## 1. Local-Only Data Storage (Zero Cloud / Zero Tracking)
- All medicine schedules, dosage logs, emergency contacts, and Medical ID details are stored exclusively on your device (`localStorage`).
- MediCare has no backend server, no user accounts, no third-party analytics, and no advertising SDKs.
- All UI styles and scripts are bundled inside the APK so the app runs 100% offline.

## 2. Android Manifest Hardening
- `android:allowBackup="false"` — prevents unencrypted ADB backups from extracting personal medication data.
- `android:usesCleartextTraffic="false"` — blocks unencrypted `http://` network traffic.

## 3. Permissions Used & Why
- `POST_NOTIFICATIONS` — displays medicine reminder alerts on Android 13+.
- `SCHEDULE_EXACT_ALARM` — fires reminders at the exact prescribed minute, even in battery-saving Doze mode.
- `RECEIVE_BOOT_COMPLETED` — restores scheduled reminders automatically after a phone restart.
- `WAKE_LOCK` & `VIBRATE` — wakes the notification alert and vibrates when a dose is due.

## 4. About Sideloading (`app-debug.apk`)
- Debug APKs built by GitHub Actions are signed with an automatically generated debug key rather than a Google Play Store release key, which is why Android/Play Protect may display an "Unknown app" prompt during manual installation.
