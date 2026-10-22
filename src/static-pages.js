/* Các trang không có trong bản thiết kế: Cảm ơn (sau khi đặt lịch), Chính sách dữ liệu cá nhân, 404. Dùng màu, chữ, nút của bộ nhận diện. */
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

module.exports = function (cfg, ctx) {
  const nav = [['Phòng chơi', '/phong-choi'], ['Board game', '/board-game'], ['Menu', '/menu'], ['Ưu đãi', '/uu-dai'], ['Blog', '/blog'], ['Giới thiệu', '/gioi-thieu']];
  const header = '<div class="st"><header class="st-head"><a href="/"><img src="' + ctx.logo + '" alt="' + esc(cfg.ten_quan) + '"></a><nav>' + nav.map(n => '<a href="' + n[1] + '">' + n[0] + '</a>').join('') + '</nav></header>';
  const footer = '<footer class="st-foot">© ' + esc(cfg.ten_quan) + ' · Mở cửa ' + esc(cfg.gio_mo_cua) + ' · ' + esc(cfg.dia_chi_dong) + '</footer></div>';
  const fill = t => t.replace(/\{\{(\w+)\}\}/g, (_, k) => (cfg[k] != null && cfg[k] !== '') ? esc(cfg[k]) : '[ ]');
  const contact = [cfg.facebook_fanpage && '<a href="' + esc(cfg.facebook_fanpage) + '">fanpage Facebook</a>', cfg.hotline && 'hotline ' + esc(cfg.hotline), cfg.zalo && '<a href="' + esc(cfg.zalo) + '">Zalo</a>'].filter(Boolean).join(', ') || 'fanpage Facebook của Lenna Board Game';

  const thanks = {
    file: 'cam-on/index.html', path: '/cam-on', noindex: true,
    title: 'Lenna đã nhận lịch của anh chị | ' + cfg.ten_quan, desc: 'Lenna đã nhận lịch đặt phòng và sẽ nhắn anh chị liền.',
    body: header + '<main class="st-main"><div class="st-card" style="text-align:center"><img class="st-chisu" src="' + ctx.chisu + '" alt="Chisu ôm trái tim">' +
      '<h1>Dạ Lenna nhận lịch rồi ạ</h1><p>Quán nhắn anh chị liền nè. Lenna xác nhận trước giờ hẹn 1 tiếng và giữ phòng ' + esc(cfg.dat_lich_giu_phong_phut || 15) + ' phút cho anh chị. Không cần cọc.</p>' +
      '<p><a class="st-btn" href="/">Về trang chủ</a> <a class="st-btn" style="background:#fff;color:#173a8a;box-shadow:0 0 0 2px #d6e4ff inset" href="/board-game">Xem board game</a></p></div></main>' + footer
  };

  const policy = {
    file: 'chinh-sach-bao-mat/index.html', path: '/chinh-sach-bao-mat', sitemap: true,
    title: 'Chính sách bảo vệ dữ liệu cá nhân | ' + cfg.ten_quan, desc: 'Lenna Board Game thu thập, dùng và bảo vệ họ tên, số điện thoại của khách đặt lịch như thế nào.',
    body: header + '<main class="st-main"><div class="st-card"><h1>Chính sách bảo vệ dữ liệu cá nhân</h1>' +
      '<p>Cập nhật ngày 22/10/2026. Chính sách này nói rõ Lenna thu gì, dùng vào việc gì và anh chị làm được gì với dữ liệu của mình, theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</p>' +
      fill('<h2>1. Ai thu thập dữ liệu</h2><p>{{ten_quan}}, website {{ten_mien}}. Tên hộ kinh doanh: {{ten_ho_kinh_doanh}}. Mã số thuế: {{ma_so_thue}}. Địa chỉ: {{dia_chi_dong}}.</p>') +
      '<h2>2. Lenna thu thập những gì</h2><ul><li>Khi anh chị đặt lịch trên website: họ tên, số điện thoại có Zalo, ngày giờ đến, số người, kiểu phòng, ưu đãi muốn dùng, kênh biết đến Lenna và ghi chú anh chị tự nhập.</li><li>Dữ liệu kỹ thuật khi xem website (loại thiết bị, trang đã xem) qua công cụ thống kê, chỉ khi quán bật công cụ đó.</li></ul>' +
      '<h2>3. Dùng vào việc gì</h2><ul><li>Nhắn hoặc gọi xác nhận lịch, nhắc lịch trước giờ hẹn và giữ phòng cho anh chị.</li><li>Chăm sóc sau khi anh chị đến chơi, nếu anh chị đồng ý nhận tin.</li><li>Thống kê nội bộ để cải thiện dịch vụ.</li></ul><p>Lenna không bán dữ liệu của anh chị.</p>' +
      '<h2>4. Lưu ở đâu, ai xem được</h2><p>Dữ liệu đặt lịch được ghi vào bảng tính nội bộ của quán trên Google Workspace. Chỉ nhân viên và quản lý của Lenna được phân quyền mới xem được. Lenna dùng Google (lưu trữ) và Zalo (nhắn tin xác nhận) làm bên cung cấp dịch vụ. Báo cáo nội bộ chỉ ghi 3 số cuối của số điện thoại.</p>' +
      '<h2>5. Thời gian lưu</h2><p>Lenna chỉ giữ dữ liệu trong thời gian cần thiết cho các mục đích ở mục 3, hoặc đến khi anh chị yêu cầu xóa.</p>' +
      '<h2>6. Quyền của anh chị</h2><p>Anh chị có quyền biết, xem, sửa, rút lại đồng ý và yêu cầu xóa dữ liệu của mình. Liên hệ Lenna qua ' + contact + ', Lenna xử lý trong thời gian sớm nhất.</p>' +
      '<h2>7. Khách dưới 16 tuổi</h2><p>Bạn dưới 16 tuổi cần có cha mẹ hoặc người giám hộ đồng ý trước khi gửi thông tin cho Lenna.</p>' +
      '<h2>8. Cookie và đo lường</h2><p>Website có thể dùng Google Analytics, Meta Pixel và TikTok Pixel để biết có bao nhiêu người xem và bấm đặt lịch. Anh chị có thể tắt cookie trong trình duyệt của mình.</p>' +
      '<h2>9. Thay đổi chính sách</h2><p>Khi chính sách đổi, Lenna cập nhật ngày ở đầu trang này.</p></div></main>' + footer
  };

  const nf = {
    file: '404.html', path: '/404', noindex: true,
    title: 'Không tìm thấy trang | ' + cfg.ten_quan, desc: 'Trang này không có.',
    body: header + '<main class="st-main"><div class="st-card" style="text-align:center"><img class="st-chisu" src="' + ctx.chisu + '" alt="Chisu">' +
      '<h1>Chisu tìm hoài không thấy trang này</h1><p>Anh chị thử về trang chủ hoặc xem board game giúp Lenna nha.</p><p><a class="st-btn" href="/">Về trang chủ</a></p></div></main>' + footer
  };
  return [thanks, policy, nf];
};
