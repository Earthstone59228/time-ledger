# Time Ledger

A personal, offline-first daybook: categorize every hour of your day, jot daily notes, track a work/study checklist, and see your sleep history — installable as a real app on your phone or desktop home screen.

## What it's built with

Plain HTML/CSS/JS (ES modules), no build step, no framework, no backend. That's deliberate — it's a single-user app that should be easy for you to keep maintaining yourself.

- `index.html` — app shell
- `css/style.css`, `css/fonts.css` — the ledger/daybook visual style, self-hosted fonts
- `js/app.js` — all UI logic and rendering
- `js/store.js` — the storage layer (currently `localStorage`, wrapped in an async API so a sync backend could replace it later without touching `app.js`)
- `js/dates.js`, `js/categories.js` — small shared helpers
- `manifest.json`, `sw.js` — what makes it installable and offline-capable
- `icons/` — app icons (192, 512, maskable variants, iOS touch icon)
- `fonts/` — self-hosted Source Serif 4 / Inter / IBM Plex Mono, so the app never depends on reaching a font CDN

Data model, exactly as specified:
- One record per calendar day: `{ date, hours: [24 entries of null|'sleep'|'work'|'study'|'personal'], notes }`
- One ongoing task list: `{ id, text, category, done, note }[]` — not tied to any day
- Everything lives in `localStorage` on the device, under keys prefixed `timeledger:`. Nothing leaves the device.

## Nice-to-haves included

- **Drag-to-paint**: on a mouse, click and drag across hours to stamp a range at once (fills in every hour between drag points, so it holds up even on a fast swipe). On touch, tap each hour — this keeps normal page scrolling on your phone unbroken, which mattered more than drag-painting on a touchscreen.
- **This week's balance**: a mini stacked bar per day for the last 7 days, below the sleep history strip.
- **Per-task notes**: click "+note" on any checklist item to attach a short note to it.

## Running it locally to try it out

Any static file server works, e.g. from this folder:

```
npx serve .
```

then open the URL it prints. (Opening `index.html` directly via `file://` won't work — ES modules and the service worker both require a real `http://` origin.)

## Installing it for real — on your phone

A PWA needs to be served over **HTTPS** for the "install" / "add to home screen" flow and offline service worker to work (plain `http://` on your phone's browser won't offer installability). The simplest path is a free static host:

**Netlify Drop** (fastest, no account required to try it):
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop) in a desktop browser.
2. Drag the whole `time-ledger` folder onto the page.
3. You'll get an HTTPS URL immediately. Optionally sign up (free) to keep it permanently instead of it expiring.

**GitHub Pages** (if you already use GitHub — free, permanent, ties to version control):
1. Create a new repo and push this folder's contents to it.
2. Repo Settings → Pages → Deploy from branch → pick `main` and `/ (root)`.
3. GitHub gives you a URL like `https://<you>.github.io/<repo>/`.

Once you have that HTTPS URL, open it on your phone:

- **iPhone (Safari)**: open the URL → tap the Share icon → **Add to Home Screen**.
- **Android (Chrome)**: open the URL → tap the ⋮ menu → **Install app** (or you'll see an automatic "Add Time Ledger to Home screen" banner).

It'll then open full-screen, no browser address bar, with the icon you generated, and keep working with no signal.

## Installing it as a desktop app (Windows)

Same HTTPS URL, in Chrome or Edge:
1. Open the URL.
2. Click the install icon in the address bar (or ⋮ menu → **Apps** → **Install this site as an app**).
3. It opens in its own window with a taskbar icon and Start Menu entry, and keeps working offline.

## Making changes later

Because the service worker caches everything for offline use, **editing a file alone won't update what's already installed on a device** — you need to bump the cache name in `sw.js` (`CACHE_NAME = 'time-ledger-v2'` → `'time-ledger-v3'`, etc.) on every deploy that changes any cached file. That's what forces the old cache to drop and the new files to load. Redeploy to whichever host you're using and the installed app will pick it up next time it's opened (it fetches the new `sw.js`, installs it in the background, and takes over on the next full reload).
