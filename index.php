<?php $VERSION = '2.16'; // Cập nhật version ?>
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Cờ Vua Vui">
    <title>Cờ Vua Vui Vẻ - Bé Học Chơi Cờ Vua</title>
    <meta name="description"
        content="Trò chơi cờ vua hấp dẫn dành cho trẻ em với nhiều cấp độ từ Gà Con đến Bác Phú. Giúp bé phát triển tư duy sáng tạo và rèn luyện trí thông minh mỗi ngày.">
    <meta name="keywords" content="cờ vua, trẻ em, học chơi cờ vua, game trí tuệ, cờ vua vui vẻ">
    <meta name="author" content="Phu Digital">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://app.pdl.vn/co-vua/">
    <meta property="og:title" content="Cờ Vua Vui Vẻ - Bé Học Chơi Cờ Vua">
    <meta property="og:description"
        content="Cờ Vua Vui Vẻ - Trò chơi cờ vua hấp dẫn được thiết kế đặc biệt giúp trẻ em dễ dàng tập chơi và phát triển tư duy.">
    <meta property="og:image" content="co-vua/assets/thumbnail.jpg">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://app.pdl.vn/co-vua/">
    <meta property="twitter:title" content="Cờ Vua Vui Vẻ - Bé Học Chơi Cờ Vua">
    <meta property="twitter:description"
        content="Học chơi cờ vua cực dễ cùng Gà Con, Vịt Vàng và nhiều bạn nhỏ khác! Game trí tuệ dành riêng cho bé.">
    <meta property="twitter:image" content="co-vua/assets/thumbnail.jpg">

    <link rel="icon" type="image/jpeg" href="co-vua/assets/thumbnail.jpg">



    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/chessground@9.1.1/assets/chessground.base.css">
    <link rel="stylesheet" href="https://unpkg.com/chessground@9.1.1/assets/chessground.cburnett.css">
    <link rel="stylesheet" href="https://unpkg.com/chessground@9.1.1/assets/chessground.brown.css">
    <script type="module">
        import { Chessground } from 'https://unpkg.com/chessground@9.1.1/dist/chessground.min.js';
        window.Chessground = Chessground;
    </script>

    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <link rel="stylesheet" href="style.css?v=<?= $VERSION ?>">
</head>

