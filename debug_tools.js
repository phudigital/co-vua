/**
 * Debug Tools - Hỗ trợ kiểm tra tính năng GameAnalyzer
 * Dán code này vào Console hoặc include vào index.php để sử dụng.
 */

window.debugAnalysis = {
  /**
   * Giả lập một ván cờ kết thúc bằng Chiếu Bí (Scholar's Mate)
   * Để kiểm tra Cấp độ 1-5: Mũi tên & Highlight
   */
  testCheckmate: function () {
    if (!window.gameController) {
      console.error("GameController chưa sẵn sàng!");
      return;
    }

    console.log("🚀 Đang giả lập thế cờ Chiếu Bí...");

    // Thế cờ Scholar's Mate: Hậu ăn tốt f7 chiếu bí
    const checkmateFEN =
      "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K2R b KQkq - 0 4";

    // 1. Cập nhật game engine
    window.gameController.game.load(checkmateFEN);

    // 2. Cập nhật bàn cờ giao diện
    window.gameController.board.set({
      fen: checkmateFEN,
      lastMove: ["f3", "f7"],
    });

    // 3. Kích hoạt logic kết thúc ván và phân tích
    window.gameController.updateStatus();

    console.log("✅ Đã kích hoạt! Đợi 2.5 giây để thấy mũi tên phân tích.");
  },

  /**
   * Giả lập thế cờ Hòa (Stalemate)
   */
  testStalemate: function () {
    if (!window.gameController) {
      console.error("GameController chưa sẵn sàng!");
      return;
    }

    console.log("🚀 Đang giả lập thế cờ Hòa (Stalemate)...");

    // Một thế cờ hòa kinh điển: Vua đen không còn nước đi hợp lệ
    const stalemateFEN = "k7/8/1Q6/8/8/8/8/7K b - - 0 1";

    window.gameController.game.load(stalemateFEN);
    window.gameController.board.set({
      fen: stalemateFEN,
      lastMove: ["b7", "b6"],
    });

    window.gameController.updateStatus();
    console.log("✅ Đã kích hoạt! Đợi 2.5 giây để thấy phân tích thế cờ Hòa.");
  },

  /**
   * Giả lập thế cờ Người chơi thắng (Máy bị chiếu bí)
   * Thử nghiệm âm thanh chiến thắng
   */
  testWin: function () {
    if (!window.gameController) {
      console.error("GameController chưa sẵn sàng!");
      return;
    }

    console.log("🚀 Đang giả lập thế cờ Người chơi thắng...");

    // Thế cờ: Đen (Máy) bị chiếu bí bởi Trắng (Bé)
    const winFEN = "R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1";

    window.gameController.game.load(winFEN);
    window.gameController.board.set({
      fen: winFEN,
      lastMove: ["a1", "a8"],
    });

    window.gameController.updateStatus();
    console.log(
      "✅ Đã kích hoạt! Máy đã bị chiếu bí. Nghe thử âm thanh chiến thắng hén!"
    );
  },
  /**
   * Giả lập thế cờ Người chơi thua (Máy thắng)
   * Để kiểm tra âm thanh thua cuộc và thông báo AI
   */
  testLoss: function () {
    if (!window.gameController) {
      console.error("GameController chưa sẵn sàng!");
      return;
    }

    console.log("🚀 Đang giả lập thế cờ Bé thua...");

    // Thế cờ Fool's Mate: Trắng bị chiếu bí ngay lập tức
    const lossFEN =
      "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 3";

    window.gameController.game.load(lossFEN);
    window.gameController.board.set({
      fen: lossFEN,
      lastMove: ["h4", "e1"],
    });

    window.gameController.updateStatus();
    console.log(
      "✅ Đã kích hoạt! Bé đã bị chiếu bí. Thử chia buồn cùng bé hén!"
    );
  },
};

console.log("🛠️ Debug Tools đã sẵn sàng!");
console.log("👉 Gõ `debugAnalysis.testWin()` để thử Bé thắng (Máy thua).");
console.log("👉 Gõ `debugAnalysis.testLoss()` để thử Bé thua (Máy thắng).");
console.log("👉 Gõ `debugAnalysis.testStalemate()` để thử thế cờ Hòa.");
console.log(
  "👉 Gõ `debugAnalysis.testCheckmate()` để thử Chiếu Bí nhanh (Scholar Mate)."
);
