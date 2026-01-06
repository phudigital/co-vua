/**
 * Main Game Controller v2.3.0
 * Logic hiển thị kết quả chậm lại để bé xem nước cờ
 */
class GameController {
    constructor() {
        this.game = new Chess();
        this.ai = new AIController();
        this.board = null;
        this.playerColor = 'w';
        this.isGameActive = false;
        this.gameOverMessage = '';
        this.overlayTimer = null;
        this.userHasInteracted = false;

        this.levelNames = {
            1: "🐣 Cấp 1: Tập chơi (Rất Dễ)",
            2: "🐤 Cấp 2: Biết chơi (Dễ)",
            3: "🦊 Cấp 3: Thử thách (Vừa)",
            4: "🐯 Cấp 4: Thông minh (Khó)",
            5: "🦁 Cấp 5: Siêu đẳng (Rất Khó)"
        };

        this.sounds = {
            move: this.loadSound('move'),
            capture: this.loadSound('capture'),
            check: this.loadSound('check'),
            victory: this.loadSound('victory'),
            defeat: this.loadSound('defeat'),
            start: this.loadSound('tournament3rd')
        };
        Object.values(this.sounds).forEach(s => s.load());

        document.addEventListener('touchstart', this.handleInteraction, { once: true });
        document.addEventListener('mousedown', this.handleInteraction, { once: true });

        // Khi game over, bấm vào bàn cờ sẽ hiện lại thông báo ngay lập tức
        $('#board-container').on('click', () => {
            if (this.game.game_over()) {
                // Hủy timer đang chờ (nếu có) để hiện luôn
                clearTimeout(this.overlayTimer);
                this.showGameResultOverlay(this.gameOverMessage, false);
            }
        });
    }

    handleInteraction = () => {
        this.userHasInteracted = true;
    }

    loadSound(fileName) {
        const audio = new Audio();
        const srcMp3 = document.createElement('source');
        srcMp3.src = `sound/${fileName}.mp3`;
        srcMp3.type = 'audio/mpeg';
        const srcOgg = document.createElement('source');
        srcOgg.src = `sound/${fileName}.ogg`;
        srcOgg.type = 'audio/ogg';
        audio.appendChild(srcMp3);
        audio.appendChild(srcOgg);
        audio.load();
        return audio;
    }

    startGame(level, color) {
        this.playerColor = color;
        this.game.reset();
        this.isGameActive = true;
        this.gameOverMessage = '';

        $('#game-overlay').hide();
        clearTimeout(this.overlayTimer);
        
        this.updateLevel(level);

        this.updateBoardUI();
        this.updateStatus();
        this.playSound('start');

        if (this.playerColor === 'b') {
            this.triggerAiMove();
        }
    }

    updateLevel(level) {
        this.ai.setLevel(level);
        const levelText = this.levelNames[level] || "Cấp độ tùy chỉnh";
        
        const badge = $('#current-level-badge');
        badge.html(`<span class="animate-pulse">✨</span> ${levelText}`);
        
        // Hiệu ứng nháy nền nhẹ để báo hiệu đã cập nhật
        badge.addClass('bg-yellow-200 rounded-lg transition-colors duration-500');
        setTimeout(() => {
            badge.removeClass('bg-yellow-200');
        }, 500);
    }

    undoMove() {
        if (this.game.history().length === 0) return;
        $('#game-overlay').hide();
        clearTimeout(this.overlayTimer); // Hủy lệnh hiện thông báo nếu bé bấm lùi nhanh
        
        if (this.game.game_over()) {
            this.game.undo();
            this.isGameActive = true;
        } else {
            this.game.undo();
            this.game.undo();
        }
        this.updateBoardUI();
        this.updateStatus();
        this.playSound('move');
        this.removeDangerEffect();
    }

    openSetup() {
        const modal = document.getElementById('setup-modal');
        const select = document.getElementById('level-select');
        
        // Đồng bộ select với level hiện tại của AI
        if (select && this.ai && this.ai.level) {
            select.value = this.ai.level;
        }

        modal.style.display = 'flex';
        const closeBtn = document.getElementById('modal-close-btn');
        closeBtn.style.display = (this.isGameActive || this.game.game_over()) ? 'flex' : 'none';
    }

    closeSetup() {
        // Cập nhật level mới ngay khi đóng modal (nếu đang chơi)
        const select = document.getElementById('level-select');
        if (select) {
            const newLevel = parseInt(select.value);
            this.updateLevel(newLevel);
        }
        document.getElementById('setup-modal').style.display = 'none';
    }

    playSound(type) {
        if (['start', 'victory', 'defeat'].includes(type)) {
             this.sounds['victory'].pause(); this.sounds['victory'].currentTime = 0;
             this.sounds['defeat'].pause(); this.sounds['defeat'].currentTime = 0;
             this.sounds['start'].pause(); this.sounds['start'].currentTime = 0;
        }
        if (this.sounds[type]) {
            if (this.userHasInteracted || ['check', 'move', 'capture'].includes(type)) {
                this.sounds[type].currentTime = 0;
                this.sounds[type].play().catch(() => {});
            }
        }
    }

