# TraWe for Android (Capacitor wrapper)

A thin native Android shell around `https://app.trawe.in`. The app always loads the
live site, so shipping a CRM update never requires a new APK.

Package id: `in.trawe.app` · App name: **TraWe**

## Build the APK (easiest — GitHub Actions, no local setup)

1. Push this repo to GitHub.
2. Open **Actions → Build Android APK → Run workflow**.
3. When it finishes, download the **TraWe-debug-apk** artifact — that's your `app-debug.apk`.

## Build the APK locally

Requires JDK 21 and the Android SDK (install Android Studio, it bundles both).

```bash
cd mobile
npm install
npx cap sync android
cd android && ./gradlew assembleDebug
```

Output: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

Or open the project in Android Studio: `npx cap open android`.

## Install on a phone

1. Copy the `.apk` to the phone (USB, Drive, WhatsApp to yourself).
2. Tap it → Android asks to allow installs from this source → allow → Install.
3. TraWe appears in the app drawer with its own icon and splash screen.

## Play Store release build

1. Create a signing key once:
   `keytool -genkey -v -keystore trawe.keystore -alias trawe -keyalg RSA -keysize 2048 -validity 10000`
2. Add the credentials to `android/keystore.properties` (never commit it).
3. `cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`
4. Upload the `.aab` to Google Play Console ($25 one-time developer fee).

## What the shell adds over the browser

- Own launcher icon, name and navy splash screen
- Full-screen app window, no browser chrome
- Hardware back button navigates CRM history
- Cookies/localStorage persist, so the login session survives restarts
- Navigation locked to trawe.in and the auth/payment domains it needs

## Changing the URL

Edit `server.url` in `mobile/capacitor.config.json`, then `npx cap sync android` and rebuild.
