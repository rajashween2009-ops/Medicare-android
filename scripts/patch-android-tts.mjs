import fs from 'node:fs';
import path from 'node:path';

const androidDir = process.argv[2] || 'android';
const mainActivityPath = path.join(
  androidDir, 'app', 'src', 'main', 'java', 'com', 'medicare', 'elderlycompanion', 'MainActivity.java'
);
if (!fs.existsSync(mainActivityPath)) throw new Error(`MainActivity.java not found: ${mainActivityPath}`);

const javaSource = `package com.medicare.elderlycompanion;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int res = tts.setLanguage(Locale.getDefault());
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(Locale.US);
                }
                tts.setSpeechRate(0.90f);
                ttsReady = true;
            }
        });

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void speak(String text) {
                    if (tts != null && ttsReady && text != null && !text.isEmpty()) {
                        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "medicare_utterance");
                    }
                }

                @JavascriptInterface
                public void stop() {
                    if (tts != null) {
                        tts.stop();
                    }
                }
            }, "MediCareAndroidTTS");
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
`;

fs.writeFileSync(mainActivityPath, javaSource, 'utf8');
console.log('Patched MainActivity.java with native Android TextToSpeech bridge.');