    triggerCheckWarning() {
        const boardContainer = document.getElementById('board-container');
        boardContainer.classList.add('danger-zone');
        this.playSound('check');
        const turn = this.game.turn();
        const board = this.game.board();
        let kingSquare = null;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && piece.type === 'k' && piece.color === turn) {
                    kingSquare = String.fromCharCode(97 + j) + (8 - i);
                    break;
                }
            }
        }
        if (kingSquare) {
            this.board.set({ drawable: { shapes: [{ orig: kingSquare, brush: 'red' }] } });
            setTimeout(() => {
                const colorName = turn === 'w' ? 'white' : 'black';
                const kingPiece = document.querySelector(`.cg-wrap piece.king.${colorName}`);
                if (kingPiece) kingPiece.classList.add('king-alarm');
            }, 50);
        }
    }

    removeDangerEffect() {
        document.getElementById('board-container').classList.remove('danger-zone');
        document.querySelectorAll('piece').forEach(p => p.classList.remove('king-alarm'));
        if (this.board) this.board.set({ drawable: { shapes: [] } });
    }

    showGameResultOverlay(message, playSound = true) {
        const overlay = $('#game-overlay');
        const textEl = overlay.find('.overlay-text');
        
        if (message.includes('THẮNG')) textEl.css('color', '#22c55e'); // Xanh lá
        else if (message.includes('THUA')) textEl.css('color', '#ef4444'); // Đỏ đậm
        else textEl.css('color', '#eab308'); // Vàng

        textEl.html(message);
        overlay.css('display', 'flex').hide().fadeIn(300);

        // Tự tắt sau 3 giây
        clearTimeout(this.overlayTimer);
        this.overlayTimer = setTimeout(() => {
            overlay.fadeOut(500);
        }, 3000);
    }

    updateBoardUI() {
        const container = document.getElementById('board-container');
        if (!container) return;
        const isInteractable = this.isGameActive && !this.game.game_over();

        // Lấy thông tin nước đi cuối để vẽ mũi tên
        const history = this.game.history({verbose: true});
        const lastMove = history.length > 0 ? history[history.length - 1] : null;

        const config = {
            fen: this.game.fen(),
            orientation: this.playerColor === 'w' ? 'white' : 'black',
            turnColor: this.game.turn() === 'w' ? 'white' : 'black',
            coordinates: false,
            // Tăng thời gian animation lên 1s (1000ms) để bé nhìn rõ quân "chạy"
            animation: { enabled: true, duration: 1000 },
            movable: {
                color: isInteractable ? (this.playerColor === 'w' ? 'white' : 'black') : null,
                free: false,
                dests: this.getValidMoves(),
                events: { after: (orig, dest) => this.onPlayerMove(orig, dest) }
            },
            drawable: { 
                enabled: true, 
                visible: true,
                shapes: this.getLastMoveArrow() 
            },
            lastMove: lastMove ? [lastMove.from, lastMove.to] : null
        };

        if (!this.board) {
            this.board = Chessground(container, config);
        } else {
            this.board.set(config);
        }
    }

    getValidMoves() {
        if (this.game.turn() !== this.playerColor) return new Map();
        const dests = new Map();
        this.game.SQUARES.forEach(s => {
            const ms = this.game.moves({ square: s, verbose: true });
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    getLastMoveArrow() {
        const history = this.game.history({verbose: true});
        if (history.length === 0) return [];
        const last = history[history.length - 1];
        return [{ 
            orig: last.from, 
            dest: last.to, 
            brush: 'green',
            modifiers: { lineWidth: 4 } // Mũi tên đậm hơn chút
        }];
    }

    onPlayerMove(orig, dest) {
        if (!this.isGameActive) return;
        const move = this.game.move({ from: orig, to: dest, promotion: 'q' });
        if (move) {
            this.playSound('move');
            
            // Vẽ mũi tên ngay sau khi đi
            this.board.set({ 
                drawable: { shapes: this.getLastMoveArrow() },
                movable: { color: null } 
            });

            this.updateStatus();
            if (!this.game.game_over()) {
                this.triggerAiMove();
            }
        } else {
            this.board.set({ fen: this.game.fen() });
        }
    }

    triggerAiMove() {
        $('#game-status').text('🤔 Máy đang nghĩ...');
        this.ai.getMove(this.game, (bestMove) => {
            this.onAiMove(bestMove);
        });
    }

    onAiMove(moveData) {
        if (!moveData) return;
        let move;
        try {
            if (typeof moveData === 'string' && moveData.length >= 4 && moveData.match(/^[a-h][1-8][a-h][1-8]/)) {
                const from = moveData.substring(0, 2);
                const to = moveData.substring(2, 4);
                const promotion = moveData.length === 5 ? moveData.substring(4, 5) : 'q';
                move = this.game.move({ from, to, promotion });
            } else {
                move = this.game.move(moveData);
            }
        } catch (e) { return; }

        if (move) {
            this.board.set({
                fen: this.game.fen(),
                lastMove: [move.from, move.to],
                turnColor: this.playerColor === 'w' ? 'white' : 'black',
                movable: {
                    color: this.playerColor === 'w' ? 'white' : 'black',
                    dests: this.getValidMoves()
                },
                // Vẽ mũi tên cho nước đi của máy
                drawable: { shapes: this.getLastMoveArrow() }
            });
            this.playSound('move');
            
            // Xóa highlight cũ đi trước khi updateStatus
            this.removeDangerEffect();
            
            this.updateStatus();
        }
    }

    updateStatus() {
        // Chỉ xóa danger effect nếu KHÔNG phải là Checkmate (vì checkmate cần hiện Vua đỏ)
        if (!this.game.in_checkmate()) {
            this.removeDangerEffect();
        }
    // ... rest of updateStatus implementation


        if (this.game.game_over()) {
            this.isGameActive = false;
            this.board.stop(); // Khóa bàn cờ ngay lập tức

            // Logic xử lý nội dung
            let playSoundName = '';
            
            if (this.game.in_checkmate()) {
                // Hiển thị vị trí Vua bị chết ngay lập tức
                this.triggerCheckWarning(); 

                if (this.game.turn() !== this.playerColor) {
                    // Bé thắng
                    this.gameOverMessage = "BÉ GIỎI QUÁ!<br>THẮNG RỒI 🏆";
                    playSoundName = 'victory';
                    confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 } });
                    $('#game-status').html('<span class="text-green-600">🏆 BÉ THẮNG RỒI!</span>');
                } else {
                    // Bé thua
                    this.gameOverMessage = "BÉ THUA RỒI<br>TIẾC QUÁ 😢";
                    playSoundName = 'defeat';
                    $('#game-status').html('<span class="text-red-500">😅 Bé thua rồi.</span>');
                }
            } else if (this.game.in_draw()) {
                this.gameOverMessage = "HÒA RỒI!<br>BẮT TAY NÀO 🤝";
                $('#game-status').text('🤝 Ván cờ hòa!');
            } else {
                this.gameOverMessage = "HẾT CỜ!";
            }

            // --- PHẦN QUAN TRỌNG: TRÌ HOÃN HIỂN THỊ CHỮ ---
            
            // 1. Phát âm thanh ngay lập tức để tạo cảm xúc
            if (playSoundName && this.userHasInteracted) {
                this.playSound(playSoundName);
            }

            // 2. Đợi 2 giây (2000ms) để bé nhìn bàn cờ và nước đi cuối
            // Trong lúc này: Vua vẫn nhấp nháy đỏ (nếu bị chiếu hết), nước đi cuối (lastMove) vẫn sáng
            clearTimeout(this.overlayTimer);
            this.overlayTimer = setTimeout(() => {
                this.showGameResultOverlay(this.gameOverMessage, false); // false = không phát lại nhạc
            }, 2000);

        } else {
            // Game chưa kết thúc
            if (this.game.in_check()) {
                if (this.game.turn() === this.playerColor) {
                    $('#game-status').html('<span class="text-red-600 font-black">⚡ CỨU VUA NGAY!</span>');
                    this.triggerCheckWarning(); 
                } else {
                    $('#game-status').text('🔥 Bé đang chiếu máy!');
                    this.playSound('check');
                }
            } else {
                if (this.game.turn() === this.playerColor) {
                    $('#game-status').text('👉 Lượt của bé');
                }
            }
        }
    }

    // ... (Giữ nguyên các hàm khác) ...
    showGameResultOverlay(message, playSound = true) {
        const overlay = $('#game-overlay');
        const textEl = overlay.find('.overlay-text');
        
        if (message.includes('THẮNG')) textEl.css('color', '#22c55e');
        else if (message.includes('THUA')) textEl.css('color', '#ef4444');
        else textEl.css('color', '#eab308');

        textEl.html(message);
        overlay.css('display', 'flex').hide().fadeIn(300);

        if (playSound && this.userHasInteracted) {
             // Logic playSound đã xử lý ở updateStatus, hàm này chỉ để fallback
             // Hoặc dùng khi click lại vào bàn cờ
        }

        clearTimeout(this.overlayTimer);
        this.overlayTimer = setTimeout(() => {
            overlay.fadeOut(500);
        }, 3000);
    }
    
    // ... (Giữ nguyên phần còn lại) ...
    triggerAiMove() {
        $('#game-status').text('🤔 Máy đang nghĩ...');
        this.ai.getMove(this.game, (bestMove) => {
            this.onAiMove(bestMove);
        });
    }

    showHint() {
        if (this.game.turn() !== this.playerColor || this.game.game_over()) return;
        const moves = this.game.moves({ verbose: true });
        if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            this.board.set({ drawable: { shapes: [{ orig: randomMove.from, dest: randomMove.to, brush: 'green' }] } });
            setTimeout(() => {
                if(!this.game.in_check()) this.board.set({ drawable: { shapes: [] } });
            }, 2000);
        }
    }
}

$(document).ready(function() {
    window.gameController = new GameController();
    $('#undo-btn').click(() => window.gameController.undoMove());
    $('#hint-btn').click(() => window.gameController.showHint());
    $(window).resize(() => {
        if(window.gameController.board) window.gameController.updateBoardUI();
    });
});