// ai-lv1.js - Trí tuệ nhân tạo (Cấp 1) - Cải thiện tấn công chủ động

var ChessAI_lv1 = (function() {

    // Bảng giá trị quân cờ để AI biết quân nào "ngon" hơn
    const pieceValues = {
        'p': 1, // Tốt
        'n': 3, // Mã
        'b': 3, // Tượng
        'r': 5, // Xe
        'q': 9, // Hậu
        'k': 100 // Vua
    };

    // Điểm số cho các ô quan trọng (trung tâm bàn cờ)
    const centerSquares = {
        'e4': 3, 'd4': 3, 'e5': 3, 'd5': 3, // Trung tâm chính
        'c3': 2, 'd3': 2, 'e3': 2, 'f3': 2, // Vành ngoài trung tâm
        'c4': 2, 'f4': 2, 'c5': 2, 'f5': 2,
        'c6': 2, 'd6': 2, 'e6': 2, 'f6': 2
    };

    // Tính điểm cho một nước đi
    function evaluateMove(move, game) {
        var score = 0;
        
        // 1. Ưu tiên cao nhất: Ăn quân
        if (move.flags.includes('c')) {
            var capturedPieceValue = pieceValues[move.captured];
            score += capturedPieceValue * 10; // Nhân hệ số để ưu tiên cao
        }
        
        // 2. Kiểm tra nước đi có đe dọa quân đối phương không
        var tempGame = new Chess(game.fen());
        tempGame.move(move);
        var opponentMoves = tempGame.moves({ verbose: true });
        
        // Kiểm tra xem có thể ăn quân ở nước tiếp theo không
        for (var i = 0; i < opponentMoves.length; i++) {
            var oppMove = opponentMoves[i];
            if (oppMove.flags.includes('c')) {
                var threatenedPieceValue = pieceValues[oppMove.captured];
                score += threatenedPieceValue * 5; // Đe dọa ăn quân
            }
        }
        
        // 3. Kiểm soát trung tâm
        if (centerSquares[move.to]) {
            score += centerSquares[move.to];
            
            // Thêm điểm nếu là quân nhẹ (tốt, mã, tượng) chiếm trung tâm
            var pieceType = move.piece.toLowerCase();
            if (pieceType === 'p' || pieceType === 'n' || pieceType === 'b') {
                score += 2;
            }
        }
        
        // 4. Phát triển quân (di chuyển quân nhẹ ra khỏi vị trí ban đầu)
        var isDevelopmentMove = false;
        var piece = move.piece.toLowerCase();
        
        // Quân mã phát triển
        if (piece === 'n' && (move.from === 'b1' || move.from === 'g1' || 
                              move.from === 'b8' || move.from === 'g8')) {
            score += 3;
            isDevelopmentMove = true;
        }
        
        // Quân tượng phát triển
        if (piece === 'b' && (move.from === 'c1' || move.from === 'f1' || 
                              move.from === 'c8' || move.from === 'f8')) {
            score += 2;
            isDevelopmentMove = true;
        }
        
        // 5. Tránh để quân bị tấn công
        tempGame = new Chess(game.fen());
        tempGame.move(move);
        
        // Kiểm tra xem quân vừa di chuyển có bị tấn công không
        var squares = tempGame.board();
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                if (squares[row][col] && 
                    squares[row][col].color === tempGame.turn() && 
                    squares[row][col].type === move.piece.toLowerCase()) {
                    
                    var square = String.fromCharCode(97 + col) + (8 - row);
                    var attacks = tempGame.moves({ 
                        square: square, 
                        verbose: true 
                    });
                    
                    if (attacks.length > 0) {
                        score -= 2; // Trừ điểm nếu quân bị tấn công
                    }
                }
            }
        }
        
        // 6. Ưu tiên nước đi tấn công (check)
        if (move.flags.includes('k')) {
            score += 15; // Rất ưu tiên chiếu vua
        }
        
        // 7. Thêm yếu tố ngẫu nhiên nhỏ để đa dạng nước đi
        score += Math.random() * 0.5;
        
        return score;
    }

    return {
        getBestMove: function(game, callback) {
            var possibleMoves = game.moves({ verbose: true });
            
            if (possibleMoves.length === 0) {
                callback(null);
                return;
            }

            var bestMove = null;
            var bestScore = -Infinity;

            // Đánh giá tất cả các nước đi có thể
            for (var i = 0; i < possibleMoves.length; i++) {
                var move = possibleMoves[i];
                var score = evaluateMove(move, game);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            
            var finalMove;
            if (bestMove) {
                finalMove = bestMove.san;
            } else {
                var randomIdx = Math.floor(Math.random() * possibleMoves.length);
                finalMove = possibleMoves[randomIdx].san;
            }

            // Trì hoãn một chút để mô phỏng AI "đang suy nghĩ"
            setTimeout(function() {
                callback(finalMove);
            }, 300);
        }
    };
})();
