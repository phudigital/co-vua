# Cờ Vua Vui Vẻ

<div align="center">

![Version](https://img.shields.io/badge/version-2.3-blue.svg)
![Platform](https://img.shields.io/badge/platform-Web%20Browser-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E.svg)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)
![Stockfish](https://img.shields.io/badge/AI%20Engine-Stockfish-orange.svg)

**Một trang web chơi cờ vua đơn giản, vui vẻ với nhiều cấp độ AI, chạy trực tiếp trên trình duyệt.**

[Tính Năng](#-tính-năng) • [Cách Chơi](#-cách-chơi) • [Cài Đặt](#-cài-đặt) • [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)

</div>

---

## 📋 Tổng Quan

**Cờ Vua Vui Vẻ** là một dự án game cờ vua gọn nhẹ được xây dựng bằng HTML, JavaScript và Tailwind CSS. Trò chơi cho phép bạn đấu với một AI có 5 cấp độ khó khác nhau, từ người mới tập chơi cho đến mức thử thách cao. Giao diện được thiết kế để thân thiện và dễ sử dụng, không yêu cầu cài đặt phức tạp.

Phù hợp cho:
- 👥 **Người mới bắt đầu** - Làm quen với luật chơi ở các cấp độ dễ.
- ♟️ **Người chơi giải trí** - Thư giãn với các ván cờ nhanh.
- 👨‍💻 **Lập trình viên** - Tham khảo cách tích hợp thư viện `chess.js`, `Chessground` và engine `Stockfish` vào một trang web.

## ✨ Tính Năng

- 👑 **Chơi với máy (AI)** - Thử thách bản thân với 5 cấp độ khó.
- 🐣 **Cấp độ đa dạng**:
    - **Level 1-2**: AI đơn giản, dựa trên quy tắc và tính ngẫu nhiên, phù hợp để học.
    - **Level 3-5**: Tích hợp engine **Stockfish** mạnh mẽ với độ khó tăng dần.
- ⚪⚫ **Chọn màu quân** - Bắt đầu ván cờ với quân Trắng hoặc Đen.
- ↩️ **Đi lại (Undo)** - Quay lại nước đi trước đó nếu bạn mắc sai lầm.
- 💡 **Gợi ý nước đi (Hint)** - Nhận gợi ý cho nước đi tiếp theo (sử dụng Stockfish).
- 📱 **Giao diện đáp ứng (Responsive)** - Chơi tốt trên cả máy tính và điện thoại.
- 🚀 **Không cần cài đặt** - Chỉ cần mở trang web trên trình duyệt là có thể chơi ngay.

## 🚀 Cách Chơi

1.  **Mở file `index.php`** trên một máy chủ web cục bộ (local server).
2.  Một hộp thoại **Cài đặt trò chơi** sẽ hiện ra.
3.  **Chọn độ khó** từ Cấp 1 đến Cấp 5.
4.  **Chọn màu quân** bạn muốn cầm (Trắng hoặc Đen).
5.  Nhấn nút **"BẮT ĐẦU CHƠI"**.
6.  Sử dụng các nút điều khiển ở phía dưới để **Lùi lại** hoặc xem **Gợi ý**.

## 💻 Cài Đặt và Chạy Project

Do dự án sử dụng file `.php` để quản lý phiên bản cho các file CSS/JS, bạn cần chạy nó trên một máy chủ web có hỗ trợ PHP.

### Yêu cầu

-   Một môi trường máy chủ web như [XAMPP](https://www.apachefriends.org/), [MAMP](https://www.mamp.info/) hoặc sử dụng chính câu lệnh của PHP.

### Hướng dẫn

1.  **Tải mã nguồn về:**
    ```bash
    git clone [URL_CUA_REPO_NAY]
    cd co-vua
    ```

2.  **Cách 1: Dùng server tích hợp của PHP (Đơn giản nhất)**
    -   Mở Terminal hoặc Command Prompt trong thư mục `co-vua`.
    -   Chạy lệnh sau:
        ```bash
        php -S localhost:8000
        ```
    -   Mở trình duyệt và truy cập vào địa chỉ `http://localhost:8000`.

3.  **Cách 2: Dùng XAMPP/MAMP**
    -   Copy thư mục `co-vua` vào thư mục `htdocs` (của XAMPP) hoặc `htdocs` (của MAMP).
    -   Khởi động Apache server từ bảng điều khiển của XAMPP/MAMP.
    -   Mở trình duyệt và truy cập `http://localhost/co-vua`.

## 🛠️ Công Nghệ Sử Dụng

| Công nghệ | Mục đích |
|---|---|
| [HTML/PHP](https://www.php.net/) | Cấu trúc trang web chính. |
| [Tailwind CSS](https://tailwindcss.com/) | Framework CSS để xây dựng giao diện nhanh chóng. |
| [JavaScript (ES6)](https://www.javascript.com/) | Xử lý logic chính của game. |
| [Chess.js](https://github.com/jhlywa/chess.js) | Thư viện xử lý luật cờ, kiểm tra nước đi hợp lệ. |
| [Chessground](https://github.com/lichess-org/chessground) | Thư viện hiển thị bàn cờ và xử lý tương tác kéo/thả quân cờ. |
| [Stockfish.js](https://github.com/nmrugg/stockfish.js) | Engine cờ vua mạnh mẽ cho các cấp độ AI khó. |
| [jQuery](https://jquery.com/) | Thư viện hỗ trợ thao tác DOM. |
| [Canvas Confetti](https://github.com/catdad/canvas-confetti) | Tạo hiệu ứng pháo hoa khi chiến thắng. |

### Cấu trúc Project

```
co-vua/
├── index.php           # File giao diện chính
├── style.css           # Các style tùy chỉnh bổ sung
├── main.js             # Logic chính của game, điều khiển bàn cờ và sự kiện
├── ai_controller.js    # Quản lý các cấp độ AI, gọi engine phù hợp
└── sound/              # Chứa các file âm thanh (di chuyển, ăn quân...)
```

## 📄 Giấy phép

Dự án này được cấp phép theo Giấy phép MIT - xem file `LICENSE` để biết chi tiết.

## 🙏 Lời cảm ơn

-   Cảm ơn các tác giả của **Chess.js**, **Chessground**, và **Stockfish.js** đã tạo ra những thư viện tuyệt vời.