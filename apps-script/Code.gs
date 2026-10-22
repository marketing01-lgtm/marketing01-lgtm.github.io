/**
 * Lenna – Website API (Google Apps Script)
 * Hai việc:
 *  1) POST  : khách đặt lịch trên website → ghi 1 dòng ở cuối tab "Theo dõi đặt lịch" (file Marketing) → báo qua Zalo Bot.
 *  2) GET ?a=data : trả dữ liệu để dựng website (tab Web – Cấu hình, Web – Nội dung, Web – Menu, Chương trình ưu đãi, Thư viện blog, App_Game).
 * Bí mật (ZALO_BOT_TOKEN, ZALO_CHAT_IDS) chỉ nằm trong Script Properties, không ghi trong mã.
 * Không bao giờ xóa hoặc sửa dòng cũ; chỉ thêm dòng mới ở cuối.
 */
const MARKETING_ID = '1uoXsslI6YIuYX32k-AwN-iUo0jBb1nM3EaNsL48gRzI';   // file "Lenna Board Game – Marketing"
const APPKHACH_ID = '1uGkXpcPt5GpFsh-jBnWNo9xfH4GowpbAO1zSs5xO2Mw';    // file dữ liệu app khách (tab App_Game)
const TAB_BOOK = 'Theo dõi đặt lịch';
const COSO = 'TD01';
const ROOMS = ['Chưa biết', 'Ngồi bệt', 'Ngồi bàn', 'Lều'];
const SOURCES = { '': '', '#FB': 1, '#TTQC': 1, '#TT': 1, '#KOL': 1, '#GG': 1, '#BB': 1, '#DN': 1 };

const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const P_ = () => PropertiesService.getScriptProperties();
const safe_ = v => { v = String(v == null ? '' : v).trim(); return /^[=+\-@]/.test(v) ? "'" + v : v; };   // chặn công thức trong ô
const pad_ = n => (n < 10 ? '0' : '') + n;

