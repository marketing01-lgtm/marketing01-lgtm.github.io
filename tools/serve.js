#!/usr/bin/env node
/* Máy chủ xem thử website (chỉ chạy trên máy này): phát thư mục dist, địa chỉ đẹp (/phong-choi/ → index.html). Chạy: node tools/serve.js [cổng] */
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.resolve(__dirname, '..', 'dist'), PORT = +process.argv[2] || +process.env.PORT || 8880;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/__mock') { let b = ''; req.on('data', c => b += c); req.on('end', () => { console.log('Đặt lịch thử:', b); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"ok":true}'); }); return; } // chỉ để thử form đặt lịch
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(DIST, p);
  if (!f.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { const nf = path.join(DIST, '404.html'); res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'Không tìm thấy trang'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('Xem thử website: http://localhost:' + PORT + '/'));
