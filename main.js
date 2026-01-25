/**
 * Main Game Controller v2.62
 * Phiên bản ổn định: Fix lỗi bàn cờ, tối ưu hiệu ứng & âm thanh
 */
class GameController {
  constructor() {
    this.game = new Chess();
    this.ai = new AIController();
    const MISTRAL_API_KEY = "p4UmPsFzAeHNg4SWeVVRGMcEPMK7b28D"; // Vui lòng điền API Key Mistral của bạn vào đây
    this.humanAi = new HumanAiEngine(MISTRAL_API_KEY);
    this.analyzer = new GameAnalyzer(MISTRAL_API_KEY);
    this.board = null;
    this.playerColor = "w";
    this.isGameActive = false;
    this.currentLevel = 1;
    this.gameOverMessage = "";
    this.overlayTimer = null;
    this.autoSetupTimer = null;

    this.userHasInteracted = false;

    // Online Mode
    this.online = null;
    this.isOnlineMode = false;
    this.onlineRoomId = null;

    this.levelNames = {
      1: "🐣 Cấp 1: Tập chơi (Rất Dễ)",
      2: "🐤 Cấp 2: Biết chơi (Dễ)",
      3: "🦊 Cấp 3: Thử thách (Vừa)",
      4: "🐯 Cấp 4: Thông minh (Khó)",
      5: "🦁 Cấp 5: Siêu đẳng (Rất Khó)",
      6: "🤖 Cấp 6: Siêu Trí Tuệ (AI)",
    };

    this.charNames = {
      1: "🐣 Gà con",
      2: "🐤 Bạn Vịt",
      3: "🦊 Anh Cáo",
      4: "🐯 Chú Hổ",
      5: "🦁 Lão Sư Tử",
      6: "🤖 Siêu Trí Tuệ",
    };

    this.pieceNames = {
      p: "Quân Tốt",
      n: "Quân Mã",
      b: "Quân Tượng",
      r: "Quân Xe",
      q: "Quân Hậu",
      k: "Quân Vua",
    };

    this.sounds = {
      move: this.loadSound("move"),
      capture: this.loadSound("capture"),
      check: this.loadSound("check"),
      victory: this.loadSound("victory"),
      defeat: this.loadSound("defeat"),
      start: this.loadSound("tournament3rd"),
      victory_kid: this.loadSound("chien-thang"),
      defeat_kid: this.loadSound("thua-cuoc"),
      defeat_lv4: this.loadSound("thua-cuoc-lv4"),
      defeat_lv5: this.loadSound("thua-cuoc-lv5"),
    };
    Object.values(this.sounds).forEach((s) => s.load());

    document.addEventListener("touchstart", this.handleInteraction, {
      once: true,
    });
    document.addEventListener("mousedown", this.handleInteraction, {
      once: true,
    });

    // Check AI Connection
    this.humanAi.checkConnection();

    // Khi game over, bấm vào bàn cờ sẽ hiện lại thông báo ngay lập tức
    $("#board-container").on("click", () => {
      if (this.game.game_over()) {
        clearTimeout(this.overlayTimer);
        this.showGameResultOverlay(this.gameOverMessage, false);
      }
    });
  }

  handleInteraction = () => {
    this.userHasInteracted = true;
  };

  loadSound(fileName) {
    const audio = new Audio();

    // Thử nhiều biến thể tên file để tránh lỗi chữ hoa/thường trên Linux
    const variations = [
      fileName, // move
      fileName.toLowerCase(), // move
      fileName.charAt(0).toUpperCase() + fileName.slice(1), // Move
      fileName.toUpperCase(), // MOVE
    ];

    // Loại bỏ trùng lặp
    const uniqueNames = [...new Set(variations)];

    uniqueNames.forEach((name) => {
      ["mp3", "ogg", "MP3", "OGG"].forEach((ext) => {
        const src = document.createElement("source");
        src.src = `assets/${name}.${ext}`;
        src.type = `audio/${ext.toLowerCase() === "mp3" ? "mpeg" : "ogg"}`;
        audio.appendChild(src);
      });
    });

    audio.addEventListener(
      "error",
      (e) => {
        console.warn(
          `⚠️ Lỗi tải audio assets/${fileName} - Đang thử file dự phòng...`,
        );
      },
      true,
    );

    audio.load();
    return audio;
  }

