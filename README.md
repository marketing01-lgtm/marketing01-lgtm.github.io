# Website Lenna Board Game (lennaboardgame.com)

Dựng từ bản thiết kế trên canvas: https://claude.ai/artifact/HjVqYVsKy3w7thCCVb9wxS (file mô tả `MoTa` trên canvas là yêu cầu gốc, đọc trước).

## Cách hoạt động
- `src/pages/*.dc.html`: các bảng thiết kế chép từ canvas (mỗi trang một bản điện thoại, một bản máy tính). Đây là nguồn của giao diện, sửa bố cục thì sửa ở thiết kế rồi chép lại.
- `src/pages.json`: danh sách trang, đường dẫn, tiêu đề và mô tả cho Google.
- `src/dc-lite.js`: bộ chạy mẫu thiết kế (vòng lặp, điều kiện, nút bấm); dùng ở Node để dựng sẵn HTML và ở trình duyệt để gắn tương tác.
- `src/build.js`: dựng ra `dist/` (HTML tĩnh, ảnh, sitemap, robots). Bản điện thoại được dựng sẵn trong HTML (để Google, Facebook, Zalo đọc được chữ); từ 900px trở lên trình duyệt chuyển sang bản máy tính.
- `data/site.json`: dữ liệu dùng chung (từ tab **Web – Cấu hình** trong file Marketing). Sau này tạo tự động từ Google Sheet.
- `assets-src/`: 157 ảnh tải từ canvas (xem `MANIFEST.tsv`). Build chỉ chép ảnh trang đang dùng vào `dist/assets/`.

## Chạy thử
```bash
node src/build.js          # dựng website vào dist/
node tools/serve.js 8880   # xem thử ở http://localhost:8880/
```
Cần Node.js (không cài vào máy: tải bản nén từ nodejs.org rồi chạy trực tiếp).

## Dữ liệu nội dung (Google Sheet)
Tất cả nội dung website nằm trong file **Lenna Board Game – Marketing** (id `1uoXsslI6YIuYX32k-AwN-iUo0jBb1nM3EaNsL48gRzI`): tab `Web – Cấu hình`, `Web – Nội dung`, `Web – Menu`; ưu đãi ở `Chương trình ưu đãi`; blog ở `Thư viện blog`; đặt lịch ghi vào `Theo dõi đặt lịch`. Game lấy từ tab `App_Game` của file dữ liệu app khách.

## Quy tắc nội dung (từ MoTa)
Không ghi số phòng, số bàn khi chưa chốt mặt bằng; chỉ nói "riêng" cho ngồi bệt và lều; viết "không giới hạn giờ chơi"; không so giá với quán khác, không "rẻ nhất"; số game ghi "hơn 100"; địa chỉ, hotline, Zalo, Google Maps để trống đến khi có (website tự ẩn hoặc ghi "sắp cập nhật").

## Còn làm
Các trang còn lại (Phòng chơi, Giới thiệu, Board game, Menu, Ưu đãi, Blog), form Đặt lịch ghi vào Sheet, nối nội dung từ Sheet, SEO chi tiết, đo lường, đưa lên mạng.
