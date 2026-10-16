# TraWe Desktop (Windows)

A thin Electron shell around https://app.trawe.in — real window, taskbar/start-menu icon,
system tray, and optional launch on Windows startup.

## Option A — Install in 10 seconds (no build needed)

1. Open **Microsoft Edge** (or Chrome) on Windows and go to `https://app.trawe.in`.
2. Click the **Install** icon in the address bar (or `⋯ → Apps → Install this site as an app`).
3. Tick "Pin to taskbar" / "Start menu" / "Auto-start on device sign-in".

You get a standalone window with the TraWe icon. This is the recommended route for most users.

## Option B — Build the real `TraWe.exe`

Run these on a **Windows** machine with Node.js 20+ installed:

```bash
cd desktop
npm install
npm run package:win
```

Output: `desktop/release/TraWe-win32-x64/TraWe.exe`.
Copy that whole folder anywhere (e.g. `C:\Program Files\TraWe`), then right-click
`TraWe.exe` → *Send to* → *Desktop (create shortcut)* / *Pin to Start*.

You can also build it from macOS/Linux — `@electron/packager` cross-compiles:
the same `npm run package:win` command works and produces the win32 folder.

## Test before packaging

```bash
cd desktop
npm install
npm start
```

## What the shell does

- Loads `https://app.trawe.in` (always the latest deployed version — no updates to ship)
- Single instance: clicking the shortcut focuses the existing window
- Closing the window minimises to the system tray; quit from the tray menu
- Tray toggle for **Launch on Windows startup**
- External links (mailto:, wa.me, Razorpay, etc.) open in the default browser

## Option C — One-click installer (`TraWeSetup.exe`)

`installer.nsi` builds a real Windows setup wizard (NSIS). It installs to
`%LOCALAPPDATA%\TraWe`, creates Desktop + Start-menu shortcuts, registers an
entry in *Apps & features*, and ships an uninstaller — no admin rights needed.

```bash
cd desktop
npm install
npm run installer:win   # requires makensis (NSIS) on PATH
```

Output: `desktop/release/TraWeSetup.exe`.

Note: the installer is unsigned, so Windows SmartScreen shows
"More info → Run anyway" the first time. Code signing needs a paid certificate.