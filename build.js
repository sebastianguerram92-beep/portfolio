#!/usr/bin/env node
// Builds the static site into dist/ from content/site.json and content/projects.json.
// No dependencies: run `node build.js`. Netlify runs it on every push (see netlify.toml).

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/projects.json'), 'utf8'));

// ---------- helpers ----------
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Text with **bold** support, nothing else.
const md = (s = '') => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const year = new Date().getFullYear();
// Changes whenever style.css changes, so browsers never keep an old copy.
const CSS_VERSION = require('crypto').createHash('md5').update(fs.readFileSync(path.join(ROOT, 'assets/css/style.css'))).digest('hex').slice(0, 8);

const ICONS = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  split: '<path d="M3 12h18M12 4l-4 8 4 8M12 4l4 8-4 8"/>',
  chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>'
};
const icon = (name) => `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

function layout({ title, description, base, body, pagePath, image }) {
  const canonical = site.url.replace(/\/$/, '') + '/' + pagePath.replace(/index\.html$/, '');
  const ogImage = site.url.replace(/\/$/, '') + '/' + (image || site.photo);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${base}assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${base}assets/css/style.css?v=${CSS_VERSION}">
</head>
<body>
<main class="page">
${body}
</main>
</body>
</html>
`;
}

function nav(base, { back } = {}) {
  if (back) {
    return `<nav class="nav" aria-label="Main">
<a class="nav__who" href="${base}index.html#work"><b>← All work</b></a>
<span style="color: var(--quiet)">${esc(site.name)}</span>
</nav>`;
  }
  return `<nav class="nav" aria-label="Main">
<a class="nav__who" href="${base}index.html"><b>${esc(site.name)}</b><span>${esc(site.role)} · ${esc(site.location.split(',')[0])}</span></a>
<div class="nav__links">
<a href="${base}index.html#work">Work</a>
<a href="${base}index.html#how">How I work</a>
<a href="${base}design.html">Design</a>
<a href="${base}index.html#contact">Contact</a>
<a href="${base}${esc(site.resume)}" class="nav__resume">Resume</a>
</div>
</nav>`;
}

function contact() {
  return `<section id="contact" class="panel contact">
<h2>${esc(site.contact.title)}</h2>
<p class="lead" style="max-width: 560px">${esc(site.contact.text)}</p>
<div class="btns">
<a class="btn btn--dark" href="mailto:${esc(site.email)}">Email me</a>
<a class="btn" href="${esc(site.linkedin)}" rel="noopener">LinkedIn</a>
<a class="btn" href="${esc(site.resume)}">Resume (PDF)</a>
</div>
<div class="footer"><span>© ${year} ${esc(site.name)}</span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></div>
</section>`;
}

// ---------- cards ----------
function cardMedia(p, base) {
  if (p.cover) return `<div class="card__media"><img src="${base}${esc(p.cover)}" alt="${esc(p.coverAlt)}" loading="lazy"${p.coverPosition ? ` style="object-position: ${esc(p.coverPosition)}"` : ''}></div>`;
  // Optional blurred photo behind the text covers.
  const bg = p.coverBg ? `<img class="cover-bg" src="${base}${esc(p.coverBg)}" alt="" aria-hidden="true" loading="lazy">` : '';
  const bgClass = p.coverBg ? ' has-bg' : '';
  if (p.coverFlow) return `<div class="card__media card__media--flow${bgClass}">${bg}<ol class="cover-flow" aria-label="How the work flows">${p.coverFlow.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>`;
  if (p.coverStat) return `<div class="card__media${bgClass}">${bg}<div class="cover-stat"><b>${esc(p.coverStat.value)}</b><span>${esc(p.coverStat.label)}</span></div></div>`;
  return `<div class="card__media"></div>`;
}

function card(p, base) {
  const wide = p.layout === 'wide';
  const body = `<div class="card__body">
<span class="card__meta">${esc(p.cardMeta)}</span>
<h3 class="card__title">${esc(p.name)}</h3>
<p class="card__tagline">${esc(p.tagline)}</p>
<p class="card__result">${esc(p.cardResult)}</p>
${wide ? '<span class="card__more">Read the case →</span>' : ''}
</div>`;
  const media = cardMedia(p, base);
  // Wide cards alternate image left / image right.
  const flip = wide && p._wideIndex % 2 === 1;
  return `<a class="card${wide ? ' card--wide' : ''}" href="${base}work/${p.slug}.html">
${flip ? body + media : media + body}
</a>`;
}

