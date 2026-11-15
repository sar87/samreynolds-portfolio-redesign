# samreynolds.org

The personal academic website of Sam Reynolds (AI, conservation and ecology, University of Cambridge), live at **https://www.samreynolds.org**.

It is a static site: two HTML pages that load their content from JSON and Markdown files. There is no framework and no server. Pushing to `master` rebuilds and publishes it.

## What's on the site

**Home page (`index.html`)**

- A full-screen animated hero with the name, tagline, roles and headline numbers.
- A "Latest" panel showing the newest video and the newest note. The video plays a short silent clip; pressing play swaps to the full film on YouTube with sound.
- Sections for About, Featured project, Research, Publications, Grants, Talks, Roles, Media and Notes.
- Visitors can change the look: five colour palettes and three hero animations (Strata, Ripple, Silk). The controls sit in the navigation bar on wide screens and behind an "Appearance" button on smaller ones. The choice is remembered in the visitor's browser.

**Notes page (`notes.html`)**

- A list of all notes, and each note in full at `notes.html#<note-file-name>`.
- It uses whichever palette the visitor chose on the home page.

## Where things live

| Path | What it is |
| --- | --- |
| `index.html` | Home page: layout, styles and scripts in one file |
| `notes.html` | Notes list and single-note view |
| `data/*.json` | Content: about, research, publications, talks, awards, roles, media |
| `public/data/*.json` | The copies the site actually reads (see the note below) |
| `data/schemas/` | Rules each content file must follow |
| `content/notes/*.md` | Notes, one Markdown file each. `content/notes/drafts/` is not published |
| `public/images/` | Images for publications, media and notes |
| `public/clips/` | Short silent clips for the hero video |
| `scripts/build-notes.js` | Turns the notes into `public/data/notes.json` at build time |
| `scripts/validate-content.js` | Checks the content files against their schemas |
| `.pages.yml` | Settings for Pages CMS, used to write notes in the browser |
| `variants/` | Earlier design experiments. Local only, not published |
| `.github/workflows/deploy.yml` | Builds and publishes the site on every push to `master` |

**Two copies of the content.** Each file in `data/` has a twin in `public/data/`. The site reads the `public/data/` copy. Keep the two identical when editing by hand.

## Updating content

- **Notes:** write them in [Pages CMS](https://pagescms.org), which saves a Markdown file to `content/notes/` and commits it. Each note needs a `title` and a `date`. The optional "Thumbnail image" sets the picture shown beside the note in lists; if it is left empty, the first image in the note is used.
- **Everything else:** edit the matching JSON file in `data/` and its copy in `public/data/`, then run `npm run validate`.
- **Hero video clip:** a media entry can have a `clip` field pointing at a short, silent MP4 in `public/clips/`. Without it, the hero falls back to a muted YouTube player.

## Running it locally

Needs Node 20.19 or newer (see `.nvmrc`).

```sh
npm install
npm run dev        # local site with live reload
npm run validate   # check the content files
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Publishing

Every push to `master` runs the "Deploy to GitHub Pages" workflow, which builds the site and publishes it. It takes about a minute. Progress and results are under the repository's **Actions** tab. The custom domain is set by `public/CNAME`.

## Rolling back to a previous version

The live site is always a build of the latest commit on `master`, so rolling back means putting `master` back to how it was and letting it redeploy. Git keeps every earlier version, so nothing is lost either way.

First find the commit you want to undo, or the one you want to return to:

```sh
git log --oneline
```

### Undo one change (recommended)

This adds a new commit that reverses an earlier one. History stays intact, and you can undo the undo.

```sh
git pull
git revert <commit>
git push
```

### Undo everything after a known-good commit

This reverses every commit made after `<good-commit>`, as a single new commit.

```sh
git pull
git revert --no-commit <good-commit>..HEAD
git commit -m "Roll back to <good-commit>"
git push
```

Note that this also reverses any notes or content added since then. To keep those, use the next option instead.

### Restore only the design, keep the content

Take just the page files from an earlier commit and leave notes and data as they are now.

```sh
git pull
git checkout <good-commit> -- index.html notes.html
git commit -m "Restore page design from <good-commit>"
git push
```

### In a hurry, without Git

In the **Actions** tab, open an earlier successful "Deploy to GitHub Pages" run and choose **Re-run all jobs**. That republishes the site as it was at that commit. It is temporary: the next push to `master`, including a note saved from Pages CMS, publishes the latest version again. Follow it up with one of the Git options above.

### Reference points

| Commit | What it is |
| --- | --- |
| `eb567c2` | The November 2026 redesign: animated hero, palettes, new notes page |
| `41e8599` | The last version of the previous dark-green design |

For example, to go back to the previous design but keep all current notes and content:

```sh
git checkout 41e8599 -- index.html notes.html
git commit -m "Restore the previous design"
git push
```

After any rollback, check the **Actions** tab for a green run, then reload the site. A hard refresh may be needed to clear the browser's cached copy.

## Credits

Asset attributions are in `assets/ATTRIBUTION.md` and `assets/CREDITS.txt`.
