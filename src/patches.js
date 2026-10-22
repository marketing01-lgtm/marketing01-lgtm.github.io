/* Chỗ bản thiết kế (vẽ trên canvas) cần chỉnh để chạy thật trên website. Mỗi bản vá là [chữ gốc hoặc RegExp, chữ thay hoặc hàm]; không khớp thì dựng sẽ báo lỗi
   (để biết khi thiết kế đổi). tpl = phần giao diện, script = phần xử lý. Chú ý: ảnh trong giao diện đã đổi thành /assets/<id>.webp trước khi vá. */
const fs = require('fs'), path = require('path');
const VIDEO = (() => { try { return Object.fromEntries(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/games-video.json'), 'utf8')).filter(g => g.video && g.hien !== false).map(g => [g.id, g.video])); } catch (e) { return {}; } })();

/* tên bài viết -> đường dẫn không dấu (dùng cả ở trang Blog lẫn lúc dựng trang bài viết) */
const slugify = s => String(s).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

/* hình thang bo góc: clip-path polygon không bo được, nên đổi sang path() có cung tròn ở 4 góc (kích thước ô cố định) */
function roundedPath(pts, r) {
  const n = pts.length, f = v => +v.toFixed(2);
  let d = '';
  pts.forEach((p, i) => {
    const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], va = [a[0] - p[0], a[1] - p[1]], vb = [b[0] - p[0], b[1] - p[1]], la = Math.hypot(...va), lb = Math.hypot(...vb), s = Math.min(r, la / 2, lb / 2);
    const p1 = [p[0] + va[0] / la * s, p[1] + va[1] / la * s], p2 = [p[0] + vb[0] / lb * s, p[1] + vb[1] / lb * s];
    d += (i ? 'L' : 'M') + f(p1[0]) + ' ' + f(p1[1]) + 'Q' + f(p[0]) + ' ' + f(p[1]) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
  });
  return d + 'Z';
}
const monRound = (w, h, s, r) => [/clip-path: polygon\((?:[^()]|\([^()]*\))*\)/g, m => {
  const pts = m.includes('calc(100% - ' + s + 'px) 100%') ? [[0, 0], [w, 0], [w - s, h], [0, h]]
    : m.includes('calc(100% - ' + s + 'px) 0') ? [[0, 0], [w - s, 0], [w, h], [0, h]]
    : m.includes('polygon(' + s + 'px 0') ? [[s, 0], [w, 0], [w, h], [0, h]] : [[0, 0], [w, 0], [w, h], [s, h]];
  return "clip-path: path('" + roundedPath(pts, r) + "')";
}];

/* nhãn tên món + giá trên dải hình thang: cao bằng nhau, tên cắt gọn 2 dòng */
const monLabel = h => [/(<div class="glass" style="position: absolute; left: \d+px; right: \d+px; bottom: 12px; background: rgba\(255,255,255,\.78\); border-radius: 14px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px)(">)<strong style="([^"]*)">/g, '$1; height: ' + h + 'px; box-sizing: border-box; justify-content: space-between$2<strong class="clamp2" style="$3">'];

/* Cuộc thi review: mỗi giải có 1 Chisu 3D đứng trên bục (cùng kiểu 3D, cùng bộ 8 tư thế) */
const PODIUM = {
  'nhì': ['c-cool', 'Chisu đeo kính nhận giải nhì', 0],
  'nhất': ['c-royal', 'Chisu vua nhận giải nhất', .5],
  'ba': ['c-cheerful', 'Chisu vẫy chào nhận giải ba', 1]
};
const podium = (sz, top) => [
  [/<div style="position: relative; height: \d+px">[\s\S]*?aria-label="Chisu quay video review"[^>]*><\/div>\s*<\/div>\s*(<div style="display: flex; gap: \d+px; align-items: flex-end)">/, '$1; padding-top: ' + top + 'px">'],
  [/(<div class="(?:clay gloss)?" style=")(flex: 1; height: \d+px;[^"]*">)(\s*<span[^>]*>Giải (nhì|nhất|ba)<\/span>)/g, (m, a, b, c, who) => {
    const [pose, label, delay] = PODIUM[who], [w, h] = sz[who];
    return a + 'position: relative; min-width: 0; ' + b + '<span class="chi ' + pose + ' float" role="img" aria-label="' + label + '" style="position: absolute; left: 50%; bottom: calc(100% - 12px); width: ' + w + 'px; height: ' + h + 'px; margin-left: -' + w / 2 + 'px; animation-delay: ' + delay + 's; filter: drop-shadow(0 12px 12px rgba(0,0,0,.25))"></span>' + c;
  }]
];
/* bỏ khối "Tuần đầu khai trương – tặng 5 xu" (chưa chốt) cùng đường nối phía sau nó */
const bo5xu = [/<section[^>]*>(?:(?!<\/section>)[\s\S])*?TUẦN ĐẦU KHAI TRƯƠNG[\s\S]*?<\/section>\s*(?:<div[^>]*height: \d+px[^>]*>[\s\S]*?<\/span>\s*<\/div>\s*)?/, ''];

/* Giới thiệu: sứ mệnh, 4 giá trị cốt lõi (anh Ân chốt 22/10/2026: Vị trí thuận tiện, Cơ sở vật chất, Trải nghiệm khách hàng, Board game xịn xò), bỏ nút "Xem thêm" */
const gioiThieu = [
  ['Cho mỗi nhóm bạn một chỗ để gặp nhau, chơi cùng nhau và cười thật nhiều, không ai phải ngồi lướt điện thoại một mình.', 'Mang lại niềm vui, trải nghiệm mới và sự gắn kết, để mỗi lần đến Lenna là một kỷ niệm đáng nhớ của khách hàng.'],
  [/class="stk s-vuitim"( aria-hidden="true" style="position: absolute; left: \d+px; top: -\d+px[^"]*"><\/span>\s*<strong[^>]*>)Vui vẻ/, 'class="stk s-balo"$1Vị trí thuận tiện'],
  ["Anh chị đến là để cười, thắng thua gì cũng vui.", "Gần cung đường ăn uống, ăn tối xong là qua Lenna chơi tiếp, khỏi đi xa."],
  [/class="stk s-capdoi"( aria-hidden="true" style="position: absolute; left: \d+px; top: -\d+px[^"]*"><\/span>\s*<strong[^>]*>)Gắn kết/, 'class="stk s-caphe"$1Cơ sở vật chất'],
  ["Anh chị với hội bạn có thêm kỷ niệm sau mỗi ván.", "Không gian kiểu Hàn hiện đại, máy lạnh mát, gối tựa êm, mền sạch, bàn có lỗ để ly."],
  [/class="stk s-docsach"( aria-hidden="true" style="position: absolute; left: \d+px; top: -\d+px[^"]*"><\/span>\s*<strong[^>]*>)Tận tình/, 'class="stk s-vuitim"$1Trải nghiệm khách hàng'],
  ["Chỉ luật tới khi anh chị chơi được mới thôi.", "Chisu dạy luật từng game, nhân viên phục vụ theo 5C: chủ động, cười, chào, chăm sóc, cảm ơn."],
  [/class="stk s-batngo"( aria-hidden="true" style="position: absolute; left: \d+px; top: -\d+px[^"]*"><\/span>\s*<strong[^>]*>)Thoải mái/, 'class="stk s-choigame"$1Board game xịn xò'],
  ["Vé tính theo người, anh chị ngồi bao lâu cũng được.", "Hơn 100 board game mới, chính hãng, Việt hóa, game nào cũng có video Chisu hướng dẫn."],
  ['>Giá trị cốt lõi</strong>', '>Giá trị cốt lõi: vì sao anh chị chọn Lenna</strong>'],
  [/<a href="[^"]*" (class="gt-svc[^"]*"[^>]*>)([\s\S]*?)<\/a>/g, '<div $1$2</div>'],
  [/\s*<span[^>]*>Xem thêm →<\/span>/g, '']
];

/* Chisu chọn dùm: khung kết quả cao cố định 112px ở cả 3 trạng thái (chờ, đang lắc, đã chọn) nên không giật to nhỏ khi tên game đổi */
const heroSame = [
  ['<div style="position: relative; flex: 0 1 520px; height: 470px">', '<div style="position: relative; flex: 0 1 500px; height: 480px">'],
  ['bottom: 28px; width: 220px; height: 36px', 'bottom: 22px; width: 220px; height: 36px']
];
const pickSlot = [
  [/(<div style="border: 2px dashed rgba\(91,63,196,\.35\); border-radius: 22px;)/, '$1 height: 112px; box-sizing: border-box;'],
  [/(<div aria-live="polite" style="background: #ffffff; border-radius: 22px; )padding: 18px; (font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: \d+px;)/, '$1height: 112px; box-sizing: border-box; padding: 0 18px; display: flex; align-items: center; justify-content: center; overflow: hidden; line-height: 1.15; $2'],
  [/(<div class="pop" aria-live="polite" style="position: relative; background: #ffffff; border-radius: 22px; )padding: 12px;/, '$1height: 112px; box-sizing: border-box; padding: 12px;']
];

/* Khung video hướng dẫn trong thẻ game: bấm để phát video thật (Drive /preview), có đường mở tab mới */
const videoBox = [
  ['<div role="img" aria-label="Video Chisu hướng dẫn, sắp có" style="', '<div aria-label="Video Chisu hướng dẫn" style="'],
  // video của Lenna quay dọc: khung dọc 9:16, Chisu vui vẻ (không còn mặt cau có), có nút phóng to
  ['position: relative; aspect-ratio: 16 / 9; border-radius: 20px;', 'position: relative; flex: none; height: min(46vh, 410px); max-width: 100%; aspect-ratio: 9 / 16; margin: 0 auto; border-radius: 20px;'],
  [/<div class="chi c-serious" aria-hidden="true" style="[^"]*"><\/div>/, '<div class="chi c-cheerful" aria-hidden="true" style="position: absolute; left: 50%; bottom: -2px; width: 86%; height: 44%; margin-left: -43%; filter: drop-shadow(0 10px 12px rgba(0,0,0,.25))"></div>'],
  ['left: 50%; top: 50%; width: 58px;', 'left: 50%; top: 36%; width: 58px;'],
  [/<div style="position: absolute; left: 14px; bottom: 12px; color: #ffffff; display: flex; flex-direction: column; gap: 2px">/, '<div style="position: absolute; left: 0; right: 0; top: 60px; color: #ffffff; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; padding: 0 14px">'],
  ['<div aria-hidden="true" style="position: absolute; right: -30px; top: -30px;', '<sc-if value="{{d.hasVid}}"><button type="button" class="vid-fs" data-fs aria-label="Phóng to video toàn màn hình" title="Phóng to toàn màn hình"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"></path></svg></button></sc-if><sc-if value="{{d.hasVid}}"><button type="button" class="vid-open" aria-label="Phát video Chisu hướng dẫn {{d.name}}" onClick="{{d.play}}"></button></sc-if><sc-if value="{{d.playing}}"><iframe class="vid-frame" src="{{d.vsrc}}" title="Video hướng dẫn {{d.name}}" allow="autoplay; fullscreen; picture-in-picture"></iframe></sc-if><div aria-hidden="true" style="position: absolute; right: -30px; top: -30px;'],
  ['Mở trong phòng bằng mã QR', 'Bấm để xem video hướng dẫn'],
  ['<span aria-hidden="true" class="glass" style="position: absolute; left: 50%; top: 36%;', '<span aria-hidden="true" class="glass" style="z-index: 3; position: absolute; left: 50%; top: 36%;']
];
const videoLink = '<sc-if value="{{d.playing}}"><a class="vid-alt" href="{{d.vlink}}" target="_blank" rel="noopener">Không xem được? Mở video ở tab mới ↗</a></sc-if>';
const videoScript = [
  ['this.setState({ sel: id, top });', 'this.setState({ sel: id, top, play: null });'],
  ['  detail(id) {', '  detail(id) {\n    const VID = ' + JSON.stringify(VIDEO) + ';'],
  ["close: () => this.setState({ sel: null }) });", "close: () => this.setState({ sel: null, play: null }), hasVid: !!VID[id], playing: this.state.play === id && !!VID[id], play: () => this.setState({ play: id }), vsrc: VID[id] ? 'https://drive.google.com/file/d/' + VID[id] + '/preview' : '', vlink: VID[id] ? 'https://drive.google.com/file/d/' + VID[id] + '/view' : '' });"]
];

/* Bài viết: thẻ game/phòng nhắc trong bài mở đúng trang, nút chia sẻ Facebook chạy thật (link do site.js ghép), bỏ nút Zalo trùng nút Zalo của quán */
const baiViet = [
  // thẻ "Bài liên quan": mở đúng bài theo tên bài
  [/<a href="#" class="card3d( lift)?"([^>]*)>((?:(?!<\/a>)[\s\S])*?<strong class="clamp2"[^>]*>([^<]+)<\/strong>(?:(?!<\/a>)[\s\S])*?)<\/a>/g, (m, lift, at, inner, title) => '<a href="/blog/' + slugify(title) + '/" class="card3d' + (lift || '') + '"' + at + '>' + inner + '</a>'],
  [/<a href="#" class="card3d( lift)?"([^>]*)>(\s*<div class="cover cv-)/g, '<a href="/board-game/" class="card3d$1"$2>$3'],
  [/<a href="#" class="card3d( lift)?"([^>]*)>(\s*<div class="cover b-leu" role="img" aria-label="Phòng lều")/, '<a href="/phong-choi/" class="card3d$1"$2>$3'],
  [/<a href="#" class="btn card3d"([^>]*)>(<svg[^>]*>[\s\S]*?<\/svg>)Facebook<\/a>/, '<a href="https://www.facebook.com/sharer/sharer.php" data-share="fb" target="_blank" rel="noopener" class="btn card3d"$1>$2Facebook</a>'],
  [/<sc-if value="\{\{cfg\.has_zalo\}\}"><a [^>]*class="btn card3d"[^>]*><span[^>]*>Zalo<\/span>Zalo<\/a><\/sc-if>/, '']
];

/* Blog: bấm vào bài mở trang bài viết riêng (/blog/<tên-bài>/) */
const blogScript = [
  ['mins: p.min + \' phút đọc\' })', 'mins: p.min + \' phút đọc\', href: \'/blog/\' + (' + slugify.toString() + ')(p.t) + \'/\' })']
];
const blogTpl = [[/<a href="#" class="card3d( lift)?"/g, '<a href="{{p.href}}" class="card3d$1"']];

module.exports = {
  slugify,
  tpl: {
    // trang chủ: thu nhỏ khung ảnh để cả khung hình nằm gọn trong màn hình laptop (cao theo màn hình, tối đa 560px)
    Desktop: [
      ['min-height: 840px; overflow: hidden;', 'min-height: 0; overflow: hidden;'],
      ['box-shadow: 0 30px 60px rgba(23,58,138,.16); padding: 0 40px 60px">', 'box-shadow: 0 30px 60px rgba(23,58,138,.16); padding: 0 40px 34px">'],
      ['<div style="position: relative; z-index: 3; max-width: 1240px; margin: 0 auto; padding-top: 150px; display: flex; flex-wrap: wrap; align-items: flex-end;', '<div class="hero-row" style="position: relative; z-index: 3; max-width: 1240px; margin: 0 auto; padding-top: 92px; display: flex; flex-wrap: nowrap; align-items: flex-end;'],
      ['<div style="flex: 1 1 300px; max-width: 340px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px">', '<div style="flex: 1 1 0; min-width: 0; max-width: 460px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px">'],
      ['font-size: 46px; line-height: 1; color: #173a8a; width: 418px">{{k.line}}</h1>', 'font-size: clamp(32px, 3.2vw, 46px); line-height: 1.04; color: #173a8a">{{k.line}}</h1>'],
      ['<div style="position: relative; flex: 0 1 540px; height: 600px">', '<div style="position: relative; flex: 0 1 480px; min-width: 380px; height: clamp(380px, calc(100vh - 250px), 560px)">'],
      ['<div style="flex: 1 1 280px; max-width: 320px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px">', '<div style="flex: 0 0 270px; display: flex; flex-direction: column; gap: 16px; padding-bottom: 30px">']
    ],
    // thẻ chi tiết game: trên canvas thẻ mở cạnh game được bấm; ở website thật: điện thoại trượt lên từ đáy, máy tính mở giữa màn hình
    ThuVien: [
      ...pickSlot,
      ['position: absolute; left: 6px; right: 6px; top: {{d.top}}; z-index: 41; max-height: 690px;', 'position: fixed; left: 6px; right: 6px; bottom: 6px; z-index: 41; max-height: 88vh;'],
      [/<img class="hero-tv-img" src="[^"]*" alt="[^"]*" style="[^"]*">/, '<div role="img" aria-label="Chisu Chiến Binh cầm kiếm và khiên đứng trên bệ" style="position: absolute; left: 50%; top: 122px; width: 320px; height: 338px; margin-left: -160px; z-index: 2"><div class="chi" style="position: absolute; inset: 0; background-image: url(/assets/e0f8bdca5297c8db1d8c6017c3c649eb.webp); filter: drop-shadow(0 18px 18px rgba(40,30,20,.18))"></div><div class="plate" style="position: absolute; left: 50%; bottom: 14px; width: 150px; height: 24px; margin-left: -75px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; padding: 0 7px; box-sizing: border-box"><span style="width: 7px; height: 7px; border-radius: 999px; background: radial-gradient(circle at 35% 35%, #ffffff, #8c96a6)"></span><span style="font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 13px; color: #4a3a2c; white-space: nowrap">Chisu Chiến Binh</span><span style="width: 7px; height: 7px; border-radius: 999px; background: radial-gradient(circle at 35% 35%, #ffffff, #8c96a6)"></span></div></div>'],
      ...videoBox, ['<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #2b3a5c">{{d.mt}}</p>', videoLink + '<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #2b3a5c">{{d.mt}}</p>']
    ],
    ThuVienPC: [
      ...pickSlot,
      ['position: absolute; left: 50%; top: {{d.top}}; width: 860px; margin-left: -430px; z-index: 41; max-height: 720px;', 'position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(860px, 94vw); z-index: 41; max-height: 90vh;'],
      // banner Board game: ảnh Chisu Chiến Binh thu nhỏ cho bằng linh vật các trang khác (cao khoảng 450px), nền tím liền với ảnh
      [/<section style="position: relative; min-height: 880px; overflow: hidden; border-radius: 0 0 44px 44px; background: #cdb8f2 url\([^)]*\) center top \/ cover no-repeat;/, '<section style="position: relative; min-height: 640px; overflow: hidden; border-radius: 0 0 44px 44px; background: linear-gradient(180deg, #c2a9ef 0%, #d0bef0 55%, #f5ecfa 100%);'],
      [/<span role="img" aria-label="Chisu Chiến Binh[^"]*" style="[^"]*"><\/span>/, '<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 104px; z-index: 1; text-align: center; font-family: \'Baloo 2\', sans-serif; font-weight: 800; font-size: clamp(110px, 13.5vw, 200px); line-height: .86; letter-spacing: -.01em; color: rgba(255,255,255,.62); transform: skewX(-7deg); text-shadow: 0 10px 40px rgba(255,255,255,.35); white-space: nowrap">BOARD GAME</div><div aria-hidden="true" style="position: absolute; right: max(60px, calc((100vw - 1240px) / 2 + 60px)); bottom: 34px; width: 460px; height: 44px; z-index: 1; border-radius: 999px; background: radial-gradient(closest-side, rgba(40,30,20,.28), rgba(40,30,20,0))"></div><div role="img" aria-label="Chisu Chiến Binh cầm kiếm và khiên đứng trên bệ" style="position: absolute; right: max(40px, calc((100vw - 1240px) / 2 + 40px)); bottom: 40px; width: 500px; height: 464px; z-index: 2"><div class="chi" style="position: absolute; inset: 0; background-image: url(/assets/e0f8bdca5297c8db1d8c6017c3c649eb.webp); filter: drop-shadow(0 26px 24px rgba(40,30,20,.2))"></div><div class="plate" style="position: absolute; left: 50%; bottom: 22px; width: 220px; height: 36px; margin-left: -110px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; box-sizing: border-box"><span style="width: 10px; height: 10px; border-radius: 999px; background: radial-gradient(circle at 35% 35%, #ffffff, #8c96a6)"></span><span style="font-family: \'Baloo 2\', sans-serif; font-weight: 700; font-size: 19px; color: #4a3a2c; white-space: nowrap">Chisu Chiến Binh</span><span style="width: 10px; height: 10px; border-radius: 999px; background: radial-gradient(circle at 35% 35%, #ffffff, #8c96a6)"></span></div></div>'],
      ['max-width: 1240px; margin: 0 auto; padding-top: 262px">', 'max-width: 1240px; margin: 0 auto; padding-top: 110px">'],
      ...videoBox, ['<div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px">', videoLink + '<div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px">']
    ],
    Menu: [monRound(166, 232, 30, 18), monLabel(64), ['padding: 6px 22px 16px">', 'padding: 18px 22px 20px">']],
    MenuPC: [
      monRound(250, 330, 44, 26), monLabel(78),
      ['gap: 16px; overflow-x: auto; padding: 8px 0 22px">', 'gap: 16px; overflow-x: auto; padding: 24px 10px 28px">'],
      // lưới món: ô cao bằng nhau, tên món cắt gọn 2 dòng
      [/(grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); gap: 14px)(">\s*<sc-for list="\{\{items\}\}")/, '$1; grid-auto-rows: 1fr$2'],
      ['<div class="card3d lift" style="background: #ffffff; border-radius: 22px; padding: 16px; display: flex; gap: 14px; align-items: center">', '<div class="card3d lift" style="background: #ffffff; border-radius: 22px; padding: 14px 16px; display: flex; gap: 14px; align-items: center; box-sizing: border-box; min-height: 92px">'],
      ['<strong style="font-size: 16px; line-height: 1.3; color: #173a8a">{{it.name}}</strong>', '<strong class="clamp2" style="font-size: 16px; line-height: 1.3; color: #173a8a">{{it.name}}</strong>']
    ],
    // điện thoại: số tiền giải thưởng nhỏ lại để giải ba không tràn ra ngoài khung
    UuDai: [bo5xu, ...podium({ 'nhì': [84, 98], 'nhất': [106, 124], 'ba': [76, 90] }, 104), [/font-size: 19px; line-height: 1">(\d\.000\.000đ)/g, 'font-size: 15px; line-height: 1; white-space: nowrap">$1']],
    UuDaiPC: [bo5xu, ...podium({ 'nhì': [124, 146], 'nhất': [160, 184], 'ba': [116, 136] }, 150)],
    // Giới thiệu: 4 giá trị mỗi hàng 1 dòng tiêu đề (PC lưới 2x2, điện thoại 1 cột); banner dùng cùng kiểu bệ + bảng tên như các trang khác
    GioiThieu: [...gioiThieu,
      ['grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 10px; padding-top: 14px', 'grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 40px; padding-top: 30px'],
      [/(<strong style="font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 19px; line-height: 1.1; color: #[0-9a-f]{6}")>(Vị trí thuận tiện|Cơ sở vật chất|Trải nghiệm khách hàng|Board game xịn xò)</g, '$1 white-space: nowrap;">$2<'.replace(' white-space: nowrap;">','; white-space: nowrap">')],
      [/<img src="\/assets\/a254d224[^"]*" alt="Chisu đội mũ len đỏ trượt ván" class="float" style="[^"]*">/, '<img data-spin="tilt" src="/assets/f7445975cb60257728e50ac8fa150013.webp" alt="Chisu đội mũ len đỏ trượt ván" class="float" style="position: absolute; left: 50%; top: 132px; width: 290px; height: auto; margin-left: -145px; filter: drop-shadow(0 16px 16px rgba(15,77,58,.22))">'],
    ],
    GioiThieuPC: [...gioiThieu,
      ['isolation: isolate; min-height: 800px; overflow: hidden;', 'isolation: isolate; min-height: 620px; overflow: hidden;'],
      ['box-shadow: 0 30px 60px rgba(15,77,58,.16); padding: 0 40px 60px">', 'box-shadow: 0 30px 60px rgba(15,77,58,.16); padding: 0 40px 40px">'],
      ['max-width: 1240px; margin: 0 auto; padding-top: 150px; display: flex; flex-wrap: wrap; align-items: center;', 'max-width: 1240px; margin: 0 auto; padding-top: 70px; display: flex; flex-wrap: wrap; align-items: center;'],
      ['grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; padding-top: 20px', 'grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 56px 24px; padding-top: 52px'],
      [/(<strong style="font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 26px; line-height: 1.1; color: #[0-9a-f]{6}")>(Vị trí thuận tiện|Cơ sở vật chất|Trải nghiệm khách hàng|Board game xịn xò)</g, '$1 white-space: nowrap;">$2<'.replace(' white-space: nowrap;">','; white-space: nowrap">')],
      ['<div style="flex: 0 1 600px; position: relative; height: 560px">', '<div style="flex: 0 1 500px; position: relative; height: 480px">'],
      ['left: 70px; bottom: 6px; width: 440px; height: 46px;', 'left: 50%; bottom: 4px; width: 400px; height: 44px; margin-left: -200px;'],
      [/<img src="\/assets\/a254d224[^"]*" alt="Chisu đội mũ len đỏ trượt ván" class="float" style="[^"]*">/, '<img data-spin="tilt" src="/assets/f7445975cb60257728e50ac8fa150013.webp" alt="Chisu đội mũ len đỏ trượt ván" class="float" style="position: absolute; left: 50%; bottom: 14px; width: 440px; height: auto; margin-left: -220px; filter: drop-shadow(0 24px 24px rgba(15,77,58,.24))">']
    ],
    Blog: blogTpl,
    BlogPC: [...blogTpl, ...heroSame],
    PhongChoiPC: heroSame,
    BaiViet: baiViet,
    BaiVietPC: baiViet
  },
  script: {
    ThuVien: videoScript,
    ThuVienPC: videoScript,
    Blog: blogScript,
    BlogPC: blogScript
  }
};