  startGame(level, color) {
    // 1. Teardown Online Mode
    this.isOnlineMode = false;
    this.onlineRoomId = null;
    if (this.online) {
      this.online.stopPolling();
      this.online = null;
      $("#online-status-msg").hide();
    }
    // Restore Offline UI
    $("#version-badge").show();
    $("#hint-btn").show(); // Show hint button in offline mode
    $("#undo-btn")
      .prop("disabled", false)
      .removeClass("opacity-50 cursor-not-allowed"); // Enable undo in offline

    // 2. Setup Offline Game
    this.playerColor = color;
    this.game.reset();
    this.isGameActive = true;
    this.gameOverMessage = "";

    $("#game-overlay").hide();
    clearTimeout(this.overlayTimer);
    clearTimeout(this.autoSetupTimer);

    this.updateLevel(level);

    this.updateBoardUI();
    this.updateStatus();
    this.playSound("start");

    // Xóa bỏ phân tích ván cũ
    this.analyzer.clear(this.board);

    if (this.playerColor === "b") {
      this.triggerAiMove();
    }
  }

  startOnlineGame(roomId, colorPref) {
    // 1. Teardown Offline Mode
    this.isOnlineMode = true;
    this.onlineRoomId = roomId;
    this.currentLevel = 0; // 0 indicates Online/No AI logic

    // Stop any pending AI or timers
    clearTimeout(this.overlayTimer);
    clearTimeout(this.autoSetupTimer);

    // 2. Setup Online Game
    this.game.reset(); // Reset local board
    this.gameOverMessage = "";

    // UI Reset
    $("#game-overlay").hide();
    $("#game-status").html(
      '<span class="text-blue-600 animate-pulse">⏳ Đang kết nối server...</span>',
    );
    $("#version-badge").hide(); // Hide offline version badge

    // Initialize Online Module
    if (this.online) this.online.stopPolling();
    this.online = new window.OnlineChess(roomId, (state) =>
      this.handleOnlineState(state),
    );

    $("#online-status-msg")
      .text("Đang vào phòng...")
      .show()
      .removeClass("hidden");

    // Join with Color Preference
    this.online.join(colorPref).then((data) => {
      if (!data || data.error) {
        alert(data ? data.error : "Lỗi kết nối Server!");
        this.startGame(1, "w"); // Fallback to offline
        return;
      }
      $("#online-status-msg").text("Bé đã vào phòng!").fadeOut(3000);
      $("#online-status-msg").text("Bé đã vào phòng!").fadeOut(3000);
      console.log("Joined Room:", data);
      window.gameController.playSound("start"); // Play start sound correctly
      $("#hint-btn").hide(); // Hide hint button in online mode
      $("#undo-btn")
        .prop("disabled", true)
        .addClass("opacity-50 cursor-not-allowed"); // Disable undo in online
    });
  }

  handleOnlineState(state) {
    if (!this.isOnlineMode) return;

    // 1. Update Role/Color
    if (state.my_role === "w") this.playerColor = "w";
    else if (state.my_role === "b") this.playerColor = "b";
    else this.playerColor = "spectator"; // Full room

    // 2. Update Status Text
    if (state.status === "waiting") {
      $("#game-status").html(
        '<span class="text-blue-500 animate-pulse">⏳ Đang đợi người khác vào...</span>',
      );
      this.board.set({ movable: { color: null } }); // Freeze board
      // Close opponent left modal if open (maybe they rejoined)
      $("#opponent-left-modal").fadeOut();
      return;
    }

    if (state.status === "opponent_disconnected") {
      // Show Modal instead of auto switch
      $("#opponent-left-modal").fadeIn();
      this.playSound("defeat"); // Sound alert
      return;
    }

    // Hide modal if playing
    if (state.status === "playing") {
      $("#opponent-left-modal").fadeOut();
    }

    // 3. Sync Board
    if (state.fen !== this.game.fen()) {
      const loadRes = this.game.load(state.fen);
      if (!loadRes && state.fen === "start") this.game.reset();

      this.playSound("move");
      this.updateBoardUI();
      this.updateBoardUI();
      this.updateStatus();

      // Check for game over on server state
      if (this.game.game_over()) {
        const isWin =
          this.game.in_checkmate() && this.game.turn() !== this.playerColor;
        const isLoss =
          this.game.in_checkmate() && this.game.turn() === this.playerColor;
        const isDraw = this.game.in_draw();

        if (isWin) {
          this.playSound("victory");
          this.showGameResultOverlay("BẠN THẮNG RỒI! 🏆", false);
        } else if (isLoss) {
          this.playSound("defeat");
          this.showGameResultOverlay("BẠN THUA RỒI! 😢", false);
        } else if (isDraw) {
          this.showGameResultOverlay("HÒA CỜ! 🤝", false);
        }
      }
    }

    // 4. Turn Indication & Hints
    if (state.status === "playing") {
      const isMyTurn = this.game.turn() === this.playerColor;

      if (isMyTurn) {
        $("#game-status").html(
          `<span class="text-green-600 font-bold">👉 ĐẾN LƯỢT QUÂN (${this.playerColor === "w" ? "TRẮNG" : "ĐEN"})</span>`,
        );
        // Auto Show Visual Hints (dots) handled by Chessground
      } else {
        $("#game-status").html(
          `<span class="text-gray-500">⏳ Đợi đối thủ đi...</span>`,
        );
      }
    }
  }

