# 🌲🐟 Lumber & Fishery Empire Tycoon 3D (Full-Stack JavaScript)

Tựa game mô phỏng chuỗi cung ứng gỗ, thủy sản và bán lẻ siêu thị chạy trên nền tảng **Web 3D (Three.js WebGL)** kết hợp **Node.js Express REST API** và lưu trữ đám mây thời gian thực với **MongoDB Atlas (Cloud)** theo cơ chế **Kích hoạt theo hành động (Action-Driven Persistence)**.

Dự án đã được **chuyển đổi 100% sang JavaScript** và phân chia cấu trúc thư mục module hóa chuyên nghiệp theo chuẩn dự án thực tế.

---

## 🚀 Cách Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
- Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 16 trở lên).

### 2. Khởi Động Máy Chủ Game
Mở terminal hoặc PowerShell tại thư mục dự án và chạy:
```bash
npm start
```
hoặc:
```bash
node server.js
```

> - Máy chủ Node.js Express sẽ tự động khởi động tại `http://127.0.0.1:3000/`.
> - Tự động nạp cấu hình cụm đám mây từ tệp `.env` (`MONGODB_URI`).
> - Tự động mở trình duyệt web để bắt đầu trải nghiệm trò chơi.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Modular Architecture)

```
game_khaithacgo/
├── .env                        # Cấu hình chuỗi kết nối MongoDB Atlas & Cổng máy chủ
├── package.json                # Quản lý dependencies (Express, MongoDB, Dotenv, Cors)
├── server.js                   # Node.js Express Backend & MongoDB Atlas REST API
├── README.md                   # Tài liệu hướng dẫn dự án
├── public/                     # Thư mục tài nguyên tĩnh phục vụ Web
│   ├── index.html              # HTML giao diện game chuẩn hóa
│   ├── css/
│   │   └── style.css           # Bố cục giao diện, HUD kính mờ, số nhảy 3D, thông báo Toast
│   ├── vendor/
│   │   ├── three.min.js        # Thư viện đồ họa 3D Three.js
│   │   └── OrbitControls.js    # Điều khiển camera Isometric 45°
│   └── js/
│       ├── config.js           # Cấu hình tiến trình Level 1 -> 5 & Game State ban đầu
│       ├── audio.js            # Bộ tạo hiệu ứng âm thanh Web Audio API (không cần file mp3)
│       ├── textures.js         # Bộ tạo vật liệu PBR vân gỗ, đất ẩm, bê tông sọc bằng Canvas
│       ├── ui.js               # Quản lý HUD thanh trên cùng, số nhảy World-Space & Modal
│       ├── storage.js          # Hệ thống đồng bộ MongoDB Atlas (Debounce 800ms & LocalStorage)
│       ├── player.js           # Nhân vật người chơi áo caro đỏ, balo gỗ vật lý & hoạt ảnh rìu
│       ├── world.js            # Dựng 5 phân khu 3D, cây thông, rào chắn công trình & ổ khóa 3D
│       ├── vehicles.js         # Hệ thống xe nâng tự động (FSM), thuyền đánh cá & xe tải xuất khẩu
│       └── game.js             # Vòng lặp game Three.js 60 FPS, va chạm, raycasting & tương tác
```

---

## 💎 ĐẶC ĐIỂM KỸ THUẬT NỔI BẬT

### 1. Chuyển Đổi Hoàn Toàn Sang JavaScript (Zero Python Dependency)
- Thay thế hoàn toàn backend Python bằng `server.js` viết bằng **Node.js Express** và thư viện chính thức `mongodb`.
- Cung cấp 2 REST API endpoints chuẩn hóa:
  - `POST /api/save-game`: Lưu dữ liệu trạng thái tiến trình của người chơi vào MongoDB Atlas.
  - `GET /api/load-game/:playerId`: Tải dữ liệu tiến trình từ đám mây, tự động fallback sang `game_save_backup.json` nếu mất mạng.

### 2. Tối Ưu Hóa Giao Diện & Trải Nghiệm (UI/UX)
- **Zero Toast Spam**: Không làm phiền người chơi bằng hàng loạt popup che màn hình.
- **World-Space Floating Numbers**: Các chỉ số `+2 Khúc gỗ 🪵`, `+2 Ván gỗ 🪵`, `+$20 💵` bay lên nhẹ nhàng ngay tại vị trí gốc cây hoặc máy cưa trong không gian 3D.
- **Compact HUD**: Thanh trạng thái kính mờ mỏng gọn hiển thị cấp độ, mục tiêu và tài nguyên.
- **Rào Chắn & Ổ Khóa 3D**: Phân khu chưa mở khóa được khóa thực tế bằng rào chắn phản quang và ổ khóa 3D có biển báo cấp độ.

### 3. Hệ Thống Logistics Cơ Giới Hóa
- Xe nâng hàng công nghiệp màu vàng di chuyển tự động qua các trạm (Lấy gỗ -> Nâng càng -> Vận chuyển -> Xả ván).
- Thuyền đánh cá cập cảng cung cấp cá tươi định kỳ cho nhà máy đóng hộp.
- Đại siêu thị bán lẻ đón khách NPC mua sắm tạo dòng tiền thụ động ở Cấp 5.

---

## 🎮 Hướng Dẫn Điều Khiển
- **W, A, S, D / Phím Mũi Tên**: Di chuyển nhân vật.
- **Phím Cách (Space)**: Đốn cây / Tương tác nhanh.
- **Chuột Trái**: Click vào cây để đốn, click vào đất để nhân vật tự đi tới.
- **Chuột Phải**: Lia góc nhìn bản đồ (Pan Isometric).
- **Cuộn Chuột**: Phóng to / Thu nhỏ camera.
# khaithacgo
# khaithacgo
