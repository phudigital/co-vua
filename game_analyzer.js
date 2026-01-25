/**
 * GameAnalyzer - Phân tích ván đấu sau khi kết thúc
 * Level 1-5: Visual Highlights (Mũi tên & Ô màu)
 * Level 6: AI Master Analysis (Báo cáo chiến thuật từ Mistral AI)
 */

class GameAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.mistralUrl = "https://api.mistral.ai/v1/chat/completions";
    this.analysisContainerId = "#analysis-report";
  }

  /**
   * Chạy phân tích dựa trên cấp độ
   */
  async runAnalysis(game, level, board, playerColor = "w") {
    this.clear(board);

    if (level === 6) {
      await this.generatePostGameReport(game.pgn(), playerColor);
    } else {
      // Đợi overlay hiện ra rồi mới vẽ highlight (khoảng 2.5s)
      setTimeout(() => {
        this.showVisualHints(game, board);
      }, 2500);
    }
  }

  /**
   * Xóa các highlight và báo cáo
   */
  clear(board) {
    $("#analysis-modal").hide();
    $("#analysis-report-content").empty();
    if (board) {
      board.set({ drawable: { shapes: [] } });
      // Xóa các class highlight tùy chỉnh nếu có
      $(".cg-wrap piece").removeClass("king-trapped attacker-highlight");
    }
  }

  /**
   * Level 1-5: Hiển thị gợi ý bằng hình ảnh (Highlight ô & Mũi tên)
   */
  showVisualHints(game, board) {
    if (!game.game_over()) return;

    const turn = game.turn(); // Người vừa thua (đang bị chiếu/hết nước)
    const boardState = game.board();
    let kingSquare = null;

    // 1. Tìm vị trí quân Vua của bên đang bị bí
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = boardState[i][j];
        if (piece && piece.type === "k" && piece.color === turn) {
          kingSquare = String.fromCharCode(97 + j) + (8 - i);
          break;
        }
      }
    }

    if (!kingSquare) return;

    const shapes = [];
    const opponentColor = turn === "w" ? "b" : "w";

    // 2. Highlight quân Vua bị kẹt
    shapes.push({ orig: kingSquare, brush: "red" });

    // 3. Tìm các quân đối phương trực tiếp chiếu hoặc kiểm soát các ô xung quanh Vua
    const squaresToCheck = this.getKingNeighborhood(kingSquare);
    squaresToCheck.push(kingSquare); // Kiểm tra chính ô Vua đang đứng

    const attackers = new Set();

    squaresToCheck.forEach((sq) => {
      // Tạm thời bỏ quân Vua ra để xem ô đó có bị tấn công không (dành cho stalemate)
      // Tuy nhiên Chess.js không hỗ trợ tốt việc "ô này bị kiểm soát bởi quân nào" trực tiếp
      // Chúng ta sẽ quét tất cả quân đối phương
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = boardState[i][j];
          if (piece && piece.color === opponentColor) {
            const fromSq = String.fromCharCode(97 + j) + (8 - i);
            // Kiểm tra nếu quân này có thể đi tới sq (giả định sq trống hoặc có vua)
            if (this.canPieceAttack(game, fromSq, sq)) {
              attackers.add(fromSq);
              shapes.push({ orig: fromSq, dest: sq, brush: "green" });
            }
          }
        }
      }
    });

    // Highlight các quân tấn công
    attackers.forEach((sq) => {
      shapes.push({ orig: sq, brush: "yellow" });
    });

    board.set({
      drawable: { shapes: shapes },
    });
  }

  /**
   * Lấy các ô xung quanh quân Vua
   */
  getKingNeighborhood(sq) {
    const file = sq.charCodeAt(0);
    const rank = parseInt(sq[1]);
    const neighbors = [];

    for (let f = file - 1; f <= file + 1; f++) {
      for (let r = rank - 1; r <= rank + 1; r++) {
        if (f >= 97 && f <= 104 && r >= 1 && r <= 8) {
          const nSq = String.fromCharCode(f) + r;
          if (nSq !== sq) neighbors.push(nSq);
        }
      }
    }
    return neighbors;
  }

  /**
   * Kiểm tra xem một quân cờ có đang kiểm soát ô sq không
   */
  canPieceAttack(game, from, sq) {
    // Chess.js moves() chỉ trả về nước đi của bên ĐANG TỚI LƯỢT.
    // Chúng ta cần trích xuất xem quân tại 'from' có màu gì
    const piece = game.get(from);
    if (!piece) return false;

    const fenParts = game.fen().split(" ");
    // Ép FEN về đúng lượt của quân đang đứng tại 'from'
    fenParts[1] = piece.color;
    // Xóa bỏ thông tin về cản trở chiếu tướng (en passant và castling có thể giữ lại hoặc xóa)
    // Để đơn giản ta chỉ cần đúng lượt đi.
    const forcedFen = fenParts.join(" ");

    try {
      const temp = new Chess(forcedFen);
      const moves = temp.moves({ square: from, verbose: true });
      return moves.some((m) => m.to === sq);
    } catch (e) {
      return false;
    }
  }

  /**
   * Level 6: AI Master Analysis (Mistral AI)
   */
  async generatePostGameReport(pgn, playerColor = "w") {
    if (!this.apiKey) return;

    const $modal = $("#analysis-modal");
    const $content = $("#analysis-report-content");

    // Hiện modal với trạng thái loading
    $modal.fadeIn();
    $content.html(`
            <div class="flex flex-col items-center justify-center p-8">
                <div class="text-5xl mb-4 animate-bounce">🧠</div>
                <div class="text-orange-600 font-black text-lg animate-pulse">Siêu Trí Tuệ đang phân tích...</div>
                <div class="text-gray-400 text-sm mt-2 text-center">Bé đợi xíu để mình xem lại các nước đi nhé!</div>
            </div>
        `);

    const playerSide = playerColor === "w" ? "Trắng (White)" : "Đen (Black)";

    const prompt = `Bạn là một huấn luyện viên cờ vua chuyên nghiệp. Hãy phân tích biên bản ván đấu PGN sau: "${pgn}".
        Người chơi cầm quân ${playerSide}.
        Yêu cầu:
        1. CHỈ tập trung phân tích các nước đi của người chơi cầm quân ${playerSide} đọc tên quân thay về nêu tọa độ ô cờ.
        2. Chỉ ra nước đi sai lầm (đọc tên quân thôi ko nêu tọa độ) then chốt của người chơi (nếu có) và giải thích tại sao.
        3. Ngôn ngữ: Tiếng Việt, ngắn gọn súc tích khoảng 100 chữ`;

    try {
      const response = await fetch(this.mistralUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: "Bạn là Master Chess Coach." },
            { role: "user", content: prompt },
          ],
          max_tokens: 350,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const report = data.choices[0].message.content;

      $content.html(`
                <div class="relative overflow-hidden">
                    <div class="absolute -top-4 -right-4 opacity-10 text-8xl">🏆</div>
                    <h3 class="text-orange-600 font-black text-xl mb-4 flex items-center gap-2">
                        <span>📊</span> PHÂN TÍCH CHIẾN THUẬT
                    </h3>
                    <div class="bg-orange-50 p-5 rounded-2xl border-2 border-orange-100 mb-2">
                        <div class="text-gray-700 leading-relaxed text-base italic text-left">
                            "${report}"
                        </div>
                    </div>
                    <p class="text-gray-400 text-xs text-center mt-3">Huấn luyện viên Siêu Trí Tuệ AI</p>
                </div>
            `);
    } catch (error) {
      console.error("Game Analysis Error:", error);
      $content.html(`
                <div class="p-6 text-center">
                    <div class="text-4xl mb-3">⚠️</div>
                    <div class="text-red-600 font-bold mb-2">Lỗi kết nối Siêu Trí Tuệ</div>
                    <div class="text-gray-500 text-sm">Bé hãy tự xem lại bàn cờ để rút kinh nghiệm nhé!</div>
                </div>
            `);
    }
  }
}
