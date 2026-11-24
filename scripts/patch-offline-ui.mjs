import fs from 'node:fs';

const htmlPath = 'www/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Replace any external Tailwind CDN or Google Fonts with local offline styles.css + native bridge
html = html.replace(/<script[^>]*cdn\.tailwindcss\.com[^>]*><\/script>/gi, '<link rel="stylesheet" href="./styles.css" />');
html = html.replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/gi, '');
if (!html.includes('./styles.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="./styles.css" />\n</head>');
}
if (!html.includes('native-notifications.bundle.js')) {
  html = html.replace('</head>', '  <script src="./native-notifications.bundle.js"></script>\n</head>');
}

// 2. Upgrade header logo to MediCare Shield + Cross SVG
const oldPlusLogo = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">\n            <path d="M12 5v14M5 12h14"/>\n          </svg>`;
const newShieldLogo = `<svg class="w-6 h-6" viewBox="0 0 40 40" fill="none">\n            <path d="M20 5L32 9.5V19C32 26.8 26.8 33.2 20 35.5C13.2 33.2 8 26.8 8 19V9.5L20 5Z" fill="rgba(255,255,255,0.18)" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>\n            <path d="M20 13V26M13.5 19.5H26.5" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>\n          </svg>`;
if (html.includes(oldPlusLogo)) {
  html = html.replace(oldPlusLogo, newShieldLogo);
}

