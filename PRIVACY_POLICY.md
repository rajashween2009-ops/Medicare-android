# Privacy Policy — MediCare

**Effective Date:** November 24, 2026

MediCare is a senior-friendly, 100% offline medicine organiser and reminder application. Your privacy is fundamental to our design: **all of your data stays strictly on your device.**

## 1. Local-Only Data Storage
MediCare operates entirely locally on your device. Any information you enter into the app—including:
- Medicine names, schedules, and dosage logs
- Emergency contacts and Medical ID details
- App preferences and reminder settings

is stored exclusively in your device's local storage. MediCare does **not** upload, transmit, back up, or store any personal or health information on external servers.

## 2. No Data Collection, Tracking, or Accounts
- **No user accounts:** MediCare does not require registration, login, email addresses, or phone numbers.
- **No analytics or telemetry:** We do not collect usage statistics, crash reports, device identifiers, or behavioral data.
- **No advertising or third-party SDKs:** MediCare contains no ads, trackers, or third-party data-sharing libraries.

## 3. Device Permissions
MediCare requests only the Android permissions required to deliver reliable offline medicine reminders:
- **Notifications (`POST_NOTIFICATIONS`):** To display local medicine reminder alerts.
- **Exact Alarms (`SCHEDULE_EXACT_ALARM`):** To trigger reminders at the exact scheduled times.
- **Boot & Wake (`RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE`):** To reschedule local reminders after a device restart and alert you reliably.
- **On-Device Text-to-Speech (TTS):** Used locally on your device to read reminders aloud; no audio or text is sent over the network.

## 4. Your Control Over Your Data
Because all data resides solely on your device, you have complete control over it:
- You can edit or delete individual entries directly within the app at any time.
- You can permanently remove all app data by clearing the app's storage in your Android device settings or by uninstalling MediCare.

## 5. Children's Privacy
MediCare does not knowingly collect any personal information from anyone, including children under the age of 13, as no data is ever transmitted off the user's device.

## 6. Changes to This Privacy Policy
If this privacy policy is updated in future releases, the updated version will be published in this repository with a revised effective date.

## 7. Contact
If you have questions about this privacy policy, please open an issue in the `rajashween2009-ops/Medicare-android` repository on GitHub.
