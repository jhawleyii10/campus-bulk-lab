
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const queuePath = path.join(root, 'queue', 'posts.json');
const reservePath = path.join(root, 'queue', 'reserve.json');
const indexPath = path.join(root, 'index.html');
const postsDir = path.join(root, 'posts');

const MIN_QUEUE = 6;
const TARGET_QUEUE = 12;
const CADENCE_DAYS = 3;

const today = process.env.FORCE_DATE || new Date().toISOString().slice(0,10);
let queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
let reserve = fs.existsSync(reservePath) ? JSON.parse(fs.readFileSync(reservePath, 'utf8')) : [];

const due = queue.filter(p => p.publish_on <= today);
queue = queue.filter(p => p.publish_on > today);

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

for (const p of due) {
  const html = `<!doctype html>
<html lang="en"><head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-9VP86LE3H3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-9VP86LE3H3');
</script>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(p.title)} | Campus Bulk Lab</title>
<meta name="description" content="${escapeHtml(p.description)}">
<link rel="canonical" href="https://jhawleyii10.github.io/campus-bulk-lab/posts/${p.slug}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(p.title)}">
<meta property="og:description" content="${escapeHtml(p.description)}">
<meta property="og:url" content="https://jhawleyii10.github.io/campus-bulk-lab/posts/${p.slug}.html">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="../assets/style.css"></head>
<body>
<header class="site-header"><div class="wrap nav"><a class="brand" href="../index.html">Campus Bulk Lab</a><nav><a href="../index.html#latest">Latest</a><a href="../index.html#about">About</a></nav></div></header>
<main class="wrap article">
<p class="tag">${escapeHtml(p.category)}</p>
<h1>${escapeHtml(p.title)}</h1>
<p class="meta">Published ${p.publish_on}</p>
<div class="notice"><strong>Affiliate disclosure:</strong> As an Amazon Associate I earn from qualifying purchases.</div>
${p.body_html}
<section class="related">
  <h2>Keep Reading</h2>
  <p>
    <a href="../posts/cheap-bulking-foods.html">Cheap Bulking Foods for College Students</a> ·
    <a href="../posts/creatine-beginner-guide.html">Creatine for College Students</a> ·
    <a href="../posts/dining-hall-bulking.html">How to Bulk at the Dining Hall</a>
  </p>
</section>

</main>
<footer><div class="wrap"><p>© Campus Bulk Lab</p></div></footer>
</body></html>`;
  fs.writeFileSync(path.join(postsDir, `${p.slug}.html`), html);

  let index = fs.readFileSync(indexPath, 'utf8');
  const marker = '<!-- AUTO_POSTS_START -->';
  const card = `
      <div class="cards">
        <article class="card">
          <span class="tag">${escapeHtml(p.category)}</span>
          <h3><a href="posts/${p.slug}.html">${escapeHtml(p.title)}</a></h3>
          <p>${escapeHtml(p.description)}</p>
        </article>
      </div>`;
  index = index.replace(marker, marker + card);
  fs.writeFileSync(indexPath, index);
}

// Auto-refill queue from reserve.
if (queue.length < MIN_QUEUE && reserve.length > 0) {
  let lastDate = queue.length
    ? new Date(queue.map(p => p.publish_on).sort().slice(-1)[0] + 'T12:00:00Z')
    : new Date(today + 'T12:00:00Z');

  while (queue.length < TARGET_QUEUE && reserve.length > 0) {
    const next = reserve.shift();
    lastDate.setUTCDate(lastDate.getUTCDate() + CADENCE_DAYS);
    next.publish_on = lastDate.toISOString().slice(0,10);
    queue.push(next);
  }
}

fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
fs.writeFileSync(reservePath, JSON.stringify(reserve, null, 2));
fs.writeFileSync(path.join(root, 'published.json'), JSON.stringify(due, null, 2));
fs.writeFileSync(path.join(root, 'queue_status.json'), JSON.stringify({
  checked_on: today,
  active_queue: queue.length,
  reserve_remaining: reserve.length
}, null, 2));

console.log(`PUBLISHED ${due.length}`);
console.log(`QUEUE ${queue.length}`);
console.log(`RESERVE ${reserve.length}`);
const sitemapPath = path.join(root, 'sitemap.xml');
const baseUrl = 'https://jhawleyii10.github.io/campus-bulk-lab';

const postFiles = fs.readdirSync(postsDir)
  .filter(file => file.endsWith('.html'))
  .sort();

const sitemapUrls = [
  `${baseUrl}/`,
  ...postFiles.map(file => `${baseUrl}/posts/${file}`)
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`Updated sitemap with ${sitemapUrls.length} URLs.`);