// 3. Inject Native Android Capacitor LocalNotifications bridge if not already present
if (!html.includes('ANDROID_CHANNEL_ID')) {
  const nativeBridge = `
      const ANDROID_CHANNEL_ID = 'medicare_urgent_alerts';
      const ANDROID_ACTION_TYPE_ID = 'MEDICINE_REMINDER_ACTIONS';
      let nativePermState = 'unknown';

      function getNativePlugins() {
        const bridge = window.MediCareNative || (window.MediCareLocalNotifications ? {
          Capacitor: window.Capacitor,
          LocalNotifications: window.MediCareLocalNotifications
        } : null);
        if (!bridge || !bridge.LocalNotifications) return null;
        try {
          if (bridge.Capacitor && bridge.Capacitor.isNativePlatform && !bridge.Capacitor.isNativePlatform()) return null;
          return bridge;
        } catch (e) { return null; }
      }

      function hashNotificationId(str) {
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
          hash ^= str.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return (Math.abs(hash) % 2000000000) + 1000;
      }

      async function initNativeAndroidNotifications() {
        const native = getNativePlugins();
        if (!native) return;
        const LN = native.LocalNotifications;
        try {
          await LN.createChannel({
            id: ANDROID_CHANNEL_ID,
            name: 'Medicine Reminders',
            description: 'Urgent heads-up reminders with dosage and meal instructions',
            importance: 5,
            visibility: 1,
            sound: 'default',
            vibration: true,
            lights: true,
            lightColor: '#0F766E'
          });
          await LN.registerActionTypes({
            types: [{
              id: ANDROID_ACTION_TYPE_ID,
              actions: [
                { id: 'mark_taken', title: 'Mark Taken' },
                { id: 'snooze_10', title: 'Snooze 10 min' }
              ]
            }]
          });
          let perm = await LN.checkPermissions();
          if (perm.display !== 'granted') perm = await LN.requestPermissions();
          nativePermState = perm.display || 'denied';
          await LN.addListener('localNotificationReceived', function (n) {
            const extra = (n && n.extra) || {};
            if (extra.medId && extra.time && !activeAlarmDose) openAlarmModal(extra.medId, extra.time, Boolean(extra.isTest));
          });
          await LN.addListener('localNotificationActionPerformed', function (ev) {
            const actionId = ev && ev.actionId;
            const extra = (ev && ev.notification && ev.notification.extra) || {};
            if (!extra.medId) return;
            if (actionId === 'mark_taken') {
              if (!extra.isTest) setDoseStatus(extra.medId, extra.time || '08:00', 'taken');
              showToast('Marked as taken from notification.');
            } else if (actionId === 'snooze_10') {
              scheduleNativeOneOffNotification(extra.medId, extra.time || '08:00', 600, Boolean(extra.isTest));
              snoozedQueue.push({ medId: extra.medId, time: extra.time || '08:00', fireAtMs: Date.now() + 600000, isTest: Boolean(extra.isTest) });
              renderSnoozeBar(Date.now());
              showToast('Snoozed for 10 minutes.');
            } else {
              openAlarmModal(extra.medId, extra.time || '08:00', Boolean(extra.isTest));
            }
          });
          await syncNativeAndroidSchedule();
          if (typeof renderNotificationUI === 'function') renderNotificationUI();
        } catch (err) {}
      }

      async function syncNativeAndroidSchedule() {
        const native = getNativePlugins();
        if (!native) return;
        const LN = native.LocalNotifications;
        try {
          const pending = await LN.getPending();
          const toCancel = (pending && pending.notifications ? pending.notifications : [])
            .filter(function (n) { return !(n.extra && n.extra.isOneOff); })
            .map(function (n) { return { id: n.id }; });
          if (toCancel.length > 0) await LN.cancel({ notifications: toCancel });
          const toSchedule = [];
          state.medicines.forEach(function (med) {
            if (!med.active) return;
            const times = Array.isArray(med.times) && med.times.length ? med.times : ['08:00'];
            const days = Array.isArray(med.days) && med.days.length ? med.days : [0, 1, 2, 3, 4, 5, 6];
            const isDaily = days.length === 7;
            times.forEach(function (t) {
              const parts = String(t).split(':');
              const hour = parseInt(parts[0], 10);
              const minute = parseInt(parts[1], 10);
              if (Number.isNaN(hour) || Number.isNaN(minute)) return;
              const title = 'Time for ' + med.name + ' (' + med.dosage + ')';
              const body = 'Take ' + med.dosage + ' · ' + (med.food || 'Anytime') + (med.note ? ' — ' + med.note : '');
              if (isDaily) {
                toSchedule.push({
                  id: hashNotificationId(med.id + '|' + t + '|daily'),
                  title, body, largeBody: body, summaryText: 'MediCare Reminder',
                  channelId: ANDROID_CHANNEL_ID, actionTypeId: ANDROID_ACTION_TYPE_ID,
                  schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
                  extra: { medId: med.id, time: t, isTest: false }
                });
              } else {
                days.forEach(function (dayIdx) {
                  toSchedule.push({
                    id: hashNotificationId(med.id + '|' + t + '|day-' + dayIdx),
                    title, body, largeBody: body, summaryText: 'MediCare Reminder',
                    channelId: ANDROID_CHANNEL_ID, actionTypeId: ANDROID_ACTION_TYPE_ID,
                    schedule: { on: { weekday: dayIdx + 1, hour, minute }, repeats: true, allowWhileIdle: true },
                    extra: { medId: med.id, time: t, isTest: false }
                  });
                });
              }
            });
          });
          if (toSchedule.length > 0) await LN.schedule({ notifications: toSchedule });
        } catch (err) {}
      }

      async function scheduleNativeOneOffNotification(medId, time, delaySeconds, isTest) {
        const native = getNativePlugins();
        if (!native) return;
        const LN = native.LocalNotifications;
        try {
          const med = state.medicines.find(function (m) { return m.id === medId; }) || {
            id: medId, name: 'Amlodipine 5mg (Test)', dosage: '1 Tablet', food: 'After Food', note: ''
          };
          const fireAt = new Date(Date.now() + Math.max(1, delaySeconds) * 1000);
          const title = (isTest ? 'Test Reminder: ' : 'Snoozed: ') + med.name + ' (' + med.dosage + ')';
          const body = 'Take ' + med.dosage + ' · ' + (med.food || 'Anytime') + (med.note ? ' — ' + med.note : '');
          await LN.schedule({
            notifications: [{
              id: hashNotificationId('oneoff|' + med.id + '|' + Date.now()),
              title, body, largeBody: body, summaryText: 'MediCare Reminder',
              channelId: ANDROID_CHANNEL_ID, actionTypeId: ANDROID_ACTION_TYPE_ID,
              schedule: { at: fireAt, allowWhileIdle: true },
              extra: { medId: med.id, time, isTest: Boolean(isTest), isOneOff: true }
            }]
          });
        } catch (err) {}
      }
`;
  html = html.replace("const STORAGE_KEY = 'medicare_calm_v2_state';", "const STORAGE_KEY = 'medicare_calm_v2_state';\n" + nativeBridge);
  html = html.replace("localStorage.setItem(STORAGE_KEY, JSON.stringify(state));", "localStorage.setItem(STORAGE_KEY, JSON.stringify(state));\n          syncNativeAndroidSchedule();");
  html = html.replace("showToast('Test reminder will ring in ' + delaySeconds + ' seconds.');", "scheduleNativeOneOffNotification(targetMed ? targetMed.id : 'test-med', hhmm, delaySeconds, true);\n          showToast('Test reminder will ring in ' + delaySeconds + ' seconds.');");
  html = html.replace("showToast('Reminder snoozed for 10 minutes.');", "scheduleNativeOneOffNotification(cur.medId, cur.time, 600, cur.isTest);\n          showToast('Reminder snoozed for 10 minutes.');");
  html = html.replace("tickClockAndReminders();", "tickClockAndReminders();\n        initNativeAndroidNotifications();");
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Patched www/index.html for offline Android + native notifications.');
