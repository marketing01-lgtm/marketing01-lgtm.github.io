#!/usr/bin/env node
/* Dựng website Lenna Board Game thành các file tĩnh trong website/dist.
   Mỗi trang = 1 bản điện thoại + 1 bản máy tính lấy từ bản thiết kế (.dc.html). HTML bản điện thoại được dựng sẵn (cho Google, Facebook, Zalo đọc được chữ);
   bản máy tính và các tương tác chạy bằng dc-lite ở trình duyệt. Chạy: node src/build.js */
const fs = require('fs'), path = require('path'), DC = require('./dc-lite.js');
const ROOT = path.resolve(__dirname, '..'), DIST = path.join(ROOT, 'dist'), ASSETS = path.join(ROOT, 'assets-src');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'));
const PAGES = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));
const STATIC = require('./static-pages.js'), PATCH = require('./patches.js');
const BUILD = Date.now().toString(36); // đưa vào địa chỉ tệp để điện thoại không giữ bản cũ
const BREAK = 900; // từ 900px trở lên dùng bản máy tính
const LOGO_WHITE = '18b9fcf89bae9942f7d8d06cab1d0dbe', LOGO_BLUE = 'c2442ec9eff7fdd0f5be400ddf2f82ce', OG_IMG = '2a31ccd2124fc5e3e14f3eb2213280cf', CHISU_LOVE = 'a713daca726764e2d9fd3cd8d8e477df';