// ---------- home ----------
function home() {
  const base = '';
  let w = 0;
  projects.forEach(p => { if (p.layout === 'wide') p._wideIndex = w++; });
  const bs = site.beforeSoftware;
  const [strong, ...rest] = [site.headlineStrong, site.headline.replace(site.headlineStrong, '')];
  const body = `
<section class="panel hero">
${nav(base)}
<div class="hero__body">
<div class="hero__text">
<span class="hero__hi">Hi, I'm Seb</span>
<h1><strong>${esc(strong)}</strong>${esc(rest.join(''))}</h1>
<p class="hero__sub">${esc(site.subline)}</p>
<div class="btns">
<a class="btn btn--dark" href="#work">See my work</a>
<a class="btn" href="mailto:${esc(site.email)}">Get in touch</a>
</div>
</div>
<img class="hero__photo" src="${esc(site.photo)}" alt="Portrait of ${esc(site.name)}" width="880" height="1247">
</div>
</section>

<section class="panel panel--tight" aria-label="Where I've built products">
<p class="eyebrow">Where I've built products</p>
<ul class="names">${site.ledFor.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
</section>

<section id="work" class="panel">
<div class="section-head">
<h2 class="h2">My work</h2>
<p class="lead">What I built, the calls I made, and what changed.</p>
</div>
<div class="grid">
${projects.map(p => card(p, base)).join('\n')}
</div>
</section>

<section id="before" class="panel">
<div class="section-head">
<span class="eyebrow">${esc(bs.eyebrow)}</span>
<h2 class="h2">${esc(bs.title)}</h2>
<p class="lead">${esc(bs.text)}</p>
</div>
<div class="photo-grid">
${bs.items.map(i => `<div class="photo-card"><img src="${esc(i.image)}" alt="${esc(i.alt)}" loading="lazy"><div><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div></div>`).join('\n')}
</div>
${bs.renders ? `<div class="renders">
<div class="renders__head"><h3>${esc(bs.renders.title)}</h3><a href="design.html">See all design and 3D work →</a></div>
<div class="renders__grid">${bs.renders.items.map(r => `<figure><img src="${esc(r.image)}" alt="${esc(r.alt)}" loading="lazy"><figcaption>${esc(r.caption)}</figcaption></figure>`).join('')}</div>
</div>` : ''}
<p class="footnote">${esc(bs.footnote)}</p>
</section>

<section id="how" class="panel">
<h2 class="h2 center">How I work</h2>
<div class="how">
${site.howIWork.map(h => `<div class="how__item">${icon(h.icon)}<h3>${esc(h.title)}</h3><p>${esc(h.text)}</p>${h.see ? `<a class="how__see" href="work/${esc(h.see.slug)}.html">See: ${esc(h.see.label)} →</a>` : ''}</div>`).join('\n')}
</div>
</section>

${contact()}`;
  return layout({ title: `${site.name} · ${site.role}`, description: site.description, base, body, pagePath: 'index.html' });
}

// ---------- project page ----------
function figure(f, base) {
  return `<figure><img src="${base}${esc(f.image)}" alt="${esc(f.alt)}" loading="lazy">${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ''}</figure>`;
}

function section(s, base) {
  const h = s.title ? `<h2>${esc(s.title)}</h2>` : '';
  switch (s.type) {
    case 'text': return `<div class="block">${h}<p>${md(s.body)}</p></div>`;
    case 'callout': return `<div class="block callout">${h}<p>${md(s.body)}</p></div>`;
    case 'list': return `<div class="block">${h}<ul>${s.items.map(i => `<li>${md(i)}</li>`).join('')}</ul></div>`;
    case 'stats': return `<div class="block">${h}<div class="stat-cards">${s.items.map(i => `<div><b>${esc(i.value)}</b><span>${esc(i.label)}</span></div>`).join('')}</div></div>`;
    case 'beforeAfter': return `<div class="block">${h}<div class="ba">${s.items.map(i => `<div><span>${esc(i.before)}</span><span>→ ${esc(i.after)}</span></div>`).join('')}</div>${s.image ? `<div style="max-width: 360px">${figure(s.image, base)}</div>` : ''}</div>`;
    case 'steps': return `<div class="block">${h}<ol class="steps">${s.items.map(i => `<li>${esc(i)}</li>`).join('')}</ol></div>`;
    case 'images': return `<div class="block">${h}<div class="figs">${s.items.map(f => figure(f, base)).join('')}</div></div>`;
    default: return '';
  }
}

