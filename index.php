<?php $version = "2.62"; ?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta property="og:title" content="Cờ Vua Cho Bé">
    <meta property="og:description" content="Trò chơi cờ vua vui nhộn cho bé">
    <meta property="og:image" content="co-vua/thumbnail.jpg">
    <title>Cờ Vua Cho Bé</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.css">
    <link rel="stylesheet" href="style.css?v=<?php echo $version; ?>"><!-- Thêm dòng này trước các script khác -->
    <script src="https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js"></script>
</head>
<body>

    <div class="app-container">
        <!-- 1. Header -->
        <div class="top-bar">
            <h1 class="game-title">🏰 Vua Cờ Nhí 🏰</h1>
            <span class="version-info">Phiên bản <?php echo $version; ?> (Cập nhật: 05/01/2026)</span>
        </div>

        <!-- 2. Bàn cờ -->
        <div class="board-area">
            <div id="myBoard"></div>
        </div>

        <!-- HIỂN THỊ CHẾ ĐỘ CHƠI -->
        <div id="ai-mode-display"></div>

        <!-- 3. HỘP THÔNG BÁO & HƯỚNG DẪN (GỘP CHUNG) -->
        <div id="move-hint" class="hint-box">
            Chạm vào quân cờ để xem cách đi nhé!
        </div>

        <!-- 4. Nút bấm -->
        <div class="bottom-controls">
            <div class="row g-2">
                <div class="col-6">
                    <button id="btnUndo" class="btn-kid btn-undo">↩️ Đi lại</button>
                </div>
                <div class="col-6">
                    <button id="btnNewGame" class="btn-kid btn-new">✨ Ván mới</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Chọn Màu -->
    <div class="modal fade" id="colorModal" data-bs-backdrop="static" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 justify-content-center">
                    <h4 class="fw-bold text-primary">🎯 Bé chọn đội nào? 🎯</h4>
                </div>
                <div class="modal-body">
                    <div class="mb-3 text-center">
                        <label for="aiLevel" class="form-label fw-bold text-success">Chọn độ khó:</label>
                        <select class="form-select form-select-sm w-50 mx-auto" id="aiLevel">
                            <option value="0">Tập chơi 🍼</option>
                            <option value="1">Nghiêm túc 💪</option>
                            <option value="2">Thách đấu 🤔</option>
                            <option value="max">Trùm cuối 👾</option>
                        </select>
                    </div>
                    <div class="row text-center">
                        <div class="col-6" onclick="chooseColor('white')">
                            <div class="color-choice">
                                <div class="team-icon">👑</div>
                                <img src="https://chessboardjs.com/img/chesspieces/wikipedia/wK.png" class="color-img">
                                <h5 class="mt-2 text-dark fw-bold">Đội Trắng</h5>
                                <p class="text-muted small">Đi trước</p>
                            </div>
                        </div>
                        <div class="col-6" onclick="chooseColor('black')">
                            <div class="color-choice">
                                <div class="team-icon">⚔️</div>
                                <img src="https://chessboardjs.com/img/chesspieces/wikipedia/bK.png" class="color-img">
                                <h5 class="mt-2 text-dark fw-bold">Đội Đen</h5>
                                <p class="text-muted small">Máy đi trước</p>
                            </div>
                        </div>
                    </div>
                    <div class="text-center mt-4">
                        <p class="text-primary fw-bold">💡 Chạm vào quân cờ để nghe hướng dẫn!</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <!-- Stockfish Engine -->
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.min.js"></script> -->
    <!-- Thêm dòng này trước các script khác -->
    <script src="https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js"></script>
    <!-- Tải script động để chống cache khi phát triển -->
    <script src="sound.js?v=<?php echo $version; ?>"></script>
    <script src="ai.js?v=<?php echo $version; ?>"></script>
    <script src="ai-lv1.js?v=<?php echo $version; ?>"></script>
    <script src="ai-lv2.js?v=<?php echo $version; ?>"></script>
    <script src="ai-max.js?v=<?php echo $version; ?>"></script>
    <script src="script.js?v=<?php echo $version; ?>"></script>
</body>
</html>