/* ---------- bộ ảnh xoay các góc của Chisu (tùy chọn): data/turntable.json = { "c-royal": { "n": 36, "ext": "webp" } }, ảnh ở assets-src/turn/c-royal/00.webp … ---------- */
const TURN = {};
try { const t = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/turntable.json'), 'utf8')); for (const [pose, c] of Object.entries(t)) { if (fs.existsSync(path.join(ROOT, 'assets-src/turn', pose))) TURN[pose] = { n: c.n, ext: c.ext || 'webp', dir: '/assets/turn/' + pose + '/' }; } } catch (e) { }

/* ---------- ảnh ---------- */
const assetFile = {};
fs.readdirSync(ASSETS).forEach(f => { const m = /^([a-f0-9]{32})\.(\w+)$/.exec(f); if (m) assetFile[m[1]] = f; });
const used = new Set([LOGO_WHITE, LOGO_BLUE, OG_IMG, CHISU_LOVE, 'e0f8bdca5297c8db1d8c6017c3c649eb', 'f7445975cb60257728e50ac8fa150013']), missing = new Set(); // + 2 ảnh Chisu 2D mới: Chiến Binh và trượt ván
const remap = s => s.replace(/\/_blob\/([a-f0-9]{32})/g, (_, id) => { if (!assetFile[id]) { missing.add(id); return '/assets/missing-' + id; } used.add(id); return '/assets/' + assetFile[id]; });

/* ---------- dữ liệu dùng chung (từ tab Web – Cấu hình) ---------- */
function cfgView(c) {
  const digits = (c.hotline || '').replace(/[^\d+]/g, '');
  return Object.assign({}, c, {
    dia_chi_dong: c.dia_chi ? c.dia_chi + ', ' + c.khu_vuc : c.khu_vuc,
    hotline_hien: c.hotline || 'Hotline sắp cập nhật',
    link_tel: digits ? 'tel:' + digits : '#', has_tel: !!digits,
    link_zalo: c.zalo || '#', has_zalo: !!c.zalo,
    link_messenger: c.messenger || c.facebook_fanpage || '#', has_messenger: !!(c.messenger || c.facebook_fanpage),
    link_facebook: c.facebook_fanpage || '#', has_facebook: !!c.facebook_fanpage,
    link_tiktok: c.tiktok_lenna || '#', has_tiktok: !!c.tiktok_lenna,
    link_maps: c.google_maps || '#', has_maps: !!c.google_maps
  });
}
const CFG = cfgView(SITE.config);
// bản gửi xuống trình duyệt: chỉ các khóa công khai
const PUBLIC_KEYS = ['ten_quan', 'trang_thai', 'khu_vuc', 'dia_chi', 'gio_mo_cua', 'hotline', 'zalo', 'facebook_fanpage', 'messenger', 'tiktok_lenna', 'tiktok_chisu', 'instagram', 'google_maps', 'dat_lich_api', 'ga4_id', 'meta_pixel_id', 'tiktok_pixel_id',
  'dia_chi_dong', 'hotline_hien', 'link_tel', 'has_tel', 'link_zalo', 'has_zalo', 'link_messenger', 'has_messenger', 'link_facebook', 'has_facebook', 'link_tiktok', 'has_tiktok', 'link_maps', 'has_maps'];
const CLIENT_CFG = {}; PUBLIC_KEYS.forEach(k => { if (CFG[k] !== undefined) CLIENT_CFG[k] = CFG[k]; });

/* ---------- đọc 1 file thiết kế ---------- */
function loadDc(name, after) {
  const html = fs.readFileSync(path.join(__dirname, 'pages', name + '.dc.html'), 'utf8');
  const xdc = /<x-dc>([\s\S]*?)<\/x-dc>/.exec(html)[1], hm = /<helmet>([\s\S]*?)<\/helmet>/.exec(xdc);
  const css = [...hm[1].matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const links = [...hm[1].matchAll(/<link[^>]*>/g)].map(m => m[0]);
  const script = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(html)[1];
  const patch = (src, list, what) => { for (const [a, b] of list) {
    if (a instanceof RegExp) { if (!new RegExp(a.source, a.flags.replace('g', '')).test(src)) throw new Error('Bản vá ' + what + ' không khớp ở ' + name + ': ' + a.source.slice(0, 60)); src = src.replace(a, b); }
    else { if (!src.includes(a)) throw new Error('Bản vá ' + what + ' không khớp ở ' + name + ': ' + a.slice(0, 60)); src = src.split(a).join(b); } } return src; };
  const tpl = patch(transform(xdc.replace(/<helmet>[\s\S]*?<\/helmet>/, ''), name), PATCH.tpl[name] || [], 'giao diện'), sc = patch(script, PATCH.script[name] || [], 'xử lý');
  return { tpl: after ? after(tpl) : tpl, css: remap(css), links, script: sc };
}

/* Đường dẫn các trang và liên hệ: nối theo chữ của nút/liên kết */
const ROUTE = { 'trang chủ': '/', 'phòng chơi': '/phong-choi', 'board game': '/board-game', 'menu': '/menu', 'ưu đãi': '/uu-dai', 'giới thiệu': '/gioi-thieu', 'blog': '/blog', 'xem menu': '/menu' };
function linkFor(text, href) {
  const t = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (ROUTE[t]) return ROUTE[t];
  if (/^(xem thư viện|\d+ game có chisu)/.test(t)) return '/board-game';
  if (/^xem phòng/.test(t)) return '/phong-choi';
  if (t.includes('đặt lịch')) return '#dat-lich';
  if (t.startsWith('messenger') || /^(nhắn (lenna|đặt phòng|tin)|gửi video dự thi)/.test(t)) return '{{cfg.link_messenger}}';
  if (t.startsWith('zalo')) return '{{cfg.link_zalo}}';
  if (t.startsWith('gọi')) return '{{cfg.link_tel}}';
  if (t === '') { if (/^#phong/.test(href)) return '/phong-choi'; if (/^#dat-lich/.test(href)) return '#dat-lich'; }
  return null;
}
const FLAG = { link_messenger: 'has_messenger', link_zalo: 'has_zalo', link_tel: 'has_tel', link_facebook: 'has_facebook', link_tiktok: 'has_tiktok', link_maps: 'has_maps' };
const PILL = { 'Phòng chơi': '/phong-choi', 'Board game': '/board-game', 'Menu': '/menu', 'Ưu đãi': '/uu-dai', 'Giới thiệu': '/gioi-thieu', 'Blog': '/blog', 'Trang chủ': '/' };
const SOCIAL = { 'Facebook': 'link_facebook', 'TikTok': 'link_tiktok', 'Zalo': 'link_zalo', 'Google Maps': 'link_maps' };
const guard = (to, html) => { const m = /^\{\{cfg\.(link_\w+)\}\}$/.exec(to); return m ? '<sc-if value="{{cfg.' + FLAG[m[1]] + '}}">' + html + '</sc-if>' : html; };
function transform(src, name) {
  src = remap(src);
  // các liên kết chết trên bản thiết kế (mở màn hình thiết kế khác): bỏ đi
  src = src.replace(/\s*<div style="display: flex; flex-wrap: wrap; gap: 8px 18px">\s*(?:<a href="[^"]*\.dc\.html"[^>]*>Xem màn hình[^<]*<\/a>\s*)+<\/div>/g, '');
  // số game: ghi "hơn 100" (quy tắc nội dung), không ghi số đang có trong thư viện
  src = src.replace(/>76 board game/g, '>Hơn 100 board game').replace(/76 board game/g, 'hơn 100 board game');
  src = src.replace(/>76<\/span>/g, '>100+</span>'); // con số nổi bật: 100+ thay vì 76
  // thanh menu máy tính: thêm "Trang chủ" ở đầu (trang chủ được đánh dấu đang xem)
  src = src.replace(/(<nav class="nav[^"]*"[^>]*>\s*)(<a )/, (m, a, b) => a + '<a href="#"' + (name === 'Desktop' ? ' aria-current="page" style="font-weight: 800; text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px"' : '') + '>Trang chủ</a>' + b);
  src = src.replace(/<a\s([^>]*?)href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g, (m, a, href, b, inner) => {
    const to = linkFor(inner, href); if (!to) return m;
    const ext = /^\{\{cfg\./.test(to) && !/link_tel/.test(to) ? ' target="_blank" rel="noopener"' : '';
    return guard(to, '<a ' + a + 'href="' + to + '"' + ext + b + '>' + inner + '</a>');
  });
  // các nút nhỏ ở chân trang vẽ bằng <span>: đổi thành liên kết thật
  src = src.replace(/<span class="glass" style="([^"]*)">([^<]+)<\/span>/g, (m, st, text) => {
    const t = text.trim(), keep = '; text-decoration: none; color: inherit';
    if (PILL[t]) return '<a class="glass" href="' + PILL[t] + '" style="' + st + keep + '">' + text + '</a>';
    if (SOCIAL[t]) return guard('{{cfg.' + SOCIAL[t] + '}}', '<a class="glass" href="{{cfg.' + SOCIAL[t] + '}}" target="_blank" rel="noopener" style="' + st + keep + '">' + text + '</a>');
    return m;
  });
  src = src.split('[Địa chỉ], TP. Thủ Đức').join('{{cfg.dia_chi_dong}}').split('[Hotline]').join('{{cfg.hotline_hien}}');
  return src;
}

/* màn hình chờ khi mở trang và khi bấm sang trang khác: logo Lenna hiện lên, vệt sáng chạy qua logo (site.js ẩn nó khi trang sẵn sàng) */
const LOADER = () => '<div id="lenna-loader" aria-hidden="true"><div class="ld-logo"><img src="/assets/' + assetFile[LOGO_BLUE] + '" alt=""></div></div>\n<noscript><style>#lenna-loader{display:none}</style></noscript>\n<script>window.__ld0=Date.now()</script>\n'; // màn hình chờ: nền trắng, logo hiện lên rồi nhún lên xuống

/* ---------- ghi file ---------- */
const write = (rel, data) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
const compile = script => new Function('DCLogic', script + '\n;return Component;');
const q = s => JSON.stringify(s).replace(/<\/script/gi, '<\\/script').replace(new RegExp('[\\u2028\\u2029]', 'g'), c => '\\u' + c.charCodeAt(0).toString(16));
const ORIGIN = SITE.config.ten_mien ? 'https://' + SITE.config.ten_mien : '';
const INDEXABLE = String(SITE.config.cho_google_tim || '').trim().toLowerCase() === 'có'; // Không = báo Google đừng lập chỉ mục (bản nháp)

/* đo lường: chỉ chèn khi có mã trong tab Web – Cấu hình */
function analytics() {
  let h = '';
  if (CFG.ga4_id) h += '<script async src="https://www.googletagmanager.com/gtag/js?id=' + DC.esc(CFG.ga4_id) + '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config",' + q(CFG.ga4_id) + ');</script>';
  if (CFG.meta_pixel_id) h += '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init",' + q(CFG.meta_pixel_id) + ');fbq("track","PageView");</script>';
  if (CFG.tiktok_pixel_id) h += '<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(' + q(CFG.tiktok_pixel_id) + ');ttq.page()}(window,document,"ttq");</script>';
  return h;
}
function jsonLd() {
  const org = { '@context': 'https://schema.org', '@type': CFG.dia_chi ? 'LocalBusiness' : 'Organization', name: CFG.ten_quan, url: ORIGIN || undefined,
    logo: ORIGIN ? ORIGIN + '/assets/' + assetFile[LOGO_BLUE] : undefined, sameAs: [CFG.facebook_fanpage, CFG.tiktok_lenna, CFG.instagram].filter(Boolean) };
  if (CFG.dia_chi) { org.address = { '@type': 'PostalAddress', streetAddress: CFG.dia_chi, addressLocality: CFG.khu_vuc, addressCountry: 'VN' }; org.openingHours = 'Mo-Su 14:00-23:00'; }
  if (CFG.hotline) org.telephone = CFG.hotline;
  return '<script type="application/ld+json">' + JSON.stringify(org).replace(/</g, '\\u003c') + '</script>';
}
function head(p, extra) {
  const url = ORIGIN + p.path, img = (ORIGIN || '') + '/assets/' + assetFile[OG_IMG];
  return '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<title>' + DC.esc(p.title) + '</title>\n<meta name="description" content="' + DC.esc(p.desc) + '">\n' +
    (p.noindex || !INDEXABLE ? '<meta name="robots" content="noindex,nofollow">\n' : '') + (ORIGIN ? '<link rel="canonical" href="' + url + '">\n' : '') +
    '<meta property="og:type" content="website"><meta property="og:locale" content="vi_VN"><meta property="og:site_name" content="' + DC.esc(CFG.ten_quan) + '"><meta property="og:title" content="' + DC.esc(p.title) + '"><meta property="og:description" content="' + DC.esc(p.desc) + '">' + (ORIGIN ? '<meta property="og:url" content="' + url + '">' : '') + '<meta property="og:image" content="' + img + '"><meta name="twitter:card" content="summary_large_image">\n' +
    '<link rel="icon" href="/assets/' + assetFile[LOGO_BLUE] + '" type="image/svg+xml"><meta name="theme-color" content="#2f6bff">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' + (extra || '') + jsonLd() + analytics() + '\n';
}

/* bài viết blog: mỗi bài một trang /blog/<tên-bài>/ (danh sách bài lấy từ trang Blog) */
const ARTICLE = require('./article.js');
const POSTS = (() => { const b = loadDc('BlogPC'); return new (compile(b.script)(DC.DCLogic))({}).posts().map(p => Object.assign({ slug: PATCH.slugify(p.t) }, p)); })();
const ALL = PAGES.concat(POSTS.map((p, i) => ({ id: 'bai-viet-' + p.slug, path: '/blog/' + p.slug, m: 'BaiViet', pc: 'BaiVietPC', post: p, idx: i,
  title: p.t + ' | Blog Lenna Board Game', desc: p.ex, noindex: i > 0 }))); // bài chưa có nội dung đầy đủ: chưa cho Google lập chỉ mục
const related = i => [1, 2, 3].map(k => POSTS[(i + k) % POSTS.length]);

fs.rmSync(DIST, { recursive: true, force: true });
const sitemap = [];
for (const p of ALL) {
  const art = (mobile) => p.post && p.idx > 0 ? (t => ARTICLE.placeholder(t, p.post, p.idx, related(p.idx), mobile)) : undefined;
  const M = loadDc(p.m, art(true)), P = loadDc(p.pc, art(false));
  const ssr = DC.renderComponent(DC.parse(M.tpl), compile(M.script)(DC.DCLogic), {}, { cfg: CFG });
  for (const [v, d] of [['m', M], ['pc', P]]) write('p/' + p.id + '.' + v + '.js', 'window.DCSite=window.DCSite||{};DCSite[' + q(p.id + '.' + v) + ']={tpl:' + q(d.tpl) + ',Component:(function(DCLogic){' + d.script + '\n;return Component;})(DCLite.DCLogic)};');
  const fonts = [...new Set(M.links.concat(P.links))].join('\n');
  const boot = "(function(){var id=" + q(p.id) + ",mq=matchMedia('(min-width: " + BREAK + "px)'),forced=(/[?&]v=(m|pc)\\b/.exec(location.search)||[])[1],cur=null,app=document.getElementById('app');" +
    "function load(v,cb){if(window.DCSite&&DCSite[id+'.'+v])return cb();var s=document.createElement('script');s.src='/p/'+id+'.'+v+'.js?v=" + BUILD + "';s.onload=cb;document.head.appendChild(s);}" +
    "function go(){var v=forced||(mq.matches?'pc':'m');if(cur&&cur.v===v)return;load(v,function(){if(cur)cur.h.destroy();var d=DCSite[id+'.'+v];if(app.getAttribute('data-ssr')!==v)app.innerHTML='';cur={v:v,h:DCLite.mount(app,d.tpl,d.Component,{},window.DCExtra)};app.setAttribute('data-ssr',v);});}" +
    "go();mq.addEventListener('change',go);})();";
  const base = '<style>body{margin:0;background:#f4f7fd}[aria-hidden="true"]{pointer-events:none}@media(min-width:' + BREAK + 'px){#app[data-ssr="m"]{visibility:hidden}}</style>';
  const mqM = '(max-width: ' + (BREAK - 0.02) + 'px)', mqP = '(min-width: ' + BREAK + 'px)';
  // ?v=m hoặc ?v=pc: ép xem bản điện thoại / máy tính (để anh kiểm tra trên 1 thiết bị)
  const force = '<script>(function(){var m=/[?&]v=(m|pc)\\b/.exec(location.search);if(m){document.getElementById("css-m").media=m[1]==="m"?"all":"not all";document.getElementById("css-pc").media=m[1]==="pc"?"all":"not all";if(m[1]==="pc")document.getElementById("app").setAttribute("data-force","pc")}})();</script>';
  const html = '<!doctype html>\n<html lang="vi"><head>' + head(p, fonts + '\n<link rel="stylesheet" href="/site.css?v=' + BUILD + '">\n') + base +
    '\n<style id="css-m" media="' + mqM + '">' + M.css + '</style>\n<style id="css-pc" media="' + mqP + '">' + P.css + '</style>\n' +
    '</head><body>\n' + LOADER() + '<div id="app" data-ssr="m">' + ssr + '</div>\n' + force + '\n<script src="/dc-lite.js?v=' + BUILD + '"></script>\n<script>window.DCExtra={cfg:' + q(CLIENT_CFG) + ',turn:' + q(TURN) + '};</script>\n<script src="/site.js?v=' + BUILD + '" defer></script>\n<script>' + boot + '</script>\n</body></html>\n';
  write((p.path === '/' ? '' : p.path.replace(/^\//, '') + '/') + 'index.html', html);
  if (!p.noindex) sitemap.push(ORIGIN + p.path);
}

/* trang tĩnh: Cảm ơn, Chính sách dữ liệu, 404 */
const statics = STATIC(CFG, { logo: '/assets/' + assetFile[LOGO_BLUE], chisu: '/assets/' + assetFile[CHISU_LOVE] });
for (const s of statics) {
  const html = '<!doctype html>\n<html lang="vi"><head>' + head(s, '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Be+Vietnam+Pro:wght@400;600;700&display=swap">\n<link rel="stylesheet" href="/site.css?v=' + BUILD + '">\n') +
    '</head><body style="margin:0">\n' + LOADER() + s.body + '\n<script>window.DCExtra={cfg:' + q(CLIENT_CFG) + '};</script>\n<script src="/site.js?v=' + BUILD + '" defer></script>\n</body></html>\n';
  write(s.file, html);
  if (s.sitemap) sitemap.push(ORIGIN + s.path);
}

write('dc-lite.js', fs.readFileSync(path.join(__dirname, 'dc-lite.js')));
write('site.css', fs.readFileSync(path.join(__dirname, 'site.css')));
write('site.js', fs.readFileSync(path.join(__dirname, 'site.js'), 'utf8').replace('/assets/logo-blue.svg', '/assets/' + assetFile[LOGO_BLUE]));
Object.keys(TURN).forEach(pose => { fs.cpSync(path.join(ROOT, 'assets-src/turn', pose), path.join(DIST, 'assets/turn', pose), { recursive: true }); });
used.forEach(id => { fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true }); fs.copyFileSync(path.join(ASSETS, assetFile[id]), path.join(DIST, 'assets', assetFile[id])); });
write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + sitemap.map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n</urlset>\n');
write('robots.txt', 'User-agent: *\n' + (INDEXABLE ? 'Allow: /\n' + (ORIGIN ? 'Sitemap: ' + ORIGIN + '/sitemap.xml\n' : '') : 'Disallow: /\n'));
if (ORIGIN) write('CNAME', SITE.config.ten_mien + '\n');
write('.nojekyll', '');
console.log('Đã dựng ' + ALL.length + ' trang + ' + statics.length + ' trang tĩnh, ' + used.size + ' ảnh' + (missing.size ? ', THIẾU ' + missing.size + ' ảnh: ' + [...missing].join(' ') : '') + ' → ' + DIST);
