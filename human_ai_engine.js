class HumanAiEngine {
  constructor(apiKey) {
    this.playerLevel = 50;
    this.isMindReadingOn = true;
    this.apiKey = apiKey;
    this.mistralUrl = "https://api.mistral.ai/v1/chat/completions";
    this.stockfish = null;
    this.isEngineReady = false;
    this.enginePath =
      "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";
    this.lastDepthUsed = 10;

    // New Personality & Emotion properties
    this.lastEval = 0; // Đơn vị: centipawns (từ góc nhìn AI, white is positive)
    this.currentPersona = "Điềm tĩnh";
    this.playerComment = "Đang thăm dò...";
    this.isTyping = false;
    this.shouldStopTyping = false;
    this.typingQueue = [];

    this.fallbackPhrases = [
      "Có phải bạn đang tính toán bước tiếp theo không nghen?",
      "Trận đấu đang trở nên hấp dẫn dữ thần hà!",
      "Bạn đang có một kế hoạch gì đó bá chấy lắm phải hông nè?",
      "Nước đi này khá là thú vị à nghen!",
      "Mình đang cố gắng đọc suy nghĩ của bạn đó nhen...",
      "Coi bộ tính toán của bạn cũng dữ dằn quá hén?",
      "Để tui coi thử bạn đang tính làm cái gì tiếp đây nè.",
      "Ván cờ này càng chơi càng thấy xôm tụ quá đi!",
      "Bạn đi nước này làm tui hơi ngạc nhiên đó nha!",
      "Đừng có giấu nghề nghen, tui biết bạn giỏi lắm đó.",
      "Gớm thiệt, bạn đi nước cờ coi bộ 'ngon lành cành đào' à!",
      "Nè, có phải bạn đang tính dụ tui vô bẫy không dị?",
      "Trận này tui với bạn làm một ván ra trò luôn hén!",
      "Tui đang suy nghĩ coi nước tiếp theo bạn đi đâu nè.",
      "Bạn đánh cờ mà tui thấy như đang dạo chơi dị đó, thoải mái quá nhen!",
    ];

    this.thinkingPhrases = {
      "Điềm tĩnh": [
        "Để mình xem xét thế cờ này chút xíu nghen...",
        "Nước đi của bạn coi bộ cũng sâu sắc dữ à.",
        "Mình đang cân nhắc mấy phương án cho 'vừa bụng' nè...",
        "Gượm đã hén, để tui tính cho kỹ nước này cái.",
        "Cờ bạn đi chậm mà chắc, tui cũng phải cẩn thận mới được.",
        "Bình tĩnh nghen, tui sắp nghĩ ra nước đi cho bạn rồi nè.",
      ],
      "Sát thủ": [
        "Nước đi này hớ quá nè, để tui kết thúc ván cờ cho lẹ nghen.",
        "Bạn đang đối đầu với một sát thủ miền Tây thiệt thụ đó nhen.",
        "Tính toán của tui là chỉ có nước thắng thôi hà, tin hông?",
        "Tới luôn bác tài ơi, nước này tui dứt điểm luôn nè!",
        "Bạn đi dị là tui hốt liền đó, không có nể nang gì đâu nhen.",
        "Sắp xong rồi, nước cờ này của tui là 'chốt đơn' luôn đó!",
      ],
      "Thận trọng": [
        "Bạn đang giăng bẫy tui phải hông nè? Đừng có hòng nghen!",
        "Cần phải cân nhắc kĩ nước đi này, coi bộ hổng có giỡn được đâu.",
        "Thế cờ này đòi hỏi tui phải tập trung dữ lắm mới hòng thắng nổi.",
        "Khoan đã hén, để tui nhìn cho kỹ kẻo mắc bẫy bạn là tiêu đời luôn.",
        "Bạn đánh bí hiểm quá, tui phải dè chừng mới được nè.",
        "Tui phải tính cho thiệt kỹ, sai một ly là đi một dặm đó nghen!",
      ],
      "Lúng túng": [
        "Nước đi này khó quá hà, làm tui rối não luôn rồi nè...",
        "Bạn làm tui hơi bối rối à nghen, đánh kiểu gì mà hay dữ dị!",
        "Để tui suy nghĩ một chút nhen, bạn đánh làm tui 'đứng hình' luôn rồi.",
        "Trời đất ơi, nước này tính sao ta? Khó ăn khó nói quá đi...",
        "Bạn làm tui đổ mồ hôi hột luôn rồi nè, kì này tiêu thiệt rồi quá.",
        "Để tui ráng tính thử coi, chứ cờ này bạn đi 'căng' quá trời căng!",
      ],
    };

    this.initStockfish();
  }

  /**
   * Khởi tạo Stockfish Worker
   */
  async initStockfish() {
    try {
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
          console.log("Human AI: Stockfish Ready!");
        }
        // Lắng nghe thông tin score từ Stockfish
        if (event.data.includes("score cp")) {
          const match = event.data.match(/score cp (-?\d+)/);
          if (match) {
            this.currentEval = parseInt(match[1]);
          }
        }
      };

      this.stockfish.postMessage("uci");
      this.stockfish.postMessage("isready");
    } catch (e) {
      console.error("Lỗi khởi tạo Stockfish trong Human AI:", e);
    }
  }

  /**
   * Kiểm tra kết nối API
   */
  async checkConnection() {
    if (!this.apiKey) {
      console.warn("Chưa có API Key!");
      return false;
    }

    console.group("🤖 KIỂM TRA KẾT NỐI AI...");
    console.log("Endpoint:", this.mistralUrl);
    console.log("Model:", "mistral-small-latest");

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
            { role: "user", content: "Say 'Hello' if you can read this." },
          ],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ KẾT NỐI THÀNH CÔNG!");
        console.log("Phản hồi:", data.choices[0].message.content);
        $("#game-status").html(
          '<span class="text-green-600 font-bold">✅ Đã kết nối "Siêu Trí Tuệ" AI!</span>',
        );
        setTimeout(() => $("#game-status").empty(), 3000);
        console.groupEnd();
        return true;
      } else {
        const errorData = await response.json();
        console.error("❌ LỖI KẾT NỐI:", errorData);
        $("#game-status").html(
          '<span class="text-red-500 font-bold">❌ API Key không hợp lệ!</span>',
        );
        console.groupEnd();
        return false;
      }
    } catch (e) {
      console.error("❌ LỖI MẠNG:", e);
      console.groupEnd();
      return false;
    }
  }

  /**
   * Hiệu ứng gõ chữ với hàng đợi (Queue)
   */
  async typeStatus(message, className = "text-purple-600 font-medium italic") {
    return new Promise(async (resolve) => {
      // Nếu đang gõ, thêm vào hàng đợi
      if (this.isTyping) {
        this.typingQueue.push({ message, className, resolve });
        return;
      }

      this.isTyping = true;
      const $status = $("#game-status");
      $status.empty();
      const $span = $(`<span class="${className}">🧐 </span>`).appendTo(
        $status,
      );

      // Loại bỏ dấu ngoặc bị lặp nếu có từ API hoặc chuỗi cứng
      const cleanedMessage = message.replace(/^["']|["']$/g, "");
      const text = `"${cleanedMessage}"`;

      for (let i = 0; i < text.length; i++) {
        // Kiểm tra nếu có lệnh dừng gõ
        if (this.shouldStopTyping) {
          this.isTyping = false;
          this.shouldStopTyping = false;
          resolve();
          return;
        }
        $span.append(text[i]);
        await new Promise((r) => setTimeout(r, 25 + Math.random() * 20));
      }

      this.isTyping = false;
      resolve();

      // Xử lý mục tiếp theo trong hàng đợi
      if (this.typingQueue.length > 0) {
        const next = this.typingQueue.shift();
        this.typeStatus(next.message, next.className).then(next.resolve);
      }
    });
  }

  /**
   * Dừng việc gõ chữ ngay lập tức và xóa hàng đợi
   */
  stopTyping() {
    this.typingQueue = [];
    if (this.isTyping) {
      this.shouldStopTyping = true;
    }
    // Xóa trắng status để chuẩn bị cho thông báo lượt của người chơi
    $("#game-status").empty();
  }

  /**
   * Hiển thị thông điệp khi đang suy nghĩ
   */
  async showThinkingMessage() {
    const phrases =
      this.thinkingPhrases[this.currentPersona] ||
      this.thinkingPhrases["Điềm tĩnh"];
    const msg = phrases[Math.floor(Math.random() * phrases.length)];
    this.typeStatus(msg, "text-blue-500 font-medium italic");
  }

  /**
   * Cơ chế chọn Depth linh hoạt
   */
  getVariableDepth() {
    const rand = Math.random() * 100;
    let depth = 10;

    if (this.playerLevel > 80) {
      if (rand < 5) depth = 5;
      else if (rand < 20) depth = 10;
      else if (rand < 60) depth = 15;
      else depth = 20;
    } else if (this.playerLevel < 30) {
      if (rand < 40) depth = 3;
      else if (rand < 80) depth = 5;
      else depth = 10;
    } else {
      if (rand < 15) depth = 3;
      else if (rand < 30) depth = 5;
      else if (rand < 60) depth = 10;
      else if (rand < 90) depth = 15;
      else depth = 20;
    }

    this.lastDepthUsed = depth;
    console.log(
      `AI depth: ${depth} (Player Level: ${this.playerLevel}, Persona: ${this.currentPersona})`,
    );
    return depth;
  }

  /**
   * Gọi Mistral AI API với Context đầy đủ
   */
  async callMistral(prompt, gameContext = "", timeoutMs = 8000) {
    if (!this.apiKey) return null;

    const systemPrompt = `Bạn là đối thủ cờ vua thực thụ tên là "Siêu Trí Tuệ". Cách xưng hô: "Bạn" - "Mình". 
      Tính cách hiện tại: ${this.currentPersona}. 
      Bối cảnh trận đấu: ${gameContext}. 
      Hãy trả lời bằng tiếng Việt, ngắn gọn, thông thái nhưng có cảm xúc. Không bao giờ dùng tọa độ ô cờ.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.warn("Mistral Timeout/Error:", error);
      return null;
    }
  }

  /**
   * Phân tích tâm lý & trình độ (JSON)
   */
  async analyzePsychology(pgn) {
    const prompt = `Dựa vào PGN: "${pgn}". Phân tích trình độ và tâm lý đối thủ. 
      Trả về định dạng JSON duy nhất: {"level": 1-100, "persona": "Sát thủ/Thận trọng/Lúng túng", "comment": "nhận xét ngắn về cách đánh của đối thủ"}`;

    const result = await this.callMistral(prompt, "Đang phân tích lối chơi");
    if (result) {
      try {
        const cleanedResult = result.substring(
          result.indexOf("{"),
          result.lastIndexOf("}") + 1,
        );
        const data = JSON.parse(cleanedResult);
        this.playerLevel = data.level || this.playerLevel;
        this.currentPersona = data.persona || this.currentPersona;
        this.playerComment = data.comment || this.playerComment;

        // Hiển thị lời nhận xét của AI về người chơi
        if (this.playerComment) {
          this.typeStatus(
            this.playerComment,
            "text-green-600 font-semibold italic",
          );
        }
        console.log("Psychology Update:", data);
      } catch (e) {
        console.error("JSON Parse Error in Psychology:", e);
      }
    }
  }

  /**
   * Xử lý cảm xúc AI dựa trên thay đổi Eval
   */
  async handleAiEmotion(currentEval, isAiMove) {
    const diff = currentEval - this.lastEval;
    let prompt = "";

    if (isAiMove && diff < -150) {
      prompt =
        "Mình vừa đi một nước dở quá, thực sự hối hận. Hãy nói một câu cảm thán về sự hối hận này.";
    } else if (!isAiMove && diff > 150) {
      prompt =
        "Đối thủ vừa mắc sai lầm. Hãy nói một câu khích tướng nhẹ nhàng.";
    }

    if (prompt) {
      const emotionMsg = await this.callMistral(
        prompt,
        `Điểm eval thay đổi: ${diff}`,
      );
      if (emotionMsg) {
        this.typeStatus(emotionMsg, "text-red-500 font-bold italic");
      }
    }

    this.lastEval = currentEval;
  }

  /**
   * Mind-reading
   */
  async updateMindReading(fen) {
    if (!this.isMindReadingOn) return;

    const prompt = `Thế cờ FEN: "${fen}". Hãy đoán xem đối thủ đang mưu tính điều gì. Bắt đầu bằng "Có phải bạn đang..." (Không dùng tọa độ).`;
    const mindMsg = await this.callMistral(prompt, "Đang đọc suy nghĩ");

    const finalMsg =
      mindMsg ||
      this.fallbackPhrases[
        Math.floor(Math.random() * this.fallbackPhrases.length)
      ];
    this.typeStatus(finalMsg);
  }

  /**
   * Hàm chính lấy nước đi từ AI
   */
  async getMove(game, callback) {
    const fen = game.fen();
    const pgn = game.history().slice(-20).join(" ");
    const moveCount = game.history().length;

    // Hiển thị lời thoại "đang suy nghĩ" của AI
    this.showThinkingMessage();

    // Chu kỳ 6 half-moves (3 nước mỗi bên)
    if (moveCount > 0 && moveCount % 6 === 0) {
      this.analyzePsychology(pgn);
    }

    // Mind-reading chu kỳ 3 nước của người chơi
    if (this.isMindReadingOn && moveCount >= 6 && moveCount % 6 === 0) {
      this.updateMindReading(fen);
    }

    // AI bắt đầu tìm nước đi
    this.getEngineMove(fen, async (bestMove) => {
      // Dừng các câu thoại đang gõ (đặc biệt là thinking phrases)
      this.stopTyping();

      // 1. Kiểm tra xem người chơi vừa đi có lỗi không (dựa trên eval Stockfish vừa tính)
      if (this.currentEval !== undefined) {
        await this.handleAiEmotion(this.currentEval, false);
      }

      // 2. Trả nước đi về game
      callback(bestMove);

      // 3. Sau khi AI đi, kiểm tra xem AI có "hối hận" về nước đi vừa rồi không
      setTimeout(async () => {
        if (this.currentEval !== undefined) {
          await this.handleAiEmotion(this.currentEval, true);
        }
      }, 1000);
    });
  }

  /**
   * Lấy nước đi từ Stockfish
   */
  getEngineMove(fen, callback) {
    if (!this.stockfish || !this.isEngineReady) {
      const tempGame = new Chess(fen);
      const moves = tempGame.moves();
      callback(moves[Math.floor(Math.random() * moves.length)]);
      return;
    }

    const depth = this.getVariableDepth();

    const timeoutId = setTimeout(() => {
      this.stockfish.postMessage("stop");
    }, 10000);

    const listener = (event) => {
      if (event.data.startsWith("bestmove")) {
        const bestMove = event.data.split(" ")[1];
        clearTimeout(timeoutId);
        this.stockfish.removeEventListener("message", listener);
        callback(bestMove);
      }
    };

    this.stockfish.addEventListener("message", listener);
    this.stockfish.postMessage("ucinewgame");
    this.stockfish.postMessage(`position fen ${fen}`);
    this.stockfish.postMessage(`go depth ${depth}`);
  }
}
