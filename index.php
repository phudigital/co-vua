<?php $VERSION = '2.3'; // Cập nhật version ?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Cờ Vua Vui Vẻ</title>
    
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
    <div class="fixed top-0 w-full pt-4 bg-orange-50/95 z-50 flex flex-col items-center border-orange-100">
        <div class="text-center mb-1">
            <h1 class="text-3xl font-black text-orange-600 leading-none">CỜ VUA VUI VẺ 🎲</h1>
            <span class="text-[10px] font-bold text-orange-300 tracking-widest uppercase">Version <?= $VERSION ?></span>
        </div>
        
        <div id="game-status" class="bg-white px-6 py-1 rounded-full text-sm font-bold text-gray-700 border-2 border-orange-200">
            Bấm "Bắt đầu" để chơi nha!
        </div>
    </div>

    <!-- GAME AREA -->
    <div class="w-full h-full flex flex-col items-center justify-center gap-3">
        <div id="board-container"></div>
        <div id="current-level-badge" class="px-4 py-1.5 bg-white text-orange-600 text-xs font-bold rounded-full border border-orange-200 shadow-sm flex items-center gap-2">
            <span class="animate-pulse">✨</span> Chọn cấp độ để bắt đầu
        </div>
    </div>

    <!-- CONTROLS -->
    <div class="fixed bottom-6 flex gap-3 z-50 w-full justify-center px-4">
        <button onclick="window.gameController.openSetup()" class="btn-control bg-white p-3 rounded-xl shadow-lg text-gray-500 hover:text-orange-600 w-14 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <button id="undo-btn" class="btn-control bg-blue-500 px-6 py-3 rounded-xl shadow-lg text-white font-bold flex items-center justify-center gap-2 flex-grow max-w-[200px] active:bg-blue-600">
            <span class="text-xl">↩️</span> LÙI LẠI
        </button>
        <button id="hint-btn" class="btn-control bg-yellow-400 p-3 rounded-xl shadow-lg text-white font-bold hover:bg-yellow-500 w-14 flex justify-center">
            💡
        </button>
    </div>

    <!-- SETUP MODAL -->
    <div id="setup-modal">
        <div class="modal-box">
            <button id="modal-close-btn" class="close-btn" onclick="window.gameController.closeSetup()" style="display:none;">✕</button>

            <h2 class="text-2xl font-black text-orange-600 mb-4 uppercase tracking-wide">Cài đặt trò chơi</h2>
            
            <div class="setup-group">
                <span class="label-text">1. Chọn độ khó:</span>
                <div class="flat-select-wrapper">
                    <select id="level-select" class="flat-select">
                        <option value="1">🐣 Cấp 1: Tập chơi</option>
                        <option value="2">🐤 Cấp 2: Biết chơi</option>
                        <option value="3">🦊 Cấp 3: Thử thách</option>
                        <option value="4">🐯 Cấp 4: Thông minh</option>
                        <option value="5">🦁 Cấp 5: Siêu đẳng</option>
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

            <button onclick="confirmSetup()" class="btn-start">BẮT ĐẦU CHƠI ▶</button>
        </div>
    </div>

    <script src="ai_controller.js?v=<?= $VERSION ?>"></script>
    <script src="main.js?v=<?= $VERSION ?>"></script>

    <script>
        let selectedColor = 'w';
        function selectColor(color, el) {
            selectedColor = color;
            document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
            el.classList.add('selected');
        }
        function confirmSetup() {
            if (typeof window.Chessground === 'undefined') {
                alert("Đang tải bàn cờ, bé đợi xíu nha...");
                return;
            }
            const level = document.getElementById('level-select').value;
            document.getElementById('setup-modal').style.display = 'none';
            window.gameController.startGame(parseInt(level), selectedColor);
        }
    </script>
</body>
</html>