<body class="flex flex-col items-center justify-start h-screen w-screen bg-orange-50 overflow-hidden">

    <!-- OVERLAY THÔNG BÁO KẾT QUẢ -->
    <div id="game-overlay" style="display: none;">
        <div class="overlay-text"></div>
    </div>

    <!-- HEADER -->
    <div class="fixed top-0 w-full pt-4 pb-4 bg-orange-50/95 z-50 flex flex-col items-center justify-center shadow-sm">

        <div class="text-center mb-2">
            <h1 id="hidden-hint-btn" class="text-3xl font-black text-orange-600 leading-none cursor-pointer" onclick="window.gameController.showHint()">CỜ VUA VUI VẺ 🎲</h1>
            
            <div id="header-badge-area" class="h-8 flex items-center justify-center mt-1">
                <div id="version-badge">
                    <img src="https://img.shields.io/badge/version-<?= $VERSION ?>-blue.svg" alt="Version <?= $VERSION ?>"
                        class="h-5 shadow-sm opacity-90">
                </div>
                <div id="check-badge" class="hidden text-red-600 font-black text-sm animate-pulse">
                    ⚡ ĐANG CHIẾU! ⚡
                </div>
            </div>
        </div>

        <div id="game-status" class="text-sm font-bold text-gray-700 text-center">
            Bấm "Bắt đầu" để chơi nha!
        </div>
    </div>

    <!-- GAME AREA -->
    <div class="w-full h-full flex flex-col items-center justify-start gap-3 overflow-y-auto pt-36 pb-32">
        <div id="board-container"></div>
        
        <div id="current-level-badge"
            class="px-4 py-1.5 text-orange-600 text-xs font-bold flex items-center justify-center gap-2">
            <span class="animate-pulse">✨</span> Chọn cấp độ để bắt đầu
        </div>

        <!-- ĐÃ XÓA BÁO CÁO INLINE TẠI ĐÂY -->
    </div>

    <!-- MODAL PHÂN TÍCH VÁN ĐẤU (LV6) -->
    <div id="analysis-modal" style="display: none;" class="fixed inset-0 bg-orange-50/95 z-[10000] flex items-center justify-center">
        <div class="modal-box max-w-[450px]">
            <button class="close-btn" onclick="$('#analysis-modal').fadeOut()">✕</button>
            <div id="analysis-report-content">
                <!-- Nội dung báo cáo sẽ được chèn vào đây -->
            </div>
            <button onclick="$('#analysis-modal').fadeOut()" class="btn-start mt-6">ĐÃ HIỂU, XEM BÀN CỜ</button>
        </div>
    </div>

    <!-- CONTROLS -->
    <div class="fixed bottom-6 flex gap-3 z-50 w-full justify-center px-4">
        <button onclick="window.gameController.openSetup()"
            class="btn-control bg-white p-3 rounded-xl shadow-lg text-gray-500 hover:text-orange-600 w-14 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>
        <button id="undo-btn"
            class="btn-control bg-blue-500 px-6 py-3 rounded-xl shadow-lg text-white font-bold flex items-center justify-center gap-2 flex-grow max-w-[200px] active:bg-blue-600">
            <span class="text-xl">↩️</span> LÙI LẠI
        </button>
        <button id="hint-btn"
            class="btn-control bg-yellow-400 p-3 rounded-xl shadow-lg text-white font-bold hover:bg-yellow-500 w-14 flex justify-center">
            💡
        </button>
    </div>

    <!-- SETUP MODAL -->
    <div id="setup-modal">
        <div class="modal-box">
            <button id="modal-close-btn" class="close-btn" onclick="window.gameController.closeSetup()">✕</button>

            <h2 class="text-2xl font-black text-orange-600 mb-4 uppercase tracking-wide">Cài đặt trò chơi</h2>

            <div class="setup-group">
                <span class="label-text">1. Chọn độ khó:</span>
                <div class="flat-select-wrapper">
                    <select id="level-select" class="flat-select">
                        <option value="1">🐣 Cấp 1: Gà Con (Rất Dễ)</option>
                        <option value="2">🐤 Cấp 2: Bạn Vịt (Dễ)</option>
                        <option value="3">🦊 Cấp 3: Anh Sói (Vừa)</option>
                        <option value="4">🐯 Cấp 4: Bác Hổ (Khó)</option>
                        <option value="5">🦁 Cấp 5: Lão Sư Tử (Rất Khó)</option>
                        <option value="6">🤖 Cấp 6: Siêu Trí Tuệ (AI)</option>
                    </select>
                </div>
            </div>

            <div class="setup-group">
                <span class="label-text">2. Bé muốn cầm quân gì?</span>
                <div class="color-options">
                    <div class="color-btn selected" onclick="selectColor('w', this)">
                        <div class="w-8 h-8 rounded-full border border-gray-300 bg-white mb-1"></div>
                        <span>Trắng</span>
                    </div>
                    <div class="color-btn" onclick="selectColor('b', this)">
                        <div class="w-8 h-8 rounded-full border border-gray-600 bg-gray-800 mb-1"></div>
                        <span>Đen</span>
                    </div>
                </div>
            </div>

            <!-- ĐÃ XÓA PHẦN CHỌN MÀU NỀN BÀN CỜ -->
            
            <div class="setup-group mt-6 border-t pt-4 border-dashed border-orange-200">
                <span class="label-text flex items-center gap-2">
                    🚀 Chơi Online (2 người):
                </span>
                <div class="grid grid-cols-2 gap-3 mt-2">
                    <button id="btn-room1" onclick="joinOnlineRoom('room1')" class="room-btn bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl shadow-sm transition-all relative overflow-hidden group">
                         <div class="font-black text-lg">PHÒNG 1</div>
                         <div class="room-status text-xs font-bold flex items-center justify-center gap-1">
                            <span class="status-dot w-2 h-2 rounded-full bg-white animate-pulse"></span> <span class="status-text">Trống - Vào ngay</span>
                         </div>
                    </button>
                    <button id="btn-room2" onclick="joinOnlineRoom('room2')" class="room-btn bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl shadow-sm transition-all relative overflow-hidden group">
                         <div class="font-black text-lg">PHÒNG 2</div>
                         <div class="room-status text-xs font-bold flex items-center justify-center gap-1">
                            <span class="status-dot w-2 h-2 rounded-full bg-white animate-pulse"></span> <span class="status-text">Trống - Vào ngay</span>
                         </div>
                    </button>
                </div>
                <div id="online-status-msg" class="text-center text-xs font-bold text-orange-600 mt-2 hidden">
                    Đang kết nối...
                </div>
            </div>

            <button onclick="confirmSetup()" class="btn-start">CHƠI VÁN MỚI ▶</button>
        </div>
    </div>

    <script src="ai_controller.js?v=<?= $VERSION ?>"></script>
    <script src="human_ai_engine.js?v=<?= $VERSION ?>"></script>
    <script src="game_analyzer.js?v=<?= $VERSION ?>"></script>
    <script type="module" src="online/client.js?v=<?= $VERSION ?>"></script>
    <script src="main.js?v=<?= $VERSION ?>"></script>

    <script>
        // Fix Zoom Mobile: Prevent double-tap and pinch zoom
        document.addEventListener('dblclick', function(event) {
            event.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

        let selectedColor = 'w';
        function selectColor(color, el) {
            selectedColor = color;
            document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
            el.classList.add('selected');
        }
        let setupPollInterval = null;

        function updateRoomButtons() {
            if (typeof window.OnlineChess === 'undefined') return;
            window.OnlineChess.getRoomsInfo().then(data => {
                ['room1', 'room2'].forEach(room => {
                    const status = data[room] || 'empty';
                    const btn = document.getElementById(`btn-${room}`);
                    const dot = btn.querySelector('.status-dot');
                    const txt = btn.querySelector('.status-text');

                    if (status === 'empty') {
                        btn.className = "room-btn bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl shadow-sm transition-all relative overflow-hidden group";
                        dot.className = "status-dot w-2 h-2 rounded-full bg-white animate-pulse";
                        txt.textContent = "Trống - Vào ngay";
                        btn.disabled = false;
                    } else if (status === 'waiting') {
                        btn.className = "room-btn bg-yellow-400 hover:bg-yellow-500 text-white p-3 rounded-xl shadow-sm transition-all relative overflow-hidden group";
                        dot.className = "status-dot w-2 h-2 rounded-full bg-white animate-bounce";
                        txt.textContent = "1 người - Vào chơi";
                        btn.disabled = false;
                    } else if (status === 'full') {
                        btn.className = "room-btn bg-gray-200 text-gray-400 p-3 rounded-xl shadow-none cursor-not-allowed";
                        dot.className = "status-dot w-2 h-2 rounded-full bg-gray-400";
                        txt.textContent = "Đã đầy";
                        btn.disabled = true;
                    }
                });
            });
        }

        // Poll room status when modal is open
        const setupObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.style.display !== 'none') {
                    updateRoomButtons();
                    if (!setupPollInterval) setupPollInterval = setInterval(updateRoomButtons, 2000);
                } else {
                    if (setupPollInterval) { clearInterval(setupPollInterval); setupPollInterval = null; }
                }
            });
        });
        setupObserver.observe(document.getElementById('setup-modal'), { attributes: true, attributeFilter: ['style'] });

        function confirmSetup() {
            if (typeof window.Chessground === 'undefined') {
                alert("Đang tải bàn cờ, bé đợi xíu nha...");
                return;
            }
            const level = document.getElementById('level-select').value;
            document.getElementById('setup-modal').style.display = 'none';
            window.gameController.startGame(parseInt(level), selectedColor);
        }

        function joinOnlineRoom(roomId) {
            document.getElementById('setup-modal').style.display = 'none';
            // Pass the selected color preference to the controller
            window.gameController.startOnlineGame(roomId, selectedColor);
        }
    </script>
</body>

</html>