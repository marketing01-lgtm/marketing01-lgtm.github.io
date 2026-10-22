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

  /* ---------- linh vật Chisu: nghiêng 3D theo chuột / ngón tay. Chisu hiện chỉ có ảnh phẳng 1 góc nhìn nên chỉ nghiêng được; khi có bộ ảnh xoay các góc
     (data/turntable.json, xem README) thì kéo ngang sẽ xoay thật từng góc 360° ---------- */
  var still = false; try { still = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  var TURN = (window.DCExtra && window.DCExtra.turn) || {}, spinState = new WeakMap(), drag = null, hover = null;
  var clamp = function (v, m) { return Math.max(-m, Math.min(m, v)); };
  function poseOf(el) { var m = /\bc-[a-z]+\b/.exec(el.className || ''); return m && m[0]; }
  function spinEl(t) {
    var s = t && t.closest && t.closest('[role="img"],[data-spin]'); if (!s) return null;
    var el = (s.classList.contains('chi') || s.tagName === 'IMG' || s.hasAttribute('data-spin')) ? s : s.querySelector(':scope > .chi');
    if (!el || el.offsetWidth < 100 || el.closest('a,button')) return null;
    if (el.tagName === 'IMG' && !el.classList.contains('float') && !el.hasAttribute('data-spin')) return null;
    return el;
  }
  function S(el) { var s = spinState.get(el); if (!s) { s = { rx: 0, ry: 0, tx: 0, ty: 0, a: 0, v: 0, raf: 0 }; spinState.set(el, s); } return s; }
  function turnOf(el) { var p = poseOf(el), t = p && TURN[p]; if (t && !t.img) { t.img = []; for (var i = 0; i < t.n; i++) { var im = new Image(); im.src = t.dir + (i < 10 ? '0' : '') + i + '.' + (t.ext || 'webp'); t.img.push(im); } } return t || null; }
  function paint(el, s) {
    el.__spin = true;
    var th = Math.hypot(s.rx, s.ry);
    el.style.rotate = th < .05 ? '' : (s.rx / th).toFixed(3) + ' ' + (s.ry / th).toFixed(3) + ' 0 ' + th.toFixed(2) + 'deg';
    if (s.turn) { var n = s.turn.n, f = Math.round(((s.a % 360) + 360) % 360 / 360 * n) % n; el.style.backgroundImage = 'url(' + s.turn.dir + (f < 10 ? '0' : '') + f + '.' + (s.turn.ext || 'webp') + ')'; }
  }
  function loop(el, s) {
    if (s.raf) return;
    (function step() {
      s.raf = 0;
      var active = (drag && drag.el === el) || (hover && hover.el === el) || s.hold;
      if (!active) { s.tx = 0; s.ty = 0; }
      var k = active ? .22 : .12; s.rx += (s.tx - s.rx) * k; s.ry += (s.ty - s.ry) * k;
      var turning = false;
      if (s.turn) {
        if (!(drag && drag.el === el)) { s.a += s.v; s.v *= .93; if (Math.abs(s.v) < .05) { s.v = 0; if (!active) s.a += (Math.round(s.a / 360) * 360 - s.a) * .08; } }
        turning = Math.abs(s.v) > .05 || Math.abs(s.a - Math.round(s.a / 360) * 360) > .4;
      }
      if (!active && !turning && Math.abs(s.rx) < .05 && Math.abs(s.ry) < .05) { s.rx = s.ry = 0; s.a = 0; el.style.rotate = ''; if (s.turn) el.style.backgroundImage = ''; s.turn = null; el.__spin = false; return; }
      paint(el, s); s.raf = requestAnimationFrame(step);
    })();
  }
  function persp(el) { var p = el.parentNode; if (p && p.style && !p.style.perspective) p.style.perspective = '1000px'; }
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var el = spinEl(e.target); if (!el || still) return;
    var s = S(el); persp(el); s.turn = turnOf(el);
    drag = { el: el, s: s, x0: e.clientX, y0: e.clientY, a0: s.a, moved: 0, pts: [[e.clientX, performance.now()]] };
    s.v = 0; document.documentElement.setAttribute('data-spun', '1'); loop(el, s);
  });
  document.addEventListener('pointermove', function (e) {
    if (drag) {
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0, s = drag.s; drag.moved = Math.max(drag.moved, Math.abs(dx));
      if (s.turn) s.a = drag.a0 + dx * .9; else { s.ty = clamp(dx * .35, 40); s.tx = clamp(-dy * .25, 14); }
      drag.pts.push([e.clientX, performance.now()]); if (drag.pts.length > 4) drag.pts.shift();
      return;
    }
    if (e.pointerType !== 'mouse' || still) return;
    var el = spinEl(e.target);
    if (!el) { hover = null; return; }
    var s = S(el), r = el.getBoundingClientRect(); persp(el); hover = { el: el };
    s.ty = clamp((e.clientX - r.left - r.width / 2) / (r.width / 2) * 14, 14); s.tx = clamp(-(e.clientY - r.top - r.height / 2) / (r.height / 2) * 7, 7); loop(el, s);
  });
  function release() {
    if (!drag) return; var d = drag, s = d.s; drag = null;
    if (s.turn) { var p = d.pts, v = 0; if (p.length > 1) { var f = p[0], l = p[p.length - 1]; v = (l[0] - f[0]) / Math.max(16, l[1] - f[1]) * .9 * 16; } if (d.moved < 6) v = 14; s.v = clamp(v, 26); }
    loop(d.el, s);
  }
  document.addEventListener('pointerup', release); document.addEventListener('pointercancel', release);
  // lần đầu thấy linh vật chính trên trang: lắc nhẹ (hoặc xoay 1 vòng nếu có bộ ảnh xoay) để khách biết kéo được
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (still) return;
      var first = null, list = document.querySelectorAll('#app [role="img"]'), i, el;
      for (i = 0; i < list.length && !first; i++) { el = spinEl(list[i]); if (el && !el.hasAttribute('data-spin')) first = el; }
      if (!first) return;
      function go() {
        var s = S(first); persp(first); s.turn = turnOf(first); s.hold = true;
        if (s.turn) { s.v = 14; } else { s.ty = 26; setTimeout(function () { s.ty = -18; }, 450); setTimeout(function () { s.ty = 0; }, 900); }
        setTimeout(function () { s.hold = false; }, 1100); loop(first, s);
      }
      function tryIt() {
        if (document.documentElement.hasAttribute('data-spun')) return true;
        var r = first.getBoundingClientRect(); if (r.top < innerHeight * .7 && r.bottom > innerHeight * .3) { go(); return true; }
        return false;
      }
      if (tryIt()) return;
      var h = function () { if (tryIt()) removeEventListener('scroll', h); };
      addEventListener('scroll', h, { passive: true });
    }, 900);
  });

  /* ---------- chuyển động nhỏ khi cuộn: thẻ và tiêu đề trượt nhẹ lên ---------- */
  function reveal() {
    if (still) return;
    var app = document.getElementById('app'); if (!app) return;
    var pending = [], timer = 0;
    function check() {
      timer = 0; var vh = innerHeight;
      pending = pending.filter(function (el) {
        if (!el.isConnected) return false;
        var r = el.getBoundingClientRect(); if (r.bottom < 0) { el.classList.remove('rv'); el.style.transitionDelay = ''; return false; } // đã cuộn qua: hiện luôn
        if (r.top > vh * .94) return true;
        el.classList.add('rv-in');
        setTimeout(function () { el.classList.remove('rv', 'rv-in'); el.style.transitionDelay = ''; }, 1100);
        return false;
      });
    }
    function soon() { if (!timer) timer = setTimeout(check, 80); }
    function scan(root) {
      var list = root.querySelectorAll('.card3d, h2, .rv-x'), n = 0, vh = innerHeight;
      Array.prototype.forEach.call(list, function (el) {
        if (el.classList.contains('rv') || el.closest('.rv') || el.__rvDone) return; el.__rvDone = true;
        var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top < vh * .92 || !r.height) return;
        var cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'absolute') return;
        el.style.transitionDelay = ((n++ % 4) * 70) + 'ms'; el.classList.add('rv'); pending.push(el);
      });
    }
    scan(app);
    addEventListener('scroll', soon, { passive: true }); addEventListener('resize', soon);
    setInterval(check, 500); // phòng khi trình duyệt không báo cuộn (cuộn bằng phím, kéo thanh cuộn)
    var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { scan(app); }, 250); }).observe(app, { childList: true, subtree: true });
  }
  window.addEventListener('load', function () { setTimeout(reveal, 400); });

  /* ---------- thanh menu ghim ở đầu màn hình khi cuộn xuống (cùng màu banner của trang) ---------- */
  var bar = null, barV = '';
  function heroRgb(app) { var s = app.querySelector('section'), m = s && /rgba?\(([^)]*)\)/.exec(getComputedStyle(s).backgroundImage || ''); return m ? m[1].split(',').slice(0, 3).join(',') : '47,107,255'; }
  function buildBar(app, v) {
    var logo = app.querySelector('img[alt="Lenna Board Game"]'); if (!logo) return null;
    var el = document.createElement('div'), h = '<a class="sb-logo" href="/" aria-label="Lenna Board Game, về trang chủ"><img src="' + esc(logo.getAttribute('src')) + '" alt="Lenna Board Game"></a>';
    el.className = 'sb';
    if (v === 'pc') {
      var links = app.querySelectorAll('.nav a'); if (!links.length) return null;
      h += '<nav class="nav glass sb-nav">' + Array.prototype.map.call(links, function (a) { return '<a href="' + esc(a.getAttribute('href')) + '"' + (a.hasAttribute('aria-current') ? ' aria-current="page"' : '') + ' style="' + esc(a.getAttribute('style') || '') + '">' + esc(a.textContent) + '</a>'; }).join('') + '</nav><a class="sb-cta" href="#dat-lich">Đặt lịch</a>';
    } else h += '<span class="sb-tag">Đi đâu giờ? Qua Lenna chơi!</span><button aria-label="Mở menu" class="btn glass sb-menu" type="button"><i></i><i></i><i></i></button>';
    el.innerHTML = h; return el;
  }
  function sticky() {
    var app = document.getElementById('app'); if (!app) return;
    var v = app.getAttribute('data-ssr') || 'm', show = (window.scrollY || document.documentElement.scrollTop) > 160;
    if (show && (!bar || barV !== v)) { if (bar) bar.remove(); bar = buildBar(app, v); barV = v; if (bar) document.body.appendChild(bar); }
    if (!bar) return;
    if (show) { bar.style.background = 'rgba(' + heroRgb(app) + ',.95)'; bar.classList.add('on'); } else bar.classList.remove('on');
  }
  addEventListener('scroll', sticky, { passive: true }); addEventListener('resize', sticky);

  /* ---------- phóng to video hướng dẫn ---------- */
  function fullVideo(btn) {
    var box = btn.parentElement;
    function tab(f) { window.open(f.src.replace('/preview', '/view'), '_blank', 'noopener'); }
    function go(f) { var rq = f.requestFullscreen || f.webkitRequestFullscreen; if (!rq) return tab(f); try { var r = rq.call(f); if (r && r.catch) r.catch(function () { tab(f); }); } catch (x) { tab(f); } }
    var f = box.querySelector('.vid-frame'); if (f) return go(f);
    var o = box.querySelector('.vid-open'); if (o) o.click();
    setTimeout(function () { var f2 = box.querySelector('.vid-frame'); if (f2) go(f2); }, 700);
  }

  /* ---------- bấm chuột ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'), t = e.target;
    if (t.closest && t.closest('[aria-label="Mở menu"]')) { e.preventDefault(); openMenu(); return; }
    if (t.closest && t.closest('[data-fs]')) { e.preventDefault(); fullVideo(t.closest('[data-fs]')); return; }
    if (a && a.getAttribute('data-share') === 'fb') { e.preventDefault(); window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(location.href.split('?')[0]), '_blank', 'noopener'); return; }
    if (a) {
      var h = a.getAttribute('href') || '';
      if (/^#dat-lich/.test(h)) { e.preventDefault(); openBook(); return; }
      if (/^tel:/.test(h)) track('click_hotline'); else if (/zalo/i.test(h)) track('click_zalo');
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (book && book.classList.contains('on')) hide(book); if (menu && menu.classList.contains('on')) hide(menu); } });
  if (/^#dat-lich/.test(location.hash)) window.addEventListener('load', function () { openBook(); });
})();
