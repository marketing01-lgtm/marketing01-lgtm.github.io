/* Trang bài viết blog. Bài đầu tiên dùng nguyên bản thiết kế (có nội dung đầy đủ). Các bài còn lại chưa có nội dung do bộ phận Content soạn,
   nên dựng từ cùng bản thiết kế nhưng thân bài chỉ có phần mở đầu, lời báo "đang hoàn thiện" và đường tới đặt lịch, nhắn Lenna và các bài khác (không bịa nội dung). */
const POSES = ['c-cool', 'c-capture', 'c-music', 'c-chef', 'c-cheerful', 'c-lovely', 'c-royal', 'c-serious'];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function placeholder(tpl, post, idx, related, mobile) {
  const sub = (re, to, what) => { if (!re.test(tpl)) throw new Error('Trang bài viết: không thấy ' + what); tpl = tpl.replace(re, to); };
  sub(/<span>Gợi ý<\/span>/, '<span>' + esc(post.cat) + '</span>', 'mục dẫn đường');
  sub(/(<span style="align-self: flex-start; font-size: 1\d+px;[^"]*">)Nhóm bạn(<\/span>)/, '$1' + esc(post.cat) + '$2', 'nhãn mục');
  sub(/(<h1[^>]*>)Ăn tối xong ở Thủ Đức đi đâu chơi\?(<\/h1>)/, '$1' + esc(post.t) + '$2', 'tiêu đề');
  sub(/5 phút đọc · 22\/10\/2026/, post.min + ' phút đọc', 'dòng thời lượng');
  // ảnh đầu bài của bản mẫu thuộc riêng bài mẫu: thay bằng khung có Chisu + sticker
  sub(/<img src="[^"]*" alt="Ăn xong đi đâu nhỉ\?[^"]*" style="[^"]*">/,
    '<div style="position: relative; width: 100%; aspect-ratio: 16 / ' + (mobile ? 9 : 7) + '; border-radius: ' + (mobile ? 22 : 30) + 'px; overflow: hidden; background: linear-gradient(135deg, #dfe9ff 0%, #fff3c4 100%)"><span class="stk ' + post.stk + '" aria-hidden="true" style="position: absolute; right: 8%; bottom: 14%; width: 24%; height: 62%"></span><div class="chi ' + POSES[idx % 8] + '" role="img" aria-label="Chisu" style="position: absolute; left: 10%; bottom: 0; width: 28%; height: 90%"></div></div>', 'ảnh đầu bài');
  // mục lục thuộc về bài mẫu
  tpl = tpl.replace(/<nav aria-label="Mục lục"[\s\S]*?<\/nav>/, '').replace(/<div class="card3d"[^>]*>\s*<button onClick="\{\{toggleToc\}\}"[\s\S]*?<\/sc-for>\s*<\/div>/, '');
  tpl = tpl.replace(/<section[^>]*>\s*<h2[^>]*>Bài liên quan<\/h2>[\s\S]*?<\/section>/, ''); // khối bài liên quan cố định của bản mẫu: đã có "Đọc thêm" riêng bên dưới
  const m = /<div class="prose"[^>]*>\s*(<p style="[^"]*">)/.exec(tpl); if (!m) throw new Error('Trang bài viết: không thấy thân bài');
  const open = tpl.indexOf('>', tpl.indexOf('<div class="prose"')) + 1, art = tpl.indexOf('</article>'), close = tpl.lastIndexOf('</div>', art);
  const pTag = m[1], btn = 'height: 48px; padding: 0 22px; border-radius: 999px; font-weight: 700; font-size: 15px; display: inline-flex; align-items: center; text-decoration: none;';
  const more = related.map(r => '<a href="/blog/' + r.slug + '/" class="card3d lift" style="background: #ffffff; border-radius: 18px; padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; text-decoration: none"><span style="font-size: 12px; font-weight: 700; color: #2f6bff">' + esc(r.cat) + '</span><strong style="font-size: 16px; line-height: 1.3; color: #173a8a">' + esc(r.t) + '</strong></a>').join('');
  const body = pTag + esc(post.ex) + '</p>' +
    '<div class="card3d" style="background: #fff4cf; border-radius: 22px; padding: 20px 22px; display: flex; flex-direction: column; gap: 10px"><strong style="font-family: \'Baloo 2\', sans-serif; font-size: 22px; color: #173a8a">Bài đầy đủ sắp lên sóng</strong>' +
    '<span style="font-size: 15px; line-height: 1.6; color: #4a5470">Lenna đang hoàn thiện bài này. Trong lúc chờ, anh chị cần chọn game, chọn phòng hay giữ chỗ cho nhóm thì cứ nhắn Lenna, bên mình tư vấn liền nha.</span>' +
    '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px"><a href="#dat-lich" class="btn gloss" style="' + btn + ' background-color: #ffc83d; color: #173a8a">Đặt lịch chơi ngay</a>' +
    '<sc-if value="{{cfg.has_messenger}}"><a href="{{cfg.link_messenger}}" target="_blank" rel="noopener" class="btn" style="' + btn + ' background: #ffffff; color: #173a8a; box-shadow: 0 6px 16px rgba(23,58,138,.12)">Nhắn Lenna</a></sc-if></div></div>' +
    '<strong style="margin-top: 10px; font-size: 14px; letter-spacing: .04em; color: #66718a">ĐỌC THÊM TRÊN BLOG</strong><div style="display: grid; grid-template-columns: ' + (mobile ? '1fr' : 'repeat(3, minmax(0, 1fr))') + '; gap: 12px">' + more + '</div>';
  return tpl.slice(0, open) + body + tpl.slice(close);
}
module.exports = { placeholder };