  switchToAi() {
    // User chose to play with Bot Level 6
    $("#opponent-left-modal").fadeOut();
    $("#online-status-msg").hide();

    if (this.online) {
      this.online.leave(); // Notify server cleanup
      this.online = null;
    }
    this.isOnlineMode = false;

    // Continue from current position
    this.currentLevel = 6;
    this.ai.setLevel(6);
    this.isGameActive = true;

    this.updateBoardUI(); // Refresh board interaction
    this.updateStatus(); // Refresh status text
    this.updateLevel(6); // Show Level 6 Badge

    // If it's now Bot's turn (and I played last), trigger bot
    if (this.game.turn() !== this.playerColor) {
      this.triggerAiMove();
    }
  }

  waitForOpponent() {
    $("#opponent-left-modal").fadeOut();
    $("#game-status").html(
      '<span class="text-blue-500 animate-pulse">⏳ Đang đợi bạn quay lại...</span>',
    );
    // Do nothing, just keep polling
  }

  updateLevel(level) {
    this.currentLevel = level;
    this.ai.setLevel(level);
    const levelText = this.levelNames[level] || "Cấp độ tùy chỉnh";

    const badge = $("#current-level-badge");
    badge.html(`<span class="animate-pulse">✨</span> ${levelText}`);

    // Hiệu ứng nháy nền nhẹ để báo hiệu đã cập nhật
    badge.addClass("bg-yellow-200 rounded-lg transition-colors duration-500");
    setTimeout(() => {
      badge.removeClass("bg-yellow-200");
    }, 500);
  }

  undoMove() {
    // Prevent undo in online mode to avoid desync
    if (this.isOnlineMode) {
      $("#game-status").html(
        '<span class="text-red-500 font-bold">⚠️ Không thể lùi lại trong chế độ online!</span>',
      );
      setTimeout(() => this.updateStatus(), 2000);
      return;
    }

    if (this.game.history().length === 0) return;
    $("#game-overlay").hide();
    clearTimeout(this.overlayTimer);
    clearTimeout(this.autoSetupTimer);

    if (this.game.game_over()) {
      this.game.undo();
      this.isGameActive = true;
    } else {
      this.game.undo();
      this.game.undo();
    }
    this.updateBoardUI();
    this.updateStatus();
    this.playSound("move");
    this.removeDangerEffect();
    this.analyzer.clear(this.board);
  }

  openSetup() {
    const modal = document.getElementById("setup-modal");
    const select = document.getElementById("level-select");

    if (select && this.ai && this.ai.level) {
      select.value = this.ai.level;
    }

    modal.style.display = "flex";
    const closeBtn = document.getElementById("modal-close-btn");
    // Always show close button now that we fixed the UI logic
    if (closeBtn) closeBtn.style.display = "flex";
  }

  closeSetup() {
    const select = document.getElementById("level-select");
    if (select) {
      const newLevel = parseInt(select.value);
      this.updateLevel(newLevel);
    }
    document.getElementById("setup-modal").style.display = "none";
  }

