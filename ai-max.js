// ai-max.js - Trí tuệ nhân tạo (MAX) - Sử dụng Stockfish.js - Phiên bản cải tiến
// KSP là viết tắt của Kỳ Thủ Siêu Phàm :)

var ChessAI_max = (function() {
    var stockfish = null;
    var isReady = false;
    var isInitializing = false;
    var callbackQueue = []; // Hàng đợi callback

    // Hàm khởi tạo Stockfish
    function initializeStockfish(callback) {
        if (isReady) {
            if (callback) callback(true);
            return;
        }
        
        if (isInitializing) {
            // Đang khởi tạo, đợi thêm
            setTimeout(function() { initializeStockfish(callback); }, 100);
            return;
        }
        
        isInitializing = true;
        
        try {
            // Kiểm tra xem Worker có sẵn sàng không
            if (typeof Worker === 'undefined') {
                console.error("Web Workers không được hỗ trợ trong trình duyệt này");
                isInitializing = false;
                if (callback) callback(false);
                return;
            }
            
            // Tạo worker từ file stockfish.js
            stockfish = new Worker('stockfish.js');

            stockfish.onmessage = function(event) {
                var message = event.data;
                console.log("Stockfish:", message); // Debug
                
                if (message === "uciok") {
                    isReady = true;
                    isInitializing = false;
                    stockfish.postMessage("isready");
                    console.log("Stockfish đã sẵn sàng!");
                    if (callback) callback(true);
                } 
                else if (message === "readyok") {
                    // Engine đã sẵn sàng hoàn toàn
                    console.log("Stockfish readyok!");
                }
                else if (typeof message === 'string' && message.startsWith("bestmove")) {
                    var parts = message.split(' ');
                    var bestMove = parts[1];
                    
                    console.log("Stockfish đề xuất:", bestMove);
                    
                    // Lấy callback đầu tiên trong hàng đợi và thực thi
                    if (callbackQueue.length > 0) {
                        var callback = callbackQueue.shift();
                        if (callback && bestMove !== '(none)') {
                            callback(bestMove);
                        } else if (callback) {
                            // Nếu không có nước đi hợp lệ
                            callback(null);
                        }
                    }
                }
                else if (typeof message === 'string' && message.includes("error")) {
                    console.error("Stockfish lỗi:", message);
                    isInitializing = false;
                    if (callback) callback(false);
                }
            };
            
            stockfish.onerror = function(error) {
                console.error("Lỗi Stockfish Worker:", error);
                isInitializing = false;
                isReady = false;
                stockfish = null;
                if (callback) callback(false);
            };
            
            // Khởi tạo UCI
            stockfish.postMessage("uci");
            
        } catch (error) {
            console.error("Lỗi khởi tạo Stockfish:", error);
            isInitializing = false;
            stockfish = null;
            if (callback) callback(false);
        }
    }

    // Yêu cầu nước đi từ Stockfish
    function getStockfishMove(game, callback) {
        // Nếu chưa khởi tạo, khởi tạo trước
        if (!stockfish || !isReady) {
            console.log("Đang khởi tạo Stockfish...");
            initializeStockfish(function(success) {
                if (success) {
                    // Sau khi khởi tạo thành công, gửi yêu cầu
                    requestStockfishMove(game, callback);
                } else {
                    console.error("Không thể khởi tạo Stockfish");
                    // Fallback: sử dụng AI cấp 1
                    if (callback) {
                        setTimeout(function() {
                            // Tạo một nước đi ngẫu nhiên
                            var moves = game.moves();
                            if (moves.length > 0) {
                                var randomIdx = Math.floor(Math.random() * moves.length);
                                callback(moves[randomIdx]);
                            } else {
                                callback(null);
                            }
                        }, 300);
                    }
                }
            });
            return;
        }

        requestStockfishMove(game, callback);
    }
    
    function requestStockfishMove(game, callback) {
        if (!isReady || !stockfish) {
            console.error("Stockfish chưa sẵn sàng");
            if (callback) callback(null);
            return;
        }
        
        // Thêm callback vào hàng đợi
        callbackQueue.push(callback);
        
        // Gửi vị trí hiện tại
        var fen = game.fen();
        console.log("Gửi FEN cho Stockfish:", fen);
        stockfish.postMessage("position fen " + fen);
        
        // --- CẤU HÌNH TỐI ƯU SỨC MẠNH ---

        // 1. Tăng cường tài nguyên (RAM và CPU)
        stockfish.postMessage("setoption name Hash value 128"); // Cấp 128MB RAM cho bảng băm
        stockfish.postMessage("setoption name Threads value 4"); // Sử dụng 4 luồng CPU để tính toán

        // 2. Tối đa hóa kỹ năng và thiên hướng tấn công
        stockfish.postMessage("setoption name Skill Level value 20"); // Mức 20 là mạnh nhất
        stockfish.postMessage("setoption name Contempt value 30"); // Khuyến khích tấn công, tránh hòa cờ (giá trị từ -100 đến 100)
        
        // 3. Yêu cầu tính toán nước đi (giới hạn 5 giây)
        stockfish.postMessage("go movetime 5000");
    }

    // Khởi tạo sớm khi script được load
    setTimeout(function() {
        console.log("Khởi tạo Stockfish trước...");
        initializeStockfish(function(success) {
            console.log("Khởi tạo Stockfish:", success ? "thành công" : "thất bại");
        });
    }, 1000);

    return {
        getBestMove: function(game, callback) {
            console.log("KSP được yêu cầu nước đi...");
            getStockfishMove(game, callback);
        },
        
        // Hàm hủy để dọn dẹp
        destroy: function() {
            if (stockfish) {
                stockfish.terminate();
                stockfish = null;
                isReady = false;
            }
        }
    };
})();
