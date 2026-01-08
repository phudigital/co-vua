/**
 * AI Controller - Fix lỗi Stockfish & Worker Cross-Origin
 */

class AIController {
  constructor() {
    this.level = 1;
    this.stockfish = null;
    this.isEngineReady = false;
    this.enginePath =
      "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";

    // Khởi tạo engine ngay khi load trang
    this.initStockfish();
  }

  async initStockfish() {
    try {
      // Tải code Stockfish về dưới dạng text để tạo Blob Worker
      // Cách này bypass được lỗi CORS khi chạy từ file index.php hoặc localhost
      const response = await fetch(this.enginePath);
      const scriptContent = await response.text();
      const blob = new Blob([scriptContent], {
        type: "application/javascript",
      });
      const objectURL = URL.createObjectURL(blob);

      this.stockfish = new Worker(objectURL);

      this.stockfish.onmessage = (event) => {
        if (event.data === "readyok") {
          this.isEngineReady = true;
          console.log("Stockfish Ready!");
        }
      };

      this.stockfish.postMessage("uci");
      this.stockfish.postMessage("isready");
    } catch (e) {
      console.error("Lỗi khởi tạo Stockfish:", e);
      alert("Không thể tải AI. Vui lòng kiểm tra kết nối mạng!");
    }
  }

  setLevel(lvl) {
    this.level = parseInt(lvl);
  }

  // Hàm chính gọi AI
  getMove(game, callback) {
    if (this.level <= 2) {
      // Cấp độ 1-2: Xử lý nội bộ (Nhanh)
      setTimeout(() => {
        const move = this.getSimpleMove(game);
        callback(move);
      }, 500);
    } else {
      // Cấp độ 3-5: Dùng Stockfish
      this.getEngineMove(game.fen(), callback);
    }
  }

  // AI Đơn giản (Level 1-2)
  getSimpleMove(game) {
    const moves = game.moves();
    if (moves.length === 0) return null;

    // Level 1: Rất dễ - 40% đi ngẫu nhiên
    if (this.level === 1 && Math.random() < 0.85) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    // Level 2: Dễ - Ăn quân nếu được, hoặc random
    const captures = game.moves({ verbose: true }).filter((m) => m.captured);
    if (captures.length > 0) {
      // Ưu tiên ăn quân
      return captures[Math.floor(Math.random() * captures.length)].san;
    }

    return moves[Math.floor(Math.random() * moves.length)];
  }

  // AI Stockfish (Level 3-5)
  getEngineMove(fen, callback, forceLevel = null) {
    if (!this.stockfish || !this.isEngineReady) {
      // Fallback nếu engine chưa tải xong
      console.warn("Stockfish chưa sẵn sàng, dùng random move tạm");
      setTimeout(() => callback(this.getSimpleMove(new Chess(fen))), 500);
      return;
    }

    // Cấu hình độ khó
    let depth = 5;
    let movetime = 1000;
    let skill = 5;

    const targetLevel = forceLevel !== null ? forceLevel : this.level;

    switch (targetLevel) {
      case 3:
        depth = 5;
        movetime = 800;
        skill = 3;
        break; // Vừa
      case 4:
        depth = 10;
        movetime = 1500;
        skill = 10;
        break; // Hơi khó
      case 5:
        depth = 15;
        movetime = 3000;
        skill = 20;
        break; // Khó
    }

    this.stockfish.postMessage("ucinewgame");
    this.stockfish.postMessage(`setoption name Skill Level value ${skill}`);
    this.stockfish.postMessage(`position fen ${fen}`);
    this.stockfish.postMessage(`go depth ${depth} movetime ${movetime}`);

    // Lắng nghe kết quả (chỉ lần này)
    const listener = (event) => {
      if (event.data.startsWith("bestmove")) {
        const bestMove = event.data.split(" ")[1]; // VD: "e2e4"
        this.stockfish.removeEventListener("message", listener);
        callback(bestMove);
      }
    };
    this.stockfish.addEventListener("message", listener);
  }
}