/* ---------------- Đặt lịch ---------------- */
function doPost(e) {
  try {
    let d; try { d = JSON.parse(e.postData.contents); } catch (x) { return json_({ ok: false, error: 'Dữ liệu chưa đúng' }); }
    if (d.website) return json_({ ok: true });                                 // ô bẫy chống gửi rác: giả vờ thành công
    const name = String(d.name || '').trim().slice(0, 60);
    const phone = String(d.phone || '').replace(/[\s.\-()]/g, '');
    const m = /^(?:\+84|84|0)([35789]\d{8})$/.exec(phone);
    const people = Math.round(+d.people), date = String(d.date || ''), time = String(d.time || '');
    if (name.length < 2) return json_({ ok: false, error: 'Anh chị nhập giúp họ tên' });
    if (!m) return json_({ ok: false, error: 'Số điện thoại chưa đúng' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return json_({ ok: false, error: 'Ngày giờ chưa đúng' });
    if (!(people >= 1 && people <= 50)) return json_({ ok: false, error: 'Số người từ 1 đến 50' });
    const sdt = '0' + m[1], room = ROOMS.indexOf(d.room) >= 0 ? d.room : 'Chưa biết', src = SOURCES[d.source] !== undefined ? d.source : '';
    const promo = d.promo && d.promo !== 'Chưa chọn' ? String(d.promo).slice(0, 80) : '';
    const note = String(d.note || '').slice(0, 300);

    // chống gửi dồn: mỗi số tối đa 3 lần/giờ, cả web tối đa 80 lần/giờ
    const cache = CacheService.getScriptCache(), kp = 'bk:' + sdt, kg = 'bk:all';
    if (+cache.get(kp) >= 3) return json_({ ok: false, error: 'Số này vừa đặt nhiều lần, anh chị nhắn Messenger giúp Lenna nha' });
    if (+cache.get(kg) >= 80) return json_({ ok: false, error: 'Hệ thống đang đông, anh chị nhắn Messenger giúp Lenna nha' });

    const lock = LockService.getScriptLock(); lock.waitLock(15000);
    let row, stt;
    try {
      const sh = SpreadsheetApp.openById(MARKETING_ID).getSheetByName(TAB_BOOK);
      if (!sh) return json_({ ok: false, error: 'Chưa có tab Theo dõi đặt lịch' });
      const last = Math.max(sh.getLastRow(), 3);
      const col = last > 3 ? sh.getRange(4, 1, last - 3, 1).getValues() : [];
      stt = col.reduce((a, r) => Math.max(a, +r[0] || 0), 0) + 1;
      row = last + 1;
      const [y, mo, da] = date.split('-').map(Number);
      const vals = [stt, COSO, new Date(y, mo - 1, da), time, safe_(name), '', people + ' người' + (room === 'Chưa biết' ? '' : ' · ' + room),
        'Website' + (src ? ' · ' + src : ''), 'Đang tư vấn', '', safe_([promo, note].filter(Boolean).join(' | '))];
      const rg = sh.getRange(row, 1, 1, vals.length);
      sh.getRange(row, 6).setNumberFormat('@');                                // giữ số 0 đầu của SĐT
      rg.setValues([vals.map((v, i) => i === 5 ? '' : v)]);
      sh.getRange(row, 6).setValue(sdt);
      sh.getRange(row, 4).setNumberFormat('@').setValue(time);
    } finally { lock.releaseLock(); }
    cache.put(kp, String((+cache.get(kp) || 0) + 1), 3600); cache.put(kg, String((+cache.get(kg) || 0) + 1), 3600);

    const when = pad_(+date.split('-')[2]) + '/' + pad_(+date.split('-')[1]) + ' ' + time;
    zaloAll_('🔔 Lịch mới từ website\n' + name + ' · ' + people + ' người' + (room === 'Chưa biết' ? '' : ' · ' + room) + '\nĐến: ' + when +
      '\nSĐT: ***' + sdt.slice(-3) + (promo ? '\nƯu đãi: ' + promo : '') + (src ? '\nNguồn: ' + src : '') +
      '\nXem dòng ' + row + ' tab Theo dõi đặt lịch (STT ' + stt + ')');
    return json_({ ok: true, row: row });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Chưa gửi được, anh chị thử lại giúp Lenna nha' });
  }
}

/* ---------------- Zalo Bot (cách gọi giống webapp Quản lý) ---------------- */
function zaloSend_(chat, text) {
  const tk = P_().getProperty('ZALO_BOT_TOKEN'); if (!tk) return 'Chưa có ZALO_BOT_TOKEN';
  try {
    const r = UrlFetchApp.fetch('https://bot-api.zaloplatforms.com/bot' + tk + '/sendMessage', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 2000) }) });
    let j = {}; try { j = JSON.parse(r.getContentText() || '{}'); } catch (e) { }
    return r.getResponseCode() === 200 && j.ok !== false ? 'Đã gửi' : 'Lỗi ' + r.getResponseCode() + ': ' + String(j.description || j.message || '').slice(0, 80);
  } catch (e) { return 'Lỗi: ' + String(e.message).slice(0, 80); }
}
function zaloAll_(text) {
  const ids = String(P_().getProperty('ZALO_CHAT_IDS') || '').split(',').map(s => s.trim()).filter(Boolean);
  ids.forEach(id => { const r = zaloSend_(id, text); if (r !== 'Đã gửi') console.error('Zalo ' + id + ': ' + r); });
  return ids.length;
}

