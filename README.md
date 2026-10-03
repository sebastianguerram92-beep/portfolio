# Sebastián Guerra · Portfolio

Product portfolio site. Plain HTML and CSS, generated from two content files by a small script with no dependencies.

## How it's organized

```
content/site.json      Name, headline, contact, "Before software", How I work, Design page
content/projects.json  Every project, in the order they appear on the home page
assets/img/            All images
assets/css/style.css   The whole design (colors and sizes are at the top, in :root)
build.js               Turns the content into pages in dist/
netlify.toml           Tells Netlify to run the build and publish dist/
```

## Add a new project

1. Put its images in `assets/img/` (JPG, about 1600px wide is plenty).
2. Open `content/projects.json`, copy an existing project block, and edit it. Where you paste it is where it shows on the home page.
3. Commit and push. Netlify rebuilds the site in about a minute.

The fields:

| Field | What it does |
| --- | --- |
| `slug` | The page address: `work/<slug>.html`. Lowercase, dashes, no spaces. |
| `name`, `tagline` | Title and one-line promise. |
| `role`, `meta` | Shown at the top of the project page. |
| `cardMeta`, `cardResult` | The small line and the bold result line on the home card. |
| `layout` | `"wide"` for a full-width card, `"half"` for a half-width one. |
| `cover` + `coverAlt` | Screenshot for the card and page. Optional `coverPosition`, e.g. `"left top"`. |
| `coverStat` | Use instead of `cover` when there's no screenshot: `{ "value": "3 parks", "label": "on one MVP" }`. |
| `star` | Situation, task, action, result. One or two lines each. |
| `numbers` | Up to four big numbers: `{ "value": "35k", "label": "people reached" }`. |
| `sections` | The deeper story (see below). |
| `footer`, `link` | Small note at the end, and an optional outside link. |

Section types for `sections`: `text`, `callout` (highlighted box), `list` (use `**bold**` for the lead-in), `stats`, `beforeAfter`, `steps`, `images`.

## Preview on your computer

```
node build.js
npx serve dist
```

## Deploy

Connect this repository to Netlify (Add new site → Import from Git). Build command and publish folder are already set in `netlify.toml`. Then add your domain under Domain settings and update `url` in `content/site.json`.

Font: Manrope, self-hosted (SIL Open Font License, see `assets/fonts/OFL-LICENSE.txt`).

## Resume

The PDF linked from the site is `assets/resume-sebastian-guerra.pdf`. Its source is `resume/resume.html`: edit it, open it in Chrome, and use Print → Save as PDF (Letter, no margins change, background graphics on) to replace the PDF.
