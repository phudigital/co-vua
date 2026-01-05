/**
 * Main Game Controller v2.3.0
 * Tối ưu âm thanh cho Mobile (Xử lý Autoplay Policy)
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
        this.userHasInteracted = false; // Flag kiểm tra người dùng đã tương tác chưa

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

        // Bắt sự kiện chạm/click đầu tiên trên toàn bộ trang để đánh dấu đã tương tác
        document.addEventListener('touchstart', this.handleInteraction, { once: true });
        document.addEventListener('mousedown', this.handleInteraction, { once: true });

        $('#board-container').on('click', () => {
            if (this.game.game_over()) {
                this.showGameResultOverlay(this.gameOverMessage, false);
            }
        });
    }

    // Hàm xử lý tương tác đầu tiên
    handleInteraction = () => {
        this.userHasInteracted = true;
        console.log("User interacted, audio should now play.");
        // Thử phát lại âm thanh khởi động nếu nó chưa chạy lần đầu
        if (!this.isGameActive && this.sounds.start) {
            this.playSound('start');
        }
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
        this.ai.setLevel(level);
        this.playerColor = color;
        this.game.reset();
        this.isGameActive = true;
        this.gameOverMessage = '';

        $('#game-overlay').hide();
        
        const levelText = this.levelNames[level] || "Cấp độ tùy chỉnh";
        $('#current-level-badge').html(`<span class="animate-pulse">✨</span> Đang đấu với: ${levelText}`);

        this.updateBoardUI();
        this.updateStatus();
        this.playSound('start'); // Âm thanh này có thể không chạy nếu chưa tương tác

        if (this.playerColor === 'b') {
            this.triggerAiMove();
        }
    }

    undoMove() {
        if (this.game.history().length === 0) return;
        $('#game-overlay').hide();
        clearTimeout(this.overlayTimer);
        
        if (this.game.game_over()) {
            this.game.undo();
            this.isGameActive = true;
        } else {
            this.game.undo();
            this.game.undo();
        }
        this.updateBoardUI();
        this.updateStatus();
        this.playSound('move'); // Âm thanh này sẽ chạy nếu user đã tương tác
        this.removeDangerEffect();
    }

    openSetup() {
        document.getElementById('setup-modal').style.display = 'flex';
        const closeBtn = document.getElementById('modal-close-btn');
        closeBtn.style.display = (this.isGameActive || this.game.game_over()) ? 'flex' : 'none';
    }

    closeSetup() {
        document.getElementById('setup-modal').style.display = 'none';
    }

    // NÂNG CẤP PLAY SOUND
    playSound(type) {
        // Dừng các âm thanh dài trước
        if (['start', 'victory', 'defeat'].includes(type)) {
             this.sounds['victory'].pause(); this.sounds['victory'].currentTime = 0;
             this.sounds['defeat'].pause(); this.sounds['defeat'].currentTime = 0;
             this.sounds['start'].pause(); this.sounds['start'].currentTime = 0;
        }
        
        if (this.sounds[type]) {
            // Chỉ cho phép phát âm thanh nếu người dùng đã tương tác HOẶC game đang active (đã có tương tác ngầm)
            // Hoặc là âm thanh check/move/capture - chúng ta thử phát luôn, nếu lỗi thì thôi
            if (this.userHasInteracted || ['check', 'move', 'capture'].includes(type)) {
                this.sounds[type].currentTime = 0;
                const playPromise = this.sounds[type].play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Nếu bị lỗi do chưa tương tác, chúng ta không làm gì cả
                        // console.log(`Audio error for ${type}: ${error.message}`);
                    });
                }
            } else {
                // Nếu là âm thanh 'start' và user chưa tương tác, có thể nó sẽ không chạy
                // Chúng ta sẽ thử lại khi user tương tác lần đầu
                console.log(`Audio ${type} blocked, waiting for user interaction.`);
            }
        }
    }

    triggerCheckWarning() {
        const boardContainer = document.getElementById('board-container');
        boardContainer.classList.add('danger-zone');
        this.playSound('check'); // Âm thanh này sẽ được thử phát
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
        
        if (message.includes('THẮNG')) textEl.css('color', '#22c55e');
        else if (message.includes('THUA')) textEl.css('color', '#ef4444');
        else textEl.css('color', '#eab308');

        textEl.html(message);
        overlay.css('display', 'flex').hide().fadeIn(300);

        if (playSound) {
            // Âm thanh thắng/thua/start sẽ chỉ phát nếu user đã tương tác
            if (this.userHasInteracted) {
                if (message.includes('THẮNG')) this.playSound('victory');
                else if (message.includes('THUA')) this.playSound('defeat');
            }
        }

        clearTimeout(this.overlayTimer);
        this.overlayTimer = setTimeout(() => {
            overlay.fadeOut(500);
        }, 3000);
    }

    updateBoardUI() {
        const container = document.getElementById('board-container');
        if (!container) return;
        const isInteractable = this.isGameActive && !this.game.game_over();

        const config = {
            fen: this.game.fen(),
            orientation: this.playerColor === 'w' ? 'white' : 'black',
            turnColor: this.game.turn() === 'w' ? 'white' : 'black',
            coordinates: false,
            animation: { enabled: true, duration: 300 },
            movable: {
                color: isInteractable ? (this.playerColor === 'w' ? 'white' : 'black') : null,
                free: false,
                dests: this.getValidMoves(),
                events: { after: (orig, dest) => this.onPlayerMove(orig, dest) }
            },
            drawable: { enabled: true, visible: true }
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

    onPlayerMove(orig, dest) {
        if (!this.isGameActive) return;
        const move = this.game.move({ from: orig, to: dest, promotion: 'q' });
        if (move) {
            this.playSound('move'); // Âm thanh này sẽ phát nếu user đã tương tác
            this.updateStatus();
            this.board.set({ movable: { color: null } });
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
                }
            });
            this.playSound('capture'); // Âm thanh này sẽ phát nếu user đã tương tác
            this.updateStatus();
        }
    }

    updateStatus() {
        this.removeDangerEffect();

        if (this.game.game_over()) {
            this.isGameActive = false;
            this.board.stop();

            if (this.game.in_checkmate()) {
                if (this.game.turn() !== this.playerColor) {
                    this.gameOverMessage = "BÉ GIỎI QUÁ!<br>THẮNG RỒI 🏆";
                    // Confetti chỉ chạy nếu user đã tương tác
                    if(this.userHasInteracted) confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 } });
                    $('#game-status').html('<span class="text-green-600">🏆 BÉ THẮNG RỒI!</span>');
                } else {
                    this.gameOverMessage = "BÉ THUA RỒI<br>CỐ GẮNG NHÉ 😢";
                    $('#game-status').html('<span class="text-red-500">😢 Bé thua rồi.</span>');
                }
            } else if (this.game.in_draw()) {
                this.gameOverMessage = "HÒA RỒI!<br>BẮT TAY NÀO 🤝";
                $('#game-status').text('🤝 Ván cờ hòa!');
            } else {
                this.gameOverMessage = "HẾT CỜ!";
            }
            // Overlay sẽ chỉ phát nhạc nếu user đã tương tác
            this.showGameResultOverlay(this.gameOverMessage, this.userHasInteracted); 

        } else {
            if (this.game.in_check()) {
                if (this.game.turn() === this.playerColor) {
                    $('#game-status').html('<span class="text-red-600 font-black">⚡ CỨU VUA NGAY!</span>');
                    this.triggerCheckWarning(); 
                } else {
                    $('#game-status').text('🔥 Bé đang chiếu máy!');
                    this.playSound('check'); // Âm thanh này sẽ phát nếu user đã tương tác
                }
            } else {
                if (this.game.turn() === this.playerColor) {
                    $('#game-status').text('👉 Lượt của bé');
                }
            }
        }
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