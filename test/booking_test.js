// Thử phần máy chủ đặt lịch (apps-script/Code.gs) bằng Google giả lập: không cần mạng, không chạm Sheet thật.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const code = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');

function world() {
  const book = [['LỊCH ĐẶT VÀ KHÁCH'], ['ghi chú'], ['STT', 'Cơ sở', 'Ngày', 'Giờ', 'Tên khách', 'SĐT', 'Người · phòng', 'Kênh · nguồn', 'Trạng thái', 'Chăm sóc sau', 'Ghi chú']];
  const sheets = {
    'Theo dõi đặt lịch': book,
    'Web – Cấu hình': [['CẤU HÌNH'], ['ghi chú'], ['Nhóm', 'Khóa', 'Giá trị', 'Ghi chú', 'Cập nhật'], ['Quán', 'ten_quan', 'Lenna Board Game', 'nội bộ', '22/10/2026'], ['Khu xu', 'gia_xu', '10.000đ/xu', '', '']],
  };
  const mkSheet = rows => ({
    getLastRow: () => rows.length,
    getRange: (r, c, nr, nc) => ({
      getValues: () => rows.slice(r - 1, r - 1 + nr).map(x => x.slice(c - 1, c - 1 + nc)),
      setValues: v => { v.forEach((row, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; row.forEach((x, j) => { rows[r - 1 + i][c - 1 + j] = x; }); }); },
      setValue: v => { rows[r - 1] = rows[r - 1] || []; rows[r - 1][c - 1] = v; return { }; },
      setNumberFormat() { return this; },
    }),
    getDataRange: () => ({ getDisplayValues: () => rows.map(r => r.map(String)) }),
  });
  const calls = [], props = { ZALO_BOT_TOKEN: 'tok', ZALO_CHAT_IDS: 'c1, c2' }, mem = {};
  const sandbox = {
    console: { log() { }, error() { } },
    SpreadsheetApp: { openById: () => ({ getSheetByName: n => sheets[n] ? mkSheet(sheets[n]) : null }) },
    CacheService: { getScriptCache: () => ({ get: k => mem[k] || null, put: (k, v) => { mem[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] || null }) },
    UrlFetchApp: { fetch: (u, o) => { calls.push({ u, body: JSON.parse(o.payload) }); return { getResponseCode: () => 200, getContentText: () => '{"ok":true}' }; } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }) },
  };
  vm.createContext(sandbox);
  const api = vm.runInContext(code + '\n({ doPost, doGet });', sandbox);
  const post = o => JSON.parse(api.doPost({ postData: { contents: typeof o === 'string' ? o : JSON.stringify(o) } }).getContent());
  return { api, post, book, calls, sheets };
}
const ok = { name: 'Nguyễn Văn A', phone: '0912 345 678', date: '2026-10-25', time: '19:30', people: 4, room: 'Lều', promo: 'Giờ vàng (14:00–17:00, thứ 2 – thứ 6)', source: '#FB', note: 'Sinh nhật bạn' };

{ // 1. đặt lịch hợp lệ: ghi đúng dòng, báo Zalo (không lộ SĐT đầy đủ)
  const w = world(), r = w.post(ok);
  assert.strictEqual(r.ok, true); assert.strictEqual(r.row, 4);
  const row = w.book[3];
  assert.strictEqual(row[0], 1); assert.strictEqual(row[1], 'TD01'); assert.strictEqual(row[3], '19:30'); assert.strictEqual(row[4], 'Nguyễn Văn A');
  assert.strictEqual(row[5], '0912345678'); assert.strictEqual(row[6], '4 người · Lều'); assert.strictEqual(row[7], 'Website · #FB'); assert.strictEqual(row[8], 'Đang tư vấn');
  assert(row[10].includes('Giờ vàng') && row[10].includes('Sinh nhật bạn'));
  assert.strictEqual(w.calls.length, 2, 'báo cho 2 chat Zalo');
  assert(!w.calls[0].body.text.includes('0912345678') && w.calls[0].body.text.includes('***678'), 'tin Zalo chỉ ghi 3 số cuối');
  const r2 = w.post(Object.assign({}, ok, { phone: '0987654321' })); assert.strictEqual(w.book[4][0], 2, 'STT tiếp theo');
  console.log('1 đặt lịch hợp lệ: ghi dòng đúng cột, STT tăng, Zalo chỉ 3 số cuối: OK');
}
{ // 2. ô bẫy, dữ liệu sai, công thức
  const w = world();
  assert.strictEqual(w.post(Object.assign({}, ok, { website: 'x' })).ok, true); assert.strictEqual(w.book.length, 3, 'ô bẫy không ghi dòng');
  assert.strictEqual(w.post(Object.assign({}, ok, { phone: '12345' })).ok, false);
  assert.strictEqual(w.post(Object.assign({}, ok, { name: 'A' })).ok, false);
  assert.strictEqual(w.post(Object.assign({}, ok, { date: '25/10/2026' })).ok, false);
  assert.strictEqual(w.post(Object.assign({}, ok, { people: 99 })).ok, false);
  assert.strictEqual(w.post('không phải json').ok, false);
  w.post(Object.assign({}, ok, { name: '=HYPERLINK("http://x")', note: '+cmd', promo: 'Chưa chọn' }));
  assert(w.book[3][4].startsWith("'=") && w.book[3][10].startsWith("'+"), 'chặn công thức');
  assert.strictEqual(w.post(Object.assign({}, ok, { room: 'Phòng VIP', source: '#XYZ' })).ok, true); assert.strictEqual(w.book[4][6], '4 người'); assert.strictEqual(w.book[4][7], 'Website');
  console.log('2 ô bẫy, dữ liệu sai, công thức, kiểu phòng/nguồn lạ: OK');
}
{ // 3. chống gửi dồn: mỗi số tối đa 3 lần/giờ
  const w = world(); for (let i = 0; i < 3; i++) assert.strictEqual(w.post(ok).ok, true);
  assert.strictEqual(w.post(ok).ok, false); assert.strictEqual(w.book.length, 6);
  console.log('3 chống gửi dồn theo số điện thoại: OK');
}
{ // 4. dữ liệu cho website không lộ ghi chú nội bộ
  const w = world(), d = JSON.parse(w.api.doGet({ parameter: { a: 'data' } }).getContent());
  assert.strictEqual(d.config.gia_xu, '10.000đ/xu'); assert(!JSON.stringify(d).includes('nội bộ'));
  assert.strictEqual(JSON.parse(w.api.doGet({ parameter: {} }).getContent()).ok, false);
  console.log('4 doGet trả cấu hình, không kèm ghi chú nội bộ: OK');
}
console.log('BOOKING OK');
