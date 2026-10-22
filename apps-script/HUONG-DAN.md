# Cài "Lenna – Website API" (đặt lịch ghi vào Sheet + báo Zalo)

Làm 1 lần, khoảng 10 phút, bằng tài khoản **marketing01@lennaboardgame.com** (chủ file Marketing).

## 1. Dán mã
1. Mở file **Lenna Board Game – Marketing** → menu **Tiện ích mở rộng › Apps Script**.
2. Xóa hết mã mẫu trong tệp `Code.gs`, dán toàn bộ nội dung file `Code.gs` ở thư mục này (trên GitHub: mở file, bấm **Copy raw file**).
3. Bấm biểu tượng bánh răng (**Cài đặt dự án**): tích **Hiển thị tệp kê khai "appsscript.json"**, rồi mở tệp `appsscript.json` ở bên trái, dán nội dung file `appsscript.json` cùng thư mục (đặt múi giờ Việt Nam và quyền truy cập). Bấm Lưu.
4. Đổi tên dự án thành **Lenna – Website API**.

## 2. Báo Zalo (khóa nằm ở Cài đặt dự án, không ghi trong mã)
1. Tạo Zalo Bot (cùng cách với bot "Lenna Quản lý" của webapp Quản lý: Zalo Bot Manager) hoặc dùng lại bot đó, lấy **Bot Token**.
2. Mở Zalo, tìm bot, nhắn "xin chào" (người nào muốn nhận tin đặt lịch thì tự nhắn cho bot).
3. Ở **Cài đặt dự án › Thuộc tính tập lệnh**, thêm:
   - `ZALO_BOT_TOKEN` = Bot Token
   - `ZALO_CHAT_IDS` = (làm bước 4 để biết) các chat_id, cách nhau dấu phẩy
4. Trong trình soạn mã, chọn hàm **zaloLayChatId** rồi bấm **Chạy**. Mở **Nhật ký thực thi** để thấy chat_id của từng người đã nhắn cho bot, rồi dán vào `ZALO_CHAT_IDS`.
5. Chọn hàm **zaloThu** bấm Chạy: mọi người trong danh sách nhận tin "Tin thử".

## 3. Triển khai
1. **Triển khai › Triển khai mới** → loại **Ứng dụng web**.
2. Thực thi bằng: **Tôi**. Ai có quyền truy cập: **Bất kỳ ai**. Bấm Triển khai, cấp quyền khi Google hỏi (đọc/ghi Sheet, gọi dịch vụ bên ngoài).
3. Chép **URL ứng dụng web** (dạng https://script.google.com/macros/s/…/exec).
4. Dán URL vào tab **Web – Cấu hình**, dòng `dat_lich_api`, cột Giá trị. Báo Claude để cập nhật website.

## 4. Thử
- Chạy hàm **kiemTra**: tab **Theo dõi đặt lịch** có thêm 1 dòng "THỬ – xóa dòng này" và Zalo báo tin. Xóa dòng thử bằng tay.
- Sau khi website nhận link, đặt thử 1 lịch trên website.

## Ghi chú
- Mỗi lần sửa mã: Triển khai › Quản lý các bản triển khai › bút chì › Phiên bản mới › Triển khai (link giữ nguyên).
- Tin Zalo chỉ ghi 3 số cuối SĐT (đúng quy tắc tab Theo dõi đặt lịch).
- Mỗi số điện thoại đặt tối đa 3 lần/giờ, cả website tối đa 80 lần/giờ (chống gửi rác).
- Cột Nguồn ghi `Website · #FB` ... theo ô "biết Lenna qua đâu" khách chọn; khách bỏ qua thì chỉ ghi `Website`.
