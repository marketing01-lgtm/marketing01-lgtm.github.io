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

## Đăng website
Công cụ `gh` (GitHub CLI) tải vào thư mục tạm, đăng nhập bằng `gh auth login --web` (anh Ân duyệt mã 1 lần). Đăng lần đầu và cập nhật: `GH=<đường dẫn gh> node tools/publish-github.js` (không cần git). Kho: `marketing01-lgtm/marketing01-lgtm.github.io`, website: https://marketing01-lgtm.github.io/ (Pages đăng bằng Actions: `.github/workflows/deploy.yml`, tự dựng lại mỗi giờ để lấy dữ liệu mới từ Sheet khi đã có link `dat_lich_api`).
Nối tên miền lennaboardgame.com: ở DNS Squarespace thêm 4 bản ghi A cho `@` (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) và CNAME `www` về `marketing01-lgtm.github.io`, giữ nguyên bản ghi email (MX, TXT); rồi đặt tên miền trong cài đặt Pages của kho. Khi duyệt ra mắt: đổi `cho_google_tim` thành Có trong tab Web – Cấu hình.

## Đặt lịch + Zalo
Xem `apps-script/HUONG-DAN.md`.

## Hiệu ứng và tương tác (22/10/2026)
- Linh vật Chisu ở banner các trang: kéo ngang để xoay 360° (có quán tính, tự về mặt trước), chạm nhẹ xoay 1 vòng, lần đầu thấy tự xoay 1 vòng. Mã ở `src/site.js` (mục "linh vật Chisu"); tôn trọng chế độ giảm chuyển động. Ảnh Chisu Chiến Binh ở Board game chỉ có 1 ảnh liền nền nên chỉ nghiêng nhẹ khi kéo (`data-spin="tilt"`).
- Thẻ, tiêu đề trượt nhẹ lên khi cuộn tới (`.rv` trong `site.css`, `reveal()` trong `site.js`).
- Video hướng dẫn trong thẻ game: bấm để phát bằng khung Drive `/preview`, lấy từ `data/games-video.json` (id game → file Drive, từ cột Video của tab App_Game). Game mới thêm vào app thì thêm dòng vào file này.
- Bài blog: mỗi bài một trang `/blog/<tên-bài>/` (danh sách bài lấy từ trang Blog). Bài đầu dùng nguyên bản thiết kế; các bài còn lại chưa có nội dung đầy đủ nên có khung "Bài đầy đủ sắp lên sóng" và chưa cho Google lập chỉ mục (`src/article.js`). Khi Content có bài thật, thay nội dung ở đó.
- Mọi nút Nhắn Lenna / Messenger mở `messenger` trong tab Web – Cấu hình (m.me của fanpage).

## Còn làm
Nối chữ, menu, ưu đãi, game, blog từ Google Sheet vào các trang (hiện dùng nội dung thiết kế; riêng sứ mệnh, giá trị cốt lõi đã sửa cả trong thiết kế lẫn tab Web – Nội dung); ảnh thật thay ảnh 3D; nội dung đầy đủ cho 8 bài blog; chính sách dữ liệu cần người có chuyên môn duyệt; mã đo lường (GA4, Meta Pixel, TikTok Pixel) khi có.