/* ---------------- Dữ liệu cho website ---------------- */
function tab_(ss, name, cols) {
  const sh = ss.getSheetByName(name); if (!sh) return [];
  const v = sh.getDataRange().getDisplayValues(); let h = -1;
  for (let i = 0; i < Math.min(v.length, 8); i++) if (cols.every(c => v[i].indexOf(c) >= 0)) { h = i; break; }
  if (h < 0) return [];
  const head = v[h];
  return v.slice(h + 1).filter(r => r.some(x => String(x).trim())).map(r => { const o = {}; head.forEach((c, i) => { if (c) o[c] = r[i]; }); return o; });
}
function doGet(e) {
  const a = e && e.parameter && e.parameter.a;
  if (a === 'ping') return json_({ ok: true, t: new Date().toISOString() });
  if (a !== 'data') return json_({ ok: false, error: 'Dùng ?a=data' });
  const m = SpreadsheetApp.openById(MARKETING_ID), out = { ok: true, at: new Date().toISOString() };
  out.config = {}; tab_(m, 'Web – Cấu hình', ['Khóa', 'Giá trị']).forEach(r => { out.config[r['Khóa']] = r['Giá trị']; });
  Object.keys(out.config).forEach(k => { if (/_so_luong$|^email|token|secret|mat_khau/i.test(k)) delete out.config[k]; });   // số phòng, bàn là thông tin nội bộ chưa được công bố
  out.content = tab_(m, 'Web – Nội dung', ['Mã', 'Nội dung chính']).map(r => ({ trang: r['Trang'], khoi: r['Khối'], ma: r['Mã'], chinh: r['Nội dung chính'], phu: r['Nội dung phụ'], so: r['Số liệu · giá'], anh: r['Ảnh · link'], tt: +r['Thứ tự'] || 0, hien: r['Hiện'] !== 'Không' }));
  out.menu = tab_(m, 'Web – Menu', ['Mã', 'Tên món']).map(r => ({ nhom: r['Nhóm'], ma: r['Mã'], ten: r['Tên món'], gia: r['Giá'], mota: r['Mô tả'], anh: r['Ảnh'], noibat: +r['Nổi bật'] || 0, tt: +r['Thứ tự'] || 0, hien: r['Hiện'] !== 'Không' }));
  out.uudai = tab_(m, 'Chương trình ưu đãi', ['Chương trình', 'Ưu đãi']);
  out.blog = tab_(m, 'Thư viện blog', ['Mã', 'Tiêu đề bài']);
  try {
    out.games = tab_(SpreadsheetApp.openById(APPKHACH_ID), 'App_Game', ['ID', 'Tên']).filter(g => String(g['Hiển thị']).toUpperCase() !== 'FALSE').map(g => { delete g['Luật chi tiết (cho AI)']; return g; });
  } catch (x) { out.games = []; out.gamesError = String(x.message).slice(0, 120); }
  return json_(out);
}

/* ---------------- Chạy tay trong trình soạn Apps Script ---------------- */
function kiemTra() {                              // thử ghi 1 dòng giả vào cuối tab và báo Zalo
  const r = doPost({ postData: { contents: JSON.stringify({ name: 'THỬ – xóa dòng này', phone: '0912345678', date: Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd'), time: '19:00', people: 2, room: 'Lều', source: '#FB', note: 'Dòng thử từ kiemTra()' }) } });
  console.log(r.getContent());
}
function zaloLayChatId() {                        // sau khi anh chị nhắn "xin chào" cho Zalo Bot, chạy hàm này để thấy chat_id
  const tk = P_().getProperty('ZALO_BOT_TOKEN'); if (!tk) { console.log('Chưa có ZALO_BOT_TOKEN trong Script Properties'); return; }
  const r = UrlFetchApp.fetch('https://bot-api.zaloplatforms.com/bot' + tk + '/getUpdates', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ timeout: 5 }) });
  const j = JSON.parse(r.getContentText() || '{}'), seen = {};
  [].concat(j.result || []).forEach(u => { const m = u.message || u, c = m && m.chat && m.chat.id; if (c) seen[c] = (m.from && (m.from.display_name || m.from.name)) || ''; });
  console.log(Object.keys(seen).length ? 'chat_id tìm thấy: ' + JSON.stringify(seen) : 'Chưa thấy tin nhắn nào gửi cho bot. Nhắn cho bot trên Zalo rồi chạy lại.');
}
function zaloThu() { console.log(zaloAll_('Tin thử từ Lenna – Website API')); }
