#!/usr/bin/env node
/* Lấy dữ liệu website từ Google Sheet (qua Lenna – Website API, Apps Script) và ghi vào data/. Chạy: node tools/sync.js
   Link API nằm ở data/site.json › config.dat_lich_api (hoặc biến môi trường DATA_URL). Chưa có link thì giữ dữ liệu đang có và thoát bình thường. */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), F = path.join(ROOT, 'data', 'site.json');
(async () => {
  const site = JSON.parse(fs.readFileSync(F, 'utf8')), url = process.env.DATA_URL || site.config.dat_lich_api;
  if (!url) { console.log('Chưa có link Lenna – Website API: giữ nguyên dữ liệu trong data/.'); return; }
  const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'a=data', { redirect: 'follow' });
  if (!r.ok) throw new Error('API trả lỗi ' + r.status);
  const d = await r.json();
  if (!d || d.ok === false || !d.config) throw new Error('API trả dữ liệu không đúng: ' + String(d && d.error).slice(0, 100));
  // giữ link API và các khóa chỉ có ở máy; còn lại theo Sheet
  site.config = Object.assign({}, site.config, d.config, { dat_lich_api: d.config.dat_lich_api || site.config.dat_lich_api });
  fs.writeFileSync(F, JSON.stringify(site, null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, 'data', 'sheet.json'), JSON.stringify({ at: d.at, content: d.content || [], menu: d.menu || [], uudai: d.uudai || [], blog: d.blog || [], games: d.games || [] }, null, 2) + '\n');
  console.log('Đã lấy dữ liệu: ' + Object.keys(d.config).length + ' khóa cấu hình, ' + (d.content || []).length + ' dòng nội dung, ' + (d.menu || []).length + ' món, ' + (d.games || []).length + ' game.');
})().catch(e => { console.error('Lấy dữ liệu lỗi:', e.message); process.exit(1); });
