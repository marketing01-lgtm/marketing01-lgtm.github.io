#!/usr/bin/env node
/* Đưa mã website lên GitHub (không cần cài git): tạo kho <tên-đăng-nhập>.github.io nếu chưa có, bật GitHub Pages, rồi đẩy toàn bộ thư mục website lên nhánh main
   bằng công cụ `gh` đã đăng nhập (gh auth login). Mã không đụng mật khẩu hay khóa nào. Chạy lại được nhiều lần để cập nhật.
   Dùng: node tools/publish-github.js [tên-kho]   (biến GH = đường dẫn tới gh nếu không nằm trong PATH) */
const fs = require('fs'), path = require('path'), { execFile } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), GH = process.env.GH || 'gh';
const SKIP = [/^dist\//, /^node_modules\//, /(^|\/)\.DS_Store$/, /^assets-src\/.*\.tmp$/];

const run = (args, input) => new Promise((res, rej) => {
  const p = execFile(GH, args, { maxBuffer: 1 << 27, encoding: 'utf8' }, (e, out, err) => e ? rej(new Error((err || e.message).trim().slice(0, 400))) : res(out));
  if (input !== undefined) p.stdin.end(input);
});
const api = async (args, body) => { const out = await run(['api', ...args].concat(body !== undefined ? ['--input', '-'] : []), body !== undefined ? JSON.stringify(body) : undefined); return out.trim() ? JSON.parse(out) : null; };
function walk(dir, base = '') { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => { const rel = path.posix.join(base, d.name); return d.isDirectory() ? walk(path.join(dir, d.name), rel) : SKIP.some(r => r.test(rel)) ? [] : [rel]; }); }

(async () => {
  const owner = (await run(['api', 'user', '-q', '.login'])).trim(), repo = process.argv[2] || owner + '.github.io', R = 'repos/' + owner + '/' + repo;
  let exists = true; try { await api([R]); } catch (e) { exists = false; }
  if (!exists) { console.log('Tạo kho ' + owner + '/' + repo + ' …'); await api(['-X', 'POST', 'user/repos'], { name: repo, description: 'Website Lenna Board Game', private: false, auto_init: true }); await new Promise(r => setTimeout(r, 3000)); }
  try { await api(['-X', 'POST', R + '/pages'], { build_type: 'workflow' }); console.log('Đã bật GitHub Pages (đăng bằng Actions).'); } catch (e) { if (!/exist|409|already/i.test(e.message)) console.log('Pages: ' + e.message); }

  const files = walk(ROOT), blobs = [];
  console.log('Đẩy ' + files.length + ' tệp …');
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < files.length) {
      const f = files[i++], data = fs.readFileSync(path.join(ROOT, f));
      const b = await api(['-X', 'POST', R + '/git/blobs'], { content: data.toString('base64'), encoding: 'base64' });
      blobs.push({ path: f, mode: '100644', type: 'blob', sha: b.sha });
    }
  }));
  const head = await api([R + '/git/ref/heads/main']), tree = await api(['-X', 'POST', R + '/git/trees'], { tree: blobs });
  const msg = 'Cập nhật website ' + new Date().toISOString().slice(0, 16).replace('T', ' ');
  const commit = await api(['-X', 'POST', R + '/git/commits'], { message: msg, tree: tree.sha, parents: [head.object.sha] });
  await api(['-X', 'PATCH', R + '/git/refs/heads/main'], { sha: commit.sha, force: true });
  console.log('Xong. Kho: https://github.com/' + owner + '/' + repo + '\nWebsite (vài phút sau khi Actions chạy xong): https://' + (/\.github\.io$/.test(repo) ? repo : owner + '.github.io/' + repo) + '/');
})().catch(e => { console.error('Lỗi: ' + e.message); process.exit(1); });