  playSound(type) {
    const musicTypes = [
      "start",
      "victory",
      "defeat",
      "victory_kid",
      "defeat_kid",
      "defeat_lv4",
      "defeat_lv5",
    ];
    if (musicTypes.includes(type)) {
      musicTypes.forEach((t) => {
        if (this.sounds[t]) {
          this.sounds[t].pause();
          this.sounds[t].currentTime = 0;
        }
      });
    }
    if (this.sounds[type]) {
      if (
        this.userHasInteracted ||
        ["check", "move", "capture"].includes(type)
      ) {
        this.sounds[type].currentTime = 0;
        this.sounds[type].play().catch(() => {});
      }
    }
  }

  triggerCheckWarning() {
    const boardContainer = document.getElementById("board-container");
    boardContainer.classList.add("danger-zone");
    this.playSound("check");
    const turn = this.game.turn();
    const board = this.game.board();
    let kingSquare = null;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.type === "k" && piece.color === turn) {
          kingSquare = String.fromCharCode(97 + j) + (8 - i);
          break;
        }
      }
    }
    if (kingSquare) {
      this.board.set({
        drawable: { shapes: [{ orig: kingSquare, brush: "red" }] },
      });
      setTimeout(() => {
        const colorName = turn === "w" ? "white" : "black";
        const kingPiece = document.querySelector(
          `.cg-wrap piece.king.${colorName}`,
        );
        if (kingPiece) kingPiece.classList.add("king-alarm");
      }, 50);
    }
  }

  removeDangerEffect() {
    document.getElementById("board-container").classList.remove("danger-zone");
    document
      .querySelectorAll("piece")
      .forEach((p) => p.classList.remove("king-alarm"));
    if (this.board) this.board.set({ drawable: { shapes: [] } });
  }

  showGameResultOverlay(message, playSound = true) {
    const overlay = $("#game-overlay");
    const textEl = overlay.find(".overlay-text");

    if (message.includes("THẮNG")) textEl.css("color", "#22c55e");
    else if (message.includes("THUA")) textEl.css("color", "#ef4444");
    else textEl.css("color", "#eab308");

    textEl.html(message);
    overlay.css("display", "flex").hide().fadeIn(300);

    clearTimeout(this.overlayTimer);
    this.overlayTimer = setTimeout(() => {
      overlay.fadeOut(500);
    }, 3000);
  }

  updateBoardUI() {
    const container = document.getElementById("board-container");
    if (!container) return;

    // For online mode, always allow interaction if it's my playing turn
    let isInteractable = this.isGameActive && !this.game.game_over();
    if (this.isOnlineMode) {
      isInteractable = this.game.turn() === this.playerColor;
    }

    const history = this.game.history({ verbose: true });
    const lastMove = history.length > 0 ? history[history.length - 1] : null;

    const config = {
      fen: this.game.fen(),
      orientation: this.playerColor === "w" ? "white" : "black",
      turnColor: this.game.turn() === "w" ? "white" : "black",
      coordinates: false,
      animation: { enabled: true, duration: 500 },
      movable: {
        color: isInteractable
          ? this.playerColor === "w"
            ? "white"
            : "black"
          : null,
        free: false,
        dests: this.getValidMoves(),
        events: { after: (orig, dest) => this.onPlayerMove(orig, dest) },
      },
      drawable: {
        enabled: true,
        visible: true,
        shapes: this.getLastMoveArrow(),
      },
      lastMove: lastMove ? [lastMove.from, lastMove.to] : null,
      events: {
        select: (key) => this.onSquareSelect(key),
      },
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
    this.game.SQUARES.forEach((s) => {
      const ms = this.game.moves({ square: s, verbose: true });
      if (ms.length)
        dests.set(
          s,
          ms.map((m) => m.to),
        );
    });
    return dests;
  }

  getLastMoveArrow() {
    const history = this.game.history({ verbose: true });
    if (history.length === 0) return [];
    const last = history[history.length - 1];
    return [
      {
        orig: last.from,
        dest: last.to,
        brush: "green",
        modifiers: { lineWidth: 4 },
      },
    ];
  }

  calculateMoveDuration(from, to) {
    const fileMap = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };
    const x1 = fileMap[from[0]];
    const y1 = parseInt(from[1]);
    const x2 = fileMap[to[0]];
    const y2 = parseInt(to[1]);

    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return Math.max(400, Math.round(dist * 300));
  }

  onSquareSelect(key) {
    if (
      !this.isGameActive ||
      this.game.game_over() ||
      this.game.turn() !== this.playerColor
    )
      return;

    // Khi bật chế độ Mind-reading (Cấp 6), không hiển thị tên quân cờ để tránh đè trạng thái
    if (this.currentLevel === 6) return;

    const piece = this.game.get(key);
    if (piece) {
      const pieceName = this.pieceNames[piece.type] || "Quân cờ";
      const subject = this.currentLevel >= 4 ? "Đây là" : "✨ Đây là";
      $("#game-status").html(
        `<span class="text-blue-600 font-bold">${subject}: ${pieceName}</span>`,
      );
    } else {
      this.updateStatus();
    }
  }

  onPlayerMove(orig, dest) {
    if (this.isOnlineMode && this.game.turn() !== this.playerColor) {
      return; // Not your turn
    }

    if (!this.isGameActive && !this.isOnlineMode) return;
    // For online mode, game is active if status is playing, checked in onPlayerMove logic via turn color

    // Optimistic UI Update first?
    // No, for reliability, let's validate validity first using Chess.js
    // We clone the game to test the move

    const move = this.game.move({ from: orig, to: dest, promotion: "q" });
    if (move) {
      if (this.isOnlineMode) {
        // Send to server
        this.online.move(this.game.fen(), move.san);
        // UI update will happen when server confirms (via polling)
        // OR we can do optimistic update:
        this.updateBoardUI();
        this.playSound("move");

        if (move.captured) {
          this.playSound("capture");
          this.triggerCaptureEffect(dest, true);
        }
      } else {
        // Offline Logic (Existing)
        this.playSound("move");

        if (move.captured) {
          this.playSound("capture");
          this.triggerCaptureEffect(dest, true);
        }

        this.board.set({
          drawable: { shapes: this.getLastMoveArrow() },
          movable: { color: null },
        });

        this.updateStatus();

        let specialMessage = "";
        if (move.flags.includes("e")) {
          specialMessage = "BẮT TỐT<br>QUA ĐƯỜNG! 😲";
        } else if (move.flags.includes("p") || move.flags.includes("cp")) {
          specialMessage = "PHONG HẬU! 😎";
        } else if (move.flags.includes("k") || move.flags.includes("q")) {
          specialMessage = "NHẬP THÀNH! 🛡️";
        }

        if (specialMessage) {
          this.showGameResultOverlay(specialMessage, false);
          if (!this.game.game_over()) {
            setTimeout(() => this.triggerAiMove(), 2000);
          }
        } else {
          if (!this.game.game_over()) {
            this.triggerAiMove();
          }
        }
      }
    } else {
      this.board.set({ fen: this.game.fen() });
    }
  }

  triggerAiMove() {
    // Special case: In online mode, we don't trigger AI move, BUT we might want hints
    if (this.isOnlineMode) return;

    if (this.currentLevel === 6) {
      // HumanAiEngine sẽ tự hiển thị trạng thái suy nghĩ của nó
      this.humanAi.getMove(this.game, (bestMove) => {
        this.onAiMove(bestMove);
      });
    } else {
      const charName = this.charNames[this.currentLevel] || "Máy";
      $("#game-status").text(`${charName} đang suy nghĩ...`);
      setTimeout(() => {
        this.ai.getMove(this.game, (bestMove) => {
          this.onAiMove(bestMove);
        });
      }, 1000);
    }
  }

  onAiMove(moveData) {
    if (!moveData) return;
    let move;
    try {
      if (
        typeof moveData === "string" &&
        moveData.length >= 4 &&
        moveData.match(/^[a-h][1-8][a-h][1-8]/)
      ) {
        const from = moveData.substring(0, 2);
        const to = moveData.substring(2, 4);
        const promotion =
          moveData.length === 5 ? moveData.substring(4, 5) : "q";
        move = this.game.move({ from, to, promotion });
      } else {
        move = this.game.move(moveData);
      }
    } catch (e) {
      return;
    }

    if (move) {
      const moveDuration = this.calculateMoveDuration(move.from, move.to);

      if (move.captured) {
        this.playSound("capture");
        this.triggerCaptureEffect(move.to, false);
      }

      this.board.set({
        fen: this.game.fen(),
        lastMove: [move.from, move.to],
        turnColor: this.playerColor === "w" ? "white" : "black",
        animation: { enabled: true, duration: moveDuration },
        movable: {
          color: this.playerColor === "w" ? "white" : "black",
          dests: this.getValidMoves(),
        },
        drawable: { shapes: this.getLastMoveArrow() },
      });
      this.playSound("move");

      this.removeDangerEffect();
      this.updateStatus();

      let specialMessage = "";
      if (move.flags.includes("e")) {
        specialMessage = "BẮT TỐT<br>QUA ĐƯỜNG! 😲";
      } else if (move.flags.includes("p") || move.flags.includes("cp")) {
        specialMessage = "PHONG HẬU! 😎";
      } else if (move.flags.includes("k") || move.flags.includes("q")) {
        specialMessage = "NHẬP THÀNH! 🛡️";
      }

      if (specialMessage) {
        this.showGameResultOverlay(specialMessage, false);
      }
    }
  }

  updateStatus() {
    if (!this.game.in_checkmate()) {
      this.removeDangerEffect();
      // Khôi phục hiển thị version nếu không còn bị chiếu
      if (!this.game.in_check()) {
        $("#version-badge").show();
        $("#check-badge").addClass("hidden");
      }
    }

    if (this.game.game_over()) {
      this.isGameActive = false;
      this.board.stop();

      let playSoundName = "";

      if (this.game.in_checkmate()) {
        this.triggerCheckWarning();

        if (this.game.turn() !== this.playerColor) {
          const charName = this.charNames[this.currentLevel] || "Máy";
          const subject = this.currentLevel >= 4 ? "BẠN" : "BÉ";
          this.gameOverMessage = `${subject} THẮNG ${charName.toUpperCase()}<br>RỒI! GIỎI QUÁ 🏆`;

          if ([1, 2, 3].includes(this.currentLevel)) {
            playSoundName = "victory_kid";
          } else {
            playSoundName = "victory";
          }

          // Pháo hoa chiến thắng 5 giây
          const end = Date.now() + 5500;
          const colors = ["#22c55e", "#ffffff", "#fbbf24", "#ef4444"];

          (function frame() {
            confetti({
              particleCount: 5,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.7 },
              colors: colors,
              zIndex: 2000,
            });
            confetti({
              particleCount: 5,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.7 },
              colors: colors,
              zIndex: 2000,
            });
            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          })();

          $("#game-status").html(
            `<span class="text-green-600">🏆 ${subject} THẮNG ${charName.toUpperCase()} RỒI!</span>`,
          );
        } else {
          const charName = this.charNames[this.currentLevel] || "Máy";
          const subject = this.currentLevel >= 4 ? "BẠN" : "BÉ";
          this.gameOverMessage = `${charName.toUpperCase()} THẮNG RỒI<br>${subject} CỐ LÊN NHÉ 😢`;

          if ([1, 2, 3].includes(this.currentLevel)) {
            playSoundName = "defeat_kid";
          } else if (this.currentLevel === 4) {
            playSoundName = "defeat_lv4";
          } else if (this.currentLevel === 5) {
            playSoundName = "defeat_lv5";
          } else {
            playSoundName = "defeat";
          }

          $("#game-status").html(
            `<span class="text-red-500">😅 ${charName} thắng rồi.</span>`,
          );
        }
      } else if (this.game.in_draw()) {
        this.gameOverMessage = "HÒA RỒI!<br>BẮT TAY NÀO 🤝";
        $("#game-status").text("🤝 Ván cờ hòa!");
      } else {
        this.gameOverMessage = "HẾT CỜ!";
      }

      if (playSoundName && this.userHasInteracted) {
        this.playSound(playSoundName);
      }

      this.overlayTimer = setTimeout(() => {
        this.showGameResultOverlay(this.gameOverMessage, false);
      }, 2000);

      // Chạy phân tích ván đấu (Level 1-5: Visual, Level 6: AI)
      this.analyzer.runAnalysis(
        this.game,
        this.currentLevel,
        this.board,
        this.playerColor,
      );

      // Tự động hiện bảng cài đặt sau 10 giây
      clearTimeout(this.autoSetupTimer);
      this.autoSetupTimer = setTimeout(() => {
        this.openSetup();
      }, 10000);
    } else {
      if (this.game.in_check()) {
        // Luôn hiện thông báo chiếu ở khu vực badge để không đè game-status
        $("#version-badge").hide();
        $("#check-badge").removeClass("hidden");

        if (this.game.turn() === this.playerColor) {
          const charName = this.charNames[this.currentLevel] || "Máy";
          // Ở Level 6, không ghi đè game-status để AI còn nói chuyện
          if (this.currentLevel !== 6) {
            $("#game-status").html(
              `<span class="text-red-600 font-black">⚡ ${charName.toUpperCase()} ĐANG CHIẾU!</span>`,
            );
          }
          this.triggerCheckWarning();
        } else {
          const charName = this.charNames[this.currentLevel] || "Máy";
          const subject = this.currentLevel >= 4 ? "Bạn" : "Bé";
          if (this.currentLevel !== 6) {
            $("#game-status").text(`🔥 ${subject} đang chiếu ${charName}!`);
          }
          this.playSound("check");
        }
      } else {
        // Hết chiếu thì hiện lại version
        $("#version-badge").show();
        $("#check-badge").addClass("hidden");

        if (this.game.turn() === this.playerColor) {
          const subject = this.currentLevel >= 4 ? "Bạn" : "Bé";
          // Ở Level 6, ra lệnh dừng gõ để hiện thông báo lượt của người chơi
          if (this.currentLevel === 6) {
            this.humanAi.stopTyping();
          }
          $("#game-status").text(`👉 Lượt của ${subject.toLowerCase()}`);
        }
      }
    }
  }

  triggerCaptureEffect(square, isPlayerCapturing) {
    const coords = this.getSquareScreenCoordinates(square);
    if (!coords) return;

    if (isPlayerCapturing) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: coords,
          colors: ["#22c55e", "#eab308", "#3b82f6", "#ef4444"],
          gravity: 1.2,
          scalar: 0.8,
          disableForReducedMotion: false,
          zIndex: 2000,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      const pieceColor = this.playerColor === "w" ? "#f3f4f6" : "#374151";
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: coords,
          colors: [pieceColor, "#9ca3af"],
          gravity: 2,
          startVelocity: 20,
          ticks: 100,
          shapes: ["square"],
          scalar: 0.6,
          disableForReducedMotion: false,
          zIndex: 2000,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  getSquareScreenCoordinates(square) {
    const container = document.getElementById("board-container");
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1]) - 1;

    const isWhiteSide = this.playerColor === "w";

    const x = isWhiteSide ? file : 7 - file;
    const y = isWhiteSide ? 7 - rank : rank;

    const squareWidth = rect.width / 8;
    const squareHeight = rect.height / 8;

    const centerX = rect.left + x * squareWidth + squareWidth / 2;
    const centerY = rect.top + y * squareHeight + squareHeight / 2;

    return {
      x: centerX / window.innerWidth,
      y: centerY / window.innerHeight,
    };
  }

  showHint() {
    if (this.game.game_over()) return;

    // Allow hint in Online Mode if it's my turn
    if (this.isOnlineMode && this.game.turn() !== this.playerColor) return;
    if (!this.isOnlineMode && this.game.turn() !== this.playerColor) return;

    const btn = $("#hint-btn");
    const originalText = btn.html();
    btn.prop("disabled", true).html("🤔");

    this.ai.getEngineMove(
      this.game.fen(),
      (bestMove) => {
        btn.prop("disabled", false).html(originalText);

        if (bestMove && bestMove.length >= 4) {
          const from = bestMove.substring(0, 2);
          const to = bestMove.substring(2, 4);

          this.board.set({
            drawable: {
              shapes: [
                {
                  orig: from,
                  dest: to,
                  brush: "green",
                  modifiers: { lineWidth: 6 },
                },
              ],
            },
          });
          setTimeout(() => {
            if (!this.game.in_check())
              this.board.set({ drawable: { shapes: [] } });
          }, 3000);
        }
      },
      4,
    );
  }
}

$(document).ready(function () {
  window.gameController = new GameController();
  $("#undo-btn").click(() => window.gameController.undoMove());
  $("#hint-btn").click(() => window.gameController.showHint());
  $(window).resize(() => {
    if (window.gameController.board) window.gameController.updateBoardUI();
  });
});
