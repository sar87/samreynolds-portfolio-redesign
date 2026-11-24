# Setting up the typewriter on the website

This folder was copied in from a separate project. `README.md` in this folder describes how the typewriter itself works.

**Status: wired into the site.** The pages now live in `public/typewriter/` and the home page links to them. What was done:

- `index.html`, `board.html`, `font.css` and `vendor/jspdf.umd.min.js` were moved to `public/typewriter/`. This folder keeps the documentation, the server (`worker/`) and the source font.
- `public/typewriter/vendor/special-elite-latin.woff2` is a small Latin-only copy of the font, made for the home page (the typewriter pages still use `font.css`).
- The home page (`index.html` at the repo root) has a "Write to me" section, a "Write" link in the navigation and a paper strip on the "Latest" panel. On a desktop these open `typewriter/index.html` over the page in a frame; on phones and tablets they link to it. The section also shows the newest three notes from the board.
- Both typewriter pages gained a link back to the site. Inside the frame, the typewriter's link asks the home page to close it.
- The home page links to `typewriter/index.html`, not `typewriter/`, because the Vite dev server does not serve a folder's index page from `public/`.
- On localhost the home page opens the typewriter with `?api=demo`, so local testing never sends a real note.
- `BOARD_URL` in `worker/wrangler.toml` was changed to `/typewriter/board.html`. **The Worker still has to be redeployed for this to take effect** (see below).

The rest of this file is the original setup guide, kept for reference.

## What is here

| Path | What it is | Published on the site? |
|---|---|---|
| `index.html` | The typewriter. One self-contained page: HTML, CSS and JS inline | Yes |
| `board.html` | The public message board of pinned notes | Yes |
| `font.css` | The Special Elite font, embedded as base64 | Yes |
| `vendor/jspdf.umd.min.js` | jsPDF, used by `index.html` for PDF export and for the PDF attached to emailed notes | Yes |
| `vendor/SpecialElite-Regular.ttf` | Source font file, kept for reference. Nothing loads it | Optional |
| `worker/` | The server: a Cloudflare Worker, already deployed. Not part of the website | **No** |
| `README.md`, `SETUP.md` | Documentation | **No** |

## Where it must go

- **The site is built with Vite.** Only files under `public/` are copied as-is into the built site, as the existing `public/eccb-*` pages are. The `typewriter/` folder at the repo root, where it is now, is **not served**.
- **Recommended:** move `index.html`, `board.html`, `font.css` and `vendor/` into `public/typewriter/`. They are then served at:
  - `https://www.samreynolds.org/typewriter/` (the typewriter);
  - `https://www.samreynolds.org/typewriter/board.html` (the board).
- **Keep these four together in one folder.** They reference each other by relative paths: both pages load `font.css`, `index.html` loads `vendor/jspdf.umd.min.js`, and the two pages link to each other as `index.html` and `board.html`. If one is renamed or moved, update the links in the other. In `board.html` the "Leave a note" links are `href="index.html"`.
- **Do not put `worker/`, `README.md` or `SETUP.md` under `public/`.** Everything in `public/` is published. Leave them outside `public/`, for example in `typewriter/` at the repo root or in a `typewriter-server/` folder.
- **Do not run these pages through Vite's bundler.** Do not add them to `build.rollupOptions.input` in `vite.config.ts`. They are standalone static pages with inline scripts and need no processing. Rewriting them into the site's React or JS framework is not needed and risks breaking the behaviour.
- **Linking from the rest of the site:** link to `typewriter/` and `typewriter/board.html`, relative to the site root, wherever fits (nav, footer, contact section). The pages use their own dark styling and do not share the site's CSS.

## The server, and the settings that depend on where the pages live

- **The server is live** at `https://typewriter-notes.jmjuggernaut.workers.dev` (Cloudflare Workers, account of the site owner). It receives notes, emails them to the owner via Resend, and keeps "pin it up" notes until the owner approves them.
- **Both pages already point at it:**
  - `index.html` sets `let ENDPOINT = 'https://typewriter-notes.jmjuggernaut.workers.dev/notes'`;
  - `board.html` sets `let API = 'https://typewriter-notes.jmjuggernaut.workers.dev'`.

  Leave both as they are.
- **The server only accepts requests from these origins** (`ALLOWED_ORIGINS` in `worker/wrangler.toml`):
  - `https://www.samreynolds.org`
  - `https://samreynolds.org`
  - `http://localhost:8765`
  - `http://127.0.0.1:8765`

  A page served from anywhere else cannot send notes or load the board. That includes the Vite dev server on port 5173, `vite preview`, and a `*.github.io` URL. To allow another origin, add it to the comma-separated list and redeploy (see below).
- **Update `BOARD_URL` once the board's final address is known.** It is set in `worker/wrangler.toml` and is the "See the board" link on the owner's approval page. It is currently `https://www.samreynolds.org/board.html`, which is wrong if the board ends up at `/typewriter/board.html`. Change it, then redeploy.
- **To redeploy after editing `worker/wrangler.toml` or `worker/src/index.js`:** `cd` to the `worker` folder and run `wrangler deploy`.
  - Wrangler needs Node 22.12 or later. The machine uses nvm, so run `source ~/.nvm/nvm.sh && nvm use 22` first if `node -v` shows an older version.
  - Wrangler is already logged in to the right Cloudflare account.
- **Secrets:** `RESEND_API_KEY` and `TO_EMAIL` are stored in Cloudflare with `wrangler secret put` and are not in any file. Never write them into the repo. They do not need to be set again.

## Checking it works

1. **Locally, without sending email:**
   - From the folder holding the pages, run `python3 -m http.server 8765 --bind 127.0.0.1`.
   - Open `http://localhost:8765/index.html?api=demo`. This is demo mode: the full send animation plays and nothing is sent.
   - `http://localhost:8765/board.html` loads the live board read-only.
   - Avoid sending real notes while testing. Each one emails the owner and counts towards the rate limit (5 per visitor per hour, 90 per day).
2. **After deploying the site:**
   - Open `/typewriter/` on the live domain, type a line and use Send. It should arrive by email.
   - `/typewriter/board.html` should load (it shows "Nothing pinned up yet" until a note is approved).
   - In the browser console there should be no CORS errors. If there are, the page's origin is missing from `ALLOWED_ORIGINS`.
3. **`window.__tw` on the typewriter page exposes test hooks** (see `README.md`, "Testing notes").

## Known loose ends

- The Resend API key should be rotated. The owner will do this with `wrangler secret put RESEND_API_KEY`. No code change is needed.
- Emails come from Resend's shared test sender (`onboarding@resend.dev`), which can only deliver to the Resend account's own address. To send from the site's domain, verify `samreynolds.org` in Resend (this adds DNS records), then change `FROM_EMAIL` in `worker/wrangler.toml` and redeploy.
