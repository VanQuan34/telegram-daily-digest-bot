# Telegram Daily Digest Bot ✈️

Ứng dụng Node.js + TypeScript kèm giao diện **Web Dashboard** giúp tự động tổng hợp và đẩy thông báo qua **Telegram Bot** mỗi ngày (hoặc gửi tức thì / tra cứu qua lệnh chat):

1. 🌤️ **Thời tiết hôm nay**: Nhiệt độ hiện tại, cảm giác thực, biên độ nhiệt, độ ẩm, khả năng mưa, chỉ số UV và lời khuyên trang phục (hỗ trợ Hà Nội, TP.HCM, Đà Nẵng, Hải Phòng, Cần Thơ, Nha Trang, Đà Lạt, Huế,...).
2. 🎰 **Xổ số miền Bắc hôm qua (XSMB)**: Cập nhật trực tiếp Giải Đặc Biệt, Giải Nhất -> Giải Bảy và bảng Lô tô 2 số.
3. 🍀 **Con số may mắn hôm nay**: Tính theo Tên & Ngày sinh (cố định trong ngày) hoặc Ngẫu nhiên, kèm lịch Can Chi, bộ số tài lộc, 3 càng, màu sắc hợp mệnh, giờ hoàng đạo và thông điệp ngày mới.
4. ₿ **Thị trường Bitcoin & Crypto**: Giá trực tiếp BTC, ETH, SOL, BNB quy đổi USD & VNĐ, biến động 24h và chỉ số tâm lý thị trường *Fear & Greed Index*.
5. 🌍 **Tin tức Thế giới nổi bật**: Tổng hợp 5 tin quốc tế mới nhất từ RSS VnExpress Thế Giới kèm link đọc nhanh.

---

## 🚀 Cách chạy ứng dụng

```bash
# Cài đặt thư viện
npm install

# Chạy ứng dụng (mặc định mở tại http://localhost:3000)
npm run start

# Hoặc chạy chế độ phát triển tự động reload:
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 🤖 Hướng dẫn kết nối Bot Telegram (chỉ mất 1 phút)

1. Mở Telegram, tìm **[@BotFather](https://t.me/BotFather)** và gõ `/newbot` để tạo bot mới, sau đó copy **Bot Token** (dạng `7123456789:AAH...`).
2. Dán **Bot Token** vào ô cấu hình trên giao diện Web `http://localhost:3000` và bấm **"Kiểm tra Bot"**.
3. Mở khung chat với Bot vừa tạo trên Telegram, bấm **Start** (hoặc gõ `/start`).
4. Quay lại giao diện Web, bấm nút **"🔍 Tự động dò Chat ID"** — hệ thống sẽ tự động lấy đúng `Chat ID` của bạn.
5. Bấm **"💾 Lưu cấu hình & Áp dụng"** hoặc bấm **"🚀 Đẩy toàn bộ bản tin qua Telegram"** để nhận thử ngay lập tức!

---

## 💬 Các lệnh tương tác trực tiếp với Bot trên Telegram

Khi bật chế độ phản hồi lệnh chat, bạn có thể nhắn trực tiếp cho Bot bất cứ lúc nào:
- `/start` hoặc `/help` — Xem hướng dẫn & lấy Chat ID
- `/all` hoặc `/bantin` — Nhận toàn bộ bản tin tổng hợp ngay lập tức
- `/thoitiet` — Xem thời tiết hôm nay
- `/xoso` — Xem kết quả Xổ số miền Bắc hôm qua
- `/mayman` — Xem con số may mắn & tử vi hôm nay
- `/btc` — Xem giá Bitcoin, ETH, SOL, BNB & Fear/Greed Index
- `/tintuc` — Xem 5 tin tức thế giới mới nhất
