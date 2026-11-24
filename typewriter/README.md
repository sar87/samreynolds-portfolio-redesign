# Typewriter

A full-page typewriter in the browser. You just type: nothing can be erased. Backspace only steps the carriage back, so whatever you type next lands on top of what is already there. Press Enter to return the carriage and start a new line. The finished page can be exported as a PDF.

The pages (`index.html`, `board.html`, `font.css`, `vendor/jspdf.umd.min.js`) live in `public/typewriter/` so that the site publishes them; this folder holds the documentation, the server and the source font. See `SETUP.md`.

Open `index.html` in a browser. There is no build step. Typing and the PDF export work offline, straight from the file. Sending a note needs the small server in `worker/` and only works from the site itself (or localhost).

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: markup, CSS and JavaScript in one file |
| `font.css` | The Special Elite typeface, embedded as base64 so it loads from `file://` and can be drawn onto canvas for the PDF |
| `vendor/jspdf.umd.min.js` | jsPDF 2.5.1, stored locally so PDF export works offline |
| `vendor/SpecialElite-Regular.ttf` | Source font file (Apache 2.0, from Google Fonts), kept for reference |
| `board.html` | The public message board: pinned notes on cork, each opens full size |
| `worker/` | The server: a Cloudflare Worker (`src/index.js`), its config (`wrangler.toml`) and database tables (`schema.sql`) |

## How it behaves

- **Typing**: printable characters strike onto the page. Delete, the arrow keys, Home, End, paste and drag-and-drop are all blocked.
- **Backspace**: steps the carriage back one space and erases nothing. Typing there strikes over the old character, so both marks show (handy for x-ing out a typo). A space typed over a character leaves it as it is. Backspace stops at the left margin and cannot go up to an earlier line. In the PDF's selectable text layer, an overstruck position reads as the last character struck there.
- **No auto-repeat**: holding any key acts once, as on a manual machine. That includes the space bar and Backspace: one press, one step.
- **Tab**: moves to the next tab stop (every 5 characters).
- **Line length**: 60 characters per line. The margin bell rings 8 characters before the end, and the carriage locks at the margin, which plays a thud and makes the type guide shake.
- **Carriage return**: Enter, or clicking the return lever on the left of the carriage. The paper feeds up one line and the carriage is shoved back to the start.
- **Reading back**: the mouse wheel or a drag rolls the paper back. The next keystroke snaps it back to the typing line.
- **Autosave**: the page is saved to the browser's `localStorage` (key `typewriter.sheet.v1`), so a refresh doesn't lose it.
- **Top-bar buttons**:
  - New sheet: if there is text, it asks first and offers to export before clearing.
  - Keyboard toggle.
  - Sound on/off.
  - Export PDF (also Ctrl/⌘+S).
  - Send: opens the sign-off card (see below).
- **PDF export**: A4 pages of cream paper with grain. Each character is drawn with the same jitter it had on screen. An invisible text layer underneath keeps the text selectable and searchable. The file name is `typewriter-YYYY-MM-DD-HHMM.pdf`.

## Sending and pinning

- **Sign-off card**: Send asks for a name and an email. Both are optional; the email is checked only for shape. The values are remembered in `localStorage` (`typewriter.sheet.v1.from`) for next time. The card then offers two choices:
  - **Send it**: the sheet is pulled up out of the platen, held up in the middle of the window and folded in thirds (bottom up, then top down). An envelope rises from below, the note slides in, the flap closes and an amber seal presses on. The back of the envelope reads "from <name>", or "from a friend". Once the server confirms, the envelope flies off.
  - **Send it and pin it up**: the same pull, then a cork board drops in. The sheet flies to a gap on it, lightens as it comes into the board's light, gets a pin, and is stamped TO BE READ. The board then lifts away. The note is emailed as well; it only appears on the public board after the site owner approves it.
