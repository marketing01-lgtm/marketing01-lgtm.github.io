/* Chỗ bản thiết kế (vẽ trên canvas) cần chỉnh để chạy thật trên website. Mỗi bản vá là [chữ gốc, chữ thay]; không khớp thì dựng sẽ báo lỗi
   (để biết khi thiết kế đổi). tpl = phần giao diện, script = phần xử lý. */
module.exports = {
  tpl: {
    // thẻ chi tiết game: trên canvas thẻ mở cạnh game được bấm; ở website thật: điện thoại trượt lên từ đáy, máy tính mở giữa màn hình
    ThuVien: [['position: absolute; left: 6px; right: 6px; top: {{d.top}}; z-index: 41; max-height: 690px;', 'position: fixed; left: 6px; right: 6px; bottom: 6px; z-index: 41; max-height: 88vh;']],
    ThuVienPC: [['position: absolute; left: 50%; top: {{d.top}}; width: 860px; margin-left: -430px; z-index: 41; max-height: 720px;', 'position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(860px, 94vw); z-index: 41; max-height: 90vh;']]
  },
  script: {}
};