function projectPage(p, i) {
  const base = '../';
  const next = projects[(i + 1) % projects.length];
  const star = p.star ? `<div class="star">
<div><span class="eyebrow">Situation</span><p>${esc(p.star.situation)}</p></div>
<div><span class="eyebrow">Task</span><p>${esc(p.star.task)}</p></div>
<div><span class="eyebrow">Action</span><p>${esc(p.star.action)}</p></div>
<div class="star--result"><span class="eyebrow">Result</span><p>${esc(p.star.result)}</p></div>
</div>` : '';
  let cover = '';
  if (p.cover) cover = `<div class="case-cover"><img src="${base}${esc(p.cover)}" alt="${esc(p.coverAlt)}"></div>`;
  const numbers = p.numbers ? `<section class="panel panel--tight"><div class="numbers">${p.numbers.map(n => `<div><b>${esc(n.value)}</b><span>${esc(n.label)}</span></div>`).join('')}</div></section>` : '';
  const foot = (p.footer || p.link) ? `<div class="case-foot"><span>${esc(p.footer || '')}</span>${p.link ? `<a href="${esc(p.link.href)}" rel="noopener">${esc(p.link.label)} ↗</a>` : ''}</div>` : '';
  const body = `
<section class="panel">
${nav(base, { back: true })}
<div class="case-head">
<span class="card__meta" style="font-size: 14px">${esc(p.role)} · ${esc(p.meta)}</span>
<h1>${esc(p.name)}</h1>
<p>${esc(p.tagline)}</p>
</div>
${star}
${cover}
</section>
${numbers}
<section class="panel">
<div class="case-body">
${(p.sections || []).map(s => section(s, base)).join('\n')}
${foot}
</div>
</section>
${nextBand(next, base)}`;
  return layout({ title: `${p.name}: ${p.tagline.replace(/\.$/, '')} · ${site.name}`, description: `${p.name} case study by ${site.name}. ${p.tagline}`, base, body, pagePath: `work/${p.slug}.html`, image: p.cover });
}

// Next-case band: the next project's photo, blurred, behind the link.
function nextBand(next, base) {
  const img = next.coverBg || next.cover;
  const bg = img ? `<img class="cover-bg" src="${base}${esc(img)}" alt="" aria-hidden="true" loading="lazy">` : '';
  return `<a class="next${img ? ' has-bg' : ''}" href="${next.slug}.html">${bg}<span>Next case</span><b>${esc(next.name)} →</b></a>`;
}

// ---------- design page ----------
function designPage() {
  const base = '';
  const d = site.design;
  const body = `
<section class="panel">
<nav class="nav" aria-label="Main"><a class="nav__who" href="index.html"><b>← Back to product work</b></a><span style="color: var(--quiet)">${esc(site.name)}</span></nav>
<div class="section-head" style="max-width: 760px">
<span class="eyebrow">${esc(d.eyebrow)}</span>
<h1 class="case-head" style="font-size: clamp(40px, 5vw, 64px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05">${esc(d.title)}</h1>
<p class="lead" style="font-size: 19px">${esc(d.intro)}</p>
</div>
<div class="star" style="grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr))">
${d.process.map(s => `<div><span class="eyebrow">${esc(s.title)}</span><p>${esc(s.text)}</p></div>`).join('')}
</div>
</section>
${d.groups.map(g => `<section class="panel">
<div class="section-head"><h2 class="h2" style="font-size: 30px">${esc(g.title)}</h2>${g.text ? `<p class="lead">${esc(g.text)}</p>` : ''}</div>
<div class="gallery gallery--${g.columns}">
${g.items.map(f => `<figure${f.span ? ' class="span"' : ''}><img src="${esc(f.image)}" alt="${esc(f.alt)}" loading="lazy"><figcaption>${esc(f.caption)}</figcaption></figure>`).join('\n')}
</div>
${g.links ? `<p class="footnote">Walk through two spaces: ${g.links.map(l => `<a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>` : ''}
</section>`).join('\n')}
<a class="next" href="index.html#work"><span>Today I build digital products</span><b>See the product work →</b></a>`;
  return layout({ title: `Design and 3D work · ${site.name}`, description: `${site.name}'s earlier design and 3D visualization work: interiors, commercial spaces and facades.`, base, body, pagePath: 'design.html', image: 'assets/img/design-living.jpg' });
}

function notFound() {
  const body = `<section class="panel" style="min-height: 60vh; justify-content: center">
<h1 class="h2">This page doesn't exist.</h1>
<a class="btn btn--dark" href="/">Back to the home page</a>
</section>`;
  return layout({ title: `Not found · ${site.name}`, description: site.description, base: '/', body, pagePath: '404.html' });
}

// ---------- write ----------
function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

// Check that every image referenced in the content exists.
const missing = [];
const refs = JSON.stringify([site, projects]).match(/assets\/img\/[^"]+/g) || [];
refs.forEach(r => { if (!fs.existsSync(path.join(ROOT, r))) missing.push(r); });
if (missing.length) { console.error('Missing images:\n  ' + missing.join('\n  ')); process.exit(1); }

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
write('index.html', home());
write('design.html', designPage());
write('404.html', notFound());
projects.forEach((p, i) => write(`work/${p.slug}.html`, projectPage(p, i)));
const pages = ['', 'design', ...projects.map(p => `work/${p.slug}`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>${site.url.replace(/\/$/, '')}/${p}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url.replace(/\/$/, '')}/sitemap.xml\n`);
console.log(`Built ${projects.length} projects + home, design and 404 into dist/`);