- **Then**: a fresh sheet rolls up into the machine and a toast confirms. If sending fails, the overlay fades, the original sheet is back in the machine untouched, and a toast says so.
- **While it runs** typing, the keys and the top bar are disabled. With reduced motion set in the OS, the animation is skipped: it waits for the server, then shows the toast.
- **Sounds**: platen ratchet on the pull, a crease for each fold, a whoosh, the flap, the seal, the board's knock, the pin, the stamp, and a line-feed ratchet as the new sheet feeds.
- **What is sent**: one JSON `POST` to `ENDPOINT`: `{v, mode: "email" | "pin", name, email, text, sheet: {cols, lines}, pdf, sentAt}`. `text` is the plain text, `sheet` holds every strike so the board can draw the note in the typewriter look, and `pdf` is the same PDF as the export, base64-encoded (it is `null` if it could not be made). It times out after 25 seconds.
- **Rate limit**: the server takes 5 notes per visitor per hour and 90 in all per day (Resend's free plan stops at 100 emails a day). Past that the page says to try again later, and the note stays in the machine.
- **Demo mode**: set `ENDPOINT` in `index.html` to `''` and the whole flow plays, nothing leaves the browser, and the payload is logged to the console. On localhost, `?api=demo` does the same without editing the file.

## The server (`worker/`)

A Cloudflare Worker with a D1 database. Email goes out through Resend.

- **`POST /notes`**: checks the page's origin (`ALLOWED_ORIGINS` in `wrangler.toml`), the size and shape of the note, and the rate limit. It then emails the note to `TO_EMAIL`, with the PDF attached and Reply-To set to the sender's email if they gave one.
  - Email-only notes are not stored anywhere.
  - A "pin it up" note is stored as *pending*. Its email has **Pin it to the board** and **Keep it private** buttons.
- **`GET /manage?id=…&t=…`**: your page for one pinned note. The link carries a secret token. Opening it changes nothing (mail scanners open links on their own); only its buttons do: pin, keep private (or take down later), or delete for good.
- **`GET /board`**: the pinned notes, newest first, for `board.html`. Cached for a minute.
- **Privacy**: the sender's email address is never stored. IP addresses are not stored either: only a keyed hash, for the rate limit, deleted after a day.
- **Secrets**, set with `wrangler secret put`, never in the repo: `RESEND_API_KEY` and `TO_EMAIL`.
- **Deploying changes**: `cd worker && wrangler deploy`. Wrangler needs Node 22 or later.
- **Local testing**:
  1. `wrangler d1 execute typewriter-notes --local --file schema.sql` (once).
  2. `wrangler dev --local --port 8787 --var DRY_RUN:1` logs the emails instead of sending them.
  3. Open `http://localhost:8765/index.html?api=http://localhost:8787` (and the same for `board.html`) from `python3 -m http.server 8765`.

## The board (`board.html`)

- Notes sit on a cork board in a grid, each tilted slightly and pinned.
- On the card a note is reflowed to fit. A line typed out to the margin (48 characters or more) runs on into the next; a line ended early keeps its break.
- Every strike keeps its jitter and overstrikes. Long notes fade out at the bottom.
- Click or tap a note (or Enter on it) to see the sheet exactly as it was typed. Esc, the × button or a click outside closes it.
- `API` at the top of the script is the Worker's address.

## Design decisions

### Look
- The inspiration screenshot was used for the mood only: dark surroundings, dim grey paper, and a warm lamp glowing up from the type guide onto the paper. Its layout was not copied.
- The paper has a rounded top and a speckled grain. Ink is near-black, so text outside the lamp's glow fades into the dark paper. That is intended.
- Each struck character gets a small random offset, rotation and ink density, plus a fixed per-letter bias (every key on an old machine sits slightly off). About 6% of strikes come out light. These values are stored with the text, so the PDF matches the screen. Only a quarter of the stored offset and rotation is shown, so lines read straight with a trace of unevenness: the `WOBBLE` constant in `index.html` sets this (0 is dead straight, 1 is the full jitter). Ink density is not scaled.
- The typeface is Special Elite.

### Mechanics: fixed printing point, moving carriage
- The type guide, the lamp and the three-dot housing are **fixed in the centre of the screen**. The paper, platen, knobs, scale and return lever all move under them, as on a real typewriter.
- The first version had the head travelling along a fixed bar, like the screenshot; that was replaced.
- The carriage steps one character left per keystroke. On return it travels with a "shove" curve: fast off the lever, still moving when it meets the margin stop.
- The carriage has end plates, knurled platen knobs, a chrome return lever with a finger tab, and a ruled scale numbered every 10 characters.
- The type size is chosen so a full line nearly fits in half the window. On narrower windows the start of a long line slides off the left edge near the end of the line.

### Keyboard and typebars (optional)
- The keyboard icon in the top bar shows or hides the typewriter below the platen. It is on by default on a desktop and off by default on phones and tablets (a touch screen, or a window under 700px wide). A choice made with the button is remembered (`typewriter.sheet.v1.kb` in `localStorage`) and wins on later visits.
- **Seated view**: the machine is drawn as seen from the typist's chair, not from above. The whole deck is one flat plane hinged along the platen and tipped back 58° (44° on windows narrower than 700px, so the keys stay tappable). The front row of keys is the largest and the frame narrows towards the platen. A desk surface with a horizon line sits behind it. The paper still faces the screen, so the carriage mechanics are unchanged.
- **Skeleton look**: the machine has no body. The frame, type basket and ribbon spools are thin amber lines; the keys are amber rings with a rail under each row. A pressed key fills solid amber.
- There are four staggered rows of round keys, two shift keys, a space bar, and a BACK (backspace) key at the right-hand end of the top row.
- **Keys follow the physical keyboard**: the matching on-screen key depresses while you hold the real one. Keys are matched by physical position (`KeyboardEvent.code`). In Chrome the legends are read from the user's actual keyboard layout; otherwise they fall back to US.
- **Typebars**: a fan of 45 typebars sits in a basket, one per key, ordered left to right like the keys. Each bar pivots on the segment and swings up off the tilted deck (CSS 3D with `preserve-3d`, Web Animations API). Its length is worked out in `deckGeom` so that every bar lands on the fixed printing point on screen.
- **Strike timing**: with the keyboard shown, the character appears as the bar lands (about 40ms after the keypress) and the carriage steps afterwards.
- **Shift**: holding Shift drops the whole basket slightly, as on a basket-shift machine.
- **Clickable keys**: the on-screen keys can be clicked or tapped. Clicking Shift latches it for one key. On touch devices, showing the keyboard replaces the system keyboard.
- **Missing keys**: characters with no key on the board (backtick, backslash, accented letters) still type, but a stand-in bar swings and no key moves.

### Sound
All sounds are synthesized with the Web Audio API. There are no audio files.
- **Key strike**: a filtered noise click and a low thump, then the typebar falling back. Each strike varies slightly.
- **Space bar**: a softer, lower thud.
- **Backspace**: a low thud as the key goes down, then one sharp escapement click.
- **Margin bell**: a trip click, then a hammer hitting a steel cup. The ring is short and made of slightly detuned, non-harmonic overtones.
- **Margin lock**: a dull thud.
- **Carriage return (chosen from four candidates; "4 · chatter")**:
  - **Line feed**: the lever takes up the slack, then three ratchet clicks.
  - **Travel**: one sharp click for every character the carriage passes, over a low rumble of wheels on rails. The clicks are timed to the carriage's on-screen motion.
  - **Stop**: the margin stop thunks, the frame rings briefly and a couple of loose parts settle. The stop is louder the further the carriage travelled.
  - **Blank line**: Enter at the start of a line plays just the ratchet and a soft detent.
  - **Rejected candidates**: a rolling "whirr", a pitched "zip", and a "heavy" office-machine version. They were removed after listening; earlier versions of `index.html` are not kept in this folder.

## Testing notes

- There is no automated test suite. Changes were checked by driving the page in headless Chrome with `playwright-core`, the system Chrome at `/usr/bin/google-chrome`, and screenshots.
- `window.__tw` exposes `type`, `backspace`, `carriageReturn`, `exportPDF`, `text`, `setKeys` and `bars` for scripting.
- `window.__tw.send(mode, {name, email})` runs the send flow without the card (`mode` is `email` or `pin`); `__tw.failNextSend()` makes the next demo-mode send fail, to test the failure path; `__tw.busy` is true while a send is playing.
- `window.__tw.render(name, ...args)` renders a single sound with an `OfflineAudioContext` and returns its samples. Use it to check levels and timing without speakers; `name` is one of `key`, `space`, `back`, `bell`, `ret` or `jam`.
- Sound still has to be judged by ear: offline rendering only shows levels and timing.

## Possible next steps

- Turnstile (Cloudflare's bot check) on the Send card, if spam gets past the rate limit.
- Verify samreynolds.org in Resend, so notes come from your own address and the Worker can email senders a copy.
- Paging on screen: feed a fresh sheet when a page fills, to match the PDF's pagination.
- A `.txt` export alongside the PDF.
