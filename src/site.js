/* Phần dùng chung mọi trang: menu điện thoại, form Đặt lịch, đo lường. Không phụ thuộc thư viện nào. */
(function () {
  'use strict';
  var C = (window.DCExtra && window.DCExtra.cfg) || {};
  var ROUTES = [['Trang chủ', '/'], ['Phòng chơi', '/phong-choi'], ['Board game', '/board-game'], ['Menu', '/menu'], ['Ưu đãi', '/uu-dai'], ['Blog', '/blog'], ['Giới thiệu', '/gioi-thieu']];
  var ROOMS = ['Chưa biết', 'Ngồi bệt', 'Ngồi bàn', 'Lều'];
  var PROMOS = ['Chưa chọn', 'Giờ vàng (14:00–17:00, thứ 2 – thứ 6)', 'Thẻ tích điểm', 'Sinh nhật', 'Tặng board game Lenna', 'Ưu đãi của tháng (đặt lịch trước)'];
  var SOURCES = [['', 'Bỏ qua'], ['#FB', 'Facebook'], ['#TTQC', 'Quảng cáo TikTok'], ['#TT', 'Kênh TikTok Lenna'], ['#KOL', 'Video của KOL/KOC'], ['#GG', 'Google Maps'], ['#BB', 'Bạn bè giới thiệu'], ['#DN', 'Đi ngang thấy quán']];
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- đo lường: chỉ chạy khi có mã trong tab Web – Cấu hình ---------- */
  function track(ev, data) {
    try {
      if (window.fbq) window.fbq('track', ev === 'Lead' ? 'Lead' : 'ViewContent', data || {});
      if (window.ttq) window.ttq.track(ev === 'Lead' ? 'SubmitForm' : 'ClickButton', data || {});
      if (window.gtag) window.gtag('event', ev === 'Lead' ? 'generate_lead' : ev, data || {});
    } catch (e) { }
  }
  window.LennaTrack = track;

  /* ---------- lớp phủ ---------- */
  function overlay(cls, html) {
    var o = document.createElement('div'); o.className = cls; o.innerHTML = html; document.body.appendChild(o);
    return o;
  }
  var lastFocus = null;
  function show(o) { lastFocus = document.activeElement; o.classList.add('on'); document.documentElement.style.overflow = 'hidden'; }
  function hide(o) { o.classList.remove('on'); document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { } }

  /* ---------- menu điện thoại ---------- */
  var menu = null;
  function openMenu() {
    if (!menu) {
      var path = location.pathname.replace(/\/+$/, '') || '/';
      var links = ROUTES.map(function (r) { var on = (r[1] === '/' ? path === '/' : path.indexOf(r[1]) === 0); return '<a class="lm-l' + (on ? ' on' : '') + '" href="' + r[1] + '">' + r[0] + '<span aria-hidden="true">›</span></a>'; }).join('');
      var soc = [['Facebook', C.facebook_fanpage], ['TikTok', C.tiktok_lenna], ['Zalo', C.zalo], ['Google Maps', C.google_maps], ['Instagram', C.instagram]].filter(function (x) { return x[1]; })
        .map(function (x) { return '<a href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + x[0] + '</a>'; }).join('');
      menu = overlay('lm-ov', '<div class="lm-panel" role="dialog" aria-modal="true" aria-label="Menu"><div class="lm-top"><img src="/assets/logo-blue.svg" alt="Lenna Board Game"><button class="lb-x" type="button" aria-label="Đóng menu">×</button></div>' + links +
        '<a class="lb-btn lm-cta" href="#dat-lich" style="text-decoration:none">Đặt lịch giữ phòng</a>' + (soc ? '<div class="lm-soc">' + soc + '</div>' : '') + '</div>');
      menu.addEventListener('click', function (e) { if (e.target === menu || e.target.closest('.lb-x') || e.target.closest('a')) hide(menu); });
    }
    show(menu); track('open_menu');
  }

  /* ---------- form Đặt lịch ---------- */
  var book = null;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function times() { var o = []; for (var h = 14; h <= 23; h++) { o.push(pad(h) + ':00'); if (h < 23) o.push(pad(h) + ':30'); } return o; }
  function opts(list, sel) { return list.map(function (x) { var v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join(''); }

  function formHtml() {
    var hours = C.gio_mo_cua || '14:00 – 23:00 mỗi ngày';
    return '<div class="lb-sheet" role="dialog" aria-modal="true" aria-labelledby="lb-t"><div class="lb-top"><div><h2 id="lb-t">Đặt lịch giữ phòng</h2><p class="lb-sub">Nhắn là giữ phòng, không cần cọc. Lenna nhắn lại anh chị liền, xác nhận trước giờ hẹn 1 tiếng.</p></div><button class="lb-x" type="button" aria-label="Đóng">×</button></div>' +
      '<form class="lb-f" novalidate autocomplete="on">' +
      '<label for="lb-name">Họ tên <i>*</i></label><input id="lb-name" name="name" type="text" autocomplete="name" maxlength="60" required>' +
      '<label for="lb-phone">Số điện thoại có Zalo <i>*</i></label><input id="lb-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="09xx xxx xxx" required>' +
      '<div class="lb-row"><div><label for="lb-date">Ngày <i>*</i></label><input id="lb-date" name="date" type="date" min="' + today() + '" required></div>' +
      '<div><label for="lb-time">Giờ đến <i>*</i></label><select id="lb-time" name="time">' + opts(times(), '19:00') + '</select></div></div>' +
      '<label for="lb-people">Số người <i>*</i></label><div class="lb-step"><button type="button" data-d="-1" aria-label="Bớt 1 người">−</button><input id="lb-people" name="people" type="number" inputmode="numeric" min="1" max="50" value="4"><button type="button" data-d="1" aria-label="Thêm 1 người">+</button></div>' +
      '<div class="lb-note" id="lb-big" style="display:none">Nhóm trên 10 người: quản lý Lenna sẽ gọi xác nhận riêng cho chắc chỗ.</div>' +
      '<label for="lb-room">Kiểu phòng</label><select id="lb-room" name="room">' + opts(ROOMS) + '</select>' +
      '<label for="lb-promo">Ưu đãi muốn dùng</label><select id="lb-promo" name="promo">' + opts(PROMOS) + '</select>' +
      '<label for="lb-src">Anh chị biết Lenna qua đâu?</label><select id="lb-src" name="source">' + opts(SOURCES) + '</select>' +
      '<label for="lb-note">Ghi chú</label><textarea id="lb-note" name="note" maxlength="300" placeholder="Ví dụ: sinh nhật bạn, cần chỗ gần lối ra…"></textarea>' +
      '<div class="lb-hp" aria-hidden="true"><label>Bỏ trống ô này<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
      '<label class="lb-chk"><input id="lb-agree" name="agree" type="checkbox"><span>Tôi đồng ý để Lenna dùng họ tên, số điện thoại để xác nhận lịch đặt, theo <a href="/chinh-sach-bao-mat/" target="_blank" rel="noopener">chính sách dữ liệu cá nhân</a>.</span></label>' +
      '<div class="lb-err" id="lb-err" role="alert"></div>' +
      '<button class="lb-btn" type="submit">Gửi đặt lịch</button>' +
      '<p class="lb-mini">Quán mở ' + esc(hours) + '. Không thu cọc, không thanh toán online.</p></form></div>';
  }
  function openBook(pre) {
    if (!book) {
      book = overlay('lb-ov', formHtml());
      book.addEventListener('click', function (e) { if (e.target === book || e.target.closest('.lb-x')) hide(book); });
      var form = $('form', book);
      form.addEventListener('click', function (e) {
        var b = e.target.closest('[data-d]'); if (!b) return;
        var i = $('#lb-people', form), v = Math.max(1, Math.min(50, (+i.value || 1) + (+b.getAttribute('data-d')))); i.value = v; big();
      });
      $('#lb-people', form).addEventListener('input', big);
      form.addEventListener('submit', submit);
    }
    var f = $('form', book);
    if (pre && pre.room) $('#lb-room', f).value = pre.room;
    if (pre && pre.promo) $('#lb-promo', f).value = pre.promo;
    big(); show(book); track('open_booking');
    setTimeout(function () { var n = $('#lb-name', book); if (n) n.focus(); }, 60);
  }
  function big() { var f = $('form', book); $('#lb-big', f).style.display = (+$('#lb-people', f).value > 10) ? 'block' : 'none'; }
  function fail(msg) { var e = $('#lb-err', book); e.textContent = msg; e.style.display = 'block'; e.scrollIntoView({ block: 'nearest' }); }
  function normPhone(p) { p = String(p || '').replace(/[\s.\-()]/g, ''); var m = /^(?:\+84|84|0)([35789]\d{8})$/.exec(p); return m ? '0' + m[1] : ''; }
  function submit(ev) {
    ev.preventDefault();
    var f = ev.target, g = function (n) { return (f.elements[n] && f.elements[n].value || '').trim(); }, btn = $('button[type=submit]', f);
    $('#lb-err', book).style.display = 'none';
    if (g('website')) return; // ô bẫy chống gửi rác
    var phone = normPhone(g('phone'));
    if (g('name').length < 2) return fail('Anh chị nhập giúp họ tên nha.');
    if (!phone) return fail('Số điện thoại chưa đúng. Anh chị nhập số Việt Nam 10 số, ví dụ 0912 345 678.');
    if (!g('date')) return fail('Anh chị chọn giúp ngày đến nha.');
    if (g('date') < today()) return fail('Ngày đã qua rồi ạ, anh chị chọn ngày khác giúp Lenna.');
    var people = +g('people'); if (!(people >= 1 && people <= 50)) return fail('Số người từ 1 đến 50 thôi ạ.');
    if (!f.elements.agree.checked) return fail('Anh chị tích đồng ý chính sách dữ liệu để Lenna gửi lịch giúp anh chị nha.');
    var data = { name: g('name'), phone: phone, date: g('date'), time: g('time'), people: people, room: g('room'), promo: g('promo'), source: g('source'), note: g('note'), page: location.pathname };
    if (!C.dat_lich_api) return fail('Web chưa nhận được lịch đặt trực tiếp. Anh chị nhắn Lenna qua Messenger giúp nha: ' + (C.facebook_fanpage || ''));
    btn.disabled = true; btn.textContent = 'Đang gửi…';
    fetch(C.dat_lich_api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'Chưa gửi được'); track('Lead', { value: people }); location.href = '/cam-on/'; })
      .catch(function (e) { btn.disabled = false; btn.textContent = 'Gửi đặt lịch'; fail((e && e.message && e.message !== 'Failed to fetch' ? e.message + '. ' : '') + 'Chưa gửi được lịch. Anh chị thử lại hoặc nhắn Lenna qua Messenger giúp nha.'); });
  }
  window.LennaBooking = { open: openBook };

  /* ---------- bấm chuột ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'), t = e.target;
    if (t.closest && t.closest('[aria-label="Mở menu"]')) { e.preventDefault(); openMenu(); return; }
    if (a) {
      var h = a.getAttribute('href') || '';
      if (/^#dat-lich/.test(h)) { e.preventDefault(); openBook(); return; }
      if (/^tel:/.test(h)) track('click_hotline'); else if (/zalo/i.test(h)) track('click_zalo');
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (book && book.classList.contains('on')) hide(book); if (menu && menu.classList.contains('on')) hide(menu); } });
  if (/^#dat-lich/.test(location.hash)) window.addEventListener('load', function () { openBook(); });
})();
