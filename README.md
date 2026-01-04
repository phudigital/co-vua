# Cờ Vua Cho Bé

## Mô Tả

Ứng dụng web vui nhộn giúp bé học và chơi cờ vua một cách dễ dàng. Với giao diện thân thiện, hướng dẫn bằng giọng đọc, và AI đơn giản, bé có thể chơi cờ vua với máy tính hoặc tự luyện tập.

## Tính Năng Chính

- **Chơi Với Máy**: Chọn màu trắng hoặc đen để chơi với AI.
- **Hướng Dẫn Bằng Giọng Đọc**: Khi chạm vào quân cờ, ứng dụng sẽ đọc hướng dẫn cách đi của quân đó bằng giọng Google.
- **Âm Thanh Hiệu Ứng**: Âm thanh vui nhộn khi di chuyển, ăn quân, hoặc bắt đầu ván mới.
- **Hiệu Ứng Confetti**: Pháo hoa khi ăn quân đối phương.
- **Giao Diện Thân Thiện**: Thiết kế vui nhộn, phù hợp trẻ em, responsive trên mobile.
- **Nút Đi Lại**: Có thể undo nước đi cuối cùng.
- **Ván Mới**: Bắt đầu ván cờ mới bất kỳ lúc nào.

## Cách Chơi

1. Mở ứng dụng và chọn màu đội (Trắng hoặc Đen).
2. Chạm vào quân cờ của bạn để xem hướng dẫn và highlight nước đi có thể.
3. Chạm vào ô đích để di chuyển quân.
4. Máy sẽ tự động đi sau lượt của bạn.
5. Sử dụng nút "Đi lại" để undo nếu cần, hoặc "Ván mới" để bắt đầu lại.

## Truy Cập Trực Tiếp

Bạn có thể chơi ngay tại: [https://app.pdl.vn/co-vua/](https://app.pdl.vn/co-vua/)

## Cài Đặt & Chạy

### Yêu Cầu
- Trình duyệt web hiện đại hỗ trợ JavaScript và Audio API.
- Kết nối internet để tải thư viện từ CDN.

### Bước Cài Đặt
1. Clone hoặc tải xuống dự án:
   ```bash
   git clone <repository-url>
   cd co-vua
   ```

2. Mở file `index.html` trực tiếp trong trình duyệt hoặc chạy server local:
   ```bash
   python -m http.server 8000
   ```
   Sau đó truy cập: `http://localhost:8000/index.html`

### Cấu Trúc File
- [`index.html`](index.html): File HTML chính chứa giao diện.
- [`script.js`](script.js): Logic game chính, xử lý di chuyển, AI, và giọng đọc.
- [`ai.js`](ai.js): AI đơn giản (hiện tại chọn nước đi ngẫu nhiên).
- [`sound.js`](sound.js): Quản lý âm thanh hiệu ứng và giọng đọc Google.
- [`style.css`](style.css): CSS styling cho giao diện.

## Công Nghệ Sử Dụng

- **Frontend**: HTML5, CSS3, JavaScript (ES6+).
- **Thư Viện**:
  - [Chess.js](https://github.com/jhlywa/chess.js): Logic cờ vua.
  - [Chessboard.js](https://chessboardjs.com/): Hiển thị bàn cờ.
  - Bootstrap 5: UI components.
  - Canvas Confetti: Hiệu ứng pháo hoa.
- **Âm Thanh**: Web Audio API, giọng đọc Google TTS.
- **Responsive**: CSS Grid và Media Queries.

## Phát Triển Thêm

- AI hiện tại rất đơn giản (chọn ngẫu nhiên). Có thể nâng cấp bằng thuật toán Minimax hoặc sử dụng thư viện AI mạnh hơn.
- Thêm chế độ chơi với người khác qua mạng.
- Thêm các cấp độ khó khăn khác nhau.

## Tác Giả

- **Phu Digital Vibe Coding**: Phát triển và bảo trì.
- Phiên bản: 1.9.

## Giấy Phép

Dự án này được phân phối dưới giấy phép MIT. Xem file LICENSE để biết thêm chi tiết.

## Đóng Góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request trên GitHub.

## Liên Hệ

Nếu có câu hỏi hoặc ý tưởng cải thiện, liên hệ qua email hoặc GitHub issues.