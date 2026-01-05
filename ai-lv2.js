// ai-lv2.js - Trí tuệ nhân tạo (Cấp 2) - Minimax cải tiến với Bảng vị trí
// Thuật toán giờ đây sẽ chủ động tấn công và chiếm các vị trí tốt.

var ChessAI_lv2 = (function() {

    // Điểm số vật chất cho mỗi quân cờ
    const pieceValues = {
        'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000
    };

    // Bảng điểm vị trí cho mỗi quân cờ (từ góc nhìn của quân Trắng)
    // AI sẽ được thưởng điểm khi đặt quân vào các ô có giá trị cao.
    const pawnTable = [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [ 5,  5, 10, 25, 25, 10,  5,  5],
        [ 0,  0,  0, 20, 20,  0,  0,  0],
        [ 5, -5,-10,  0,  0,-10, -5,  5],
        [ 5, 10, 10,-20,-20, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ];
    const knightTable = [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ];
    const bishopTable = [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ];
    const rookTable = [
        [ 0,  0,  0,  5,  5,  0,  0,  0],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [ 5, 10, 10, 10, 10, 10, 10,  5],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ];
    const kingTable = [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [ 20, 20,  0,  0,  0,  0, 20, 20],
        [ 20, 30, 10,  0,  0, 10, 30, 20]
    ];

    // Hàm đánh giá điểm số của bàn cờ (từ góc nhìn của quân Trắng)
    // Điểm = (Giá trị vật chất quân Trắng + Điểm vị trí quân Trắng) - (Giá trị vật chất quân Đen + Điểm vị trí quân Đen)
    var evaluateBoard = function(board) {
        var totalEvaluation = 0;
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                var piece = board[i][j];
                if (piece) {
                    var value = pieceValues[piece.type] || 0;
                    var pstValue = 0;
                    var table = null;

                    if (piece.type === 'p') table = pawnTable;
                    else if (piece.type === 'n') table = knightTable;
                    else if (piece.type === 'b') table = bishopTable;
                    else if (piece.type === 'r') table = rookTable;
                    else if (piece.type === 'k') table = kingTable;
                    
                    if (table) {
                        // Lấy điểm vị trí. Nếu là quân Đen, lật ngược bàn cờ (hàng 7-i)
                        pstValue = (piece.color === 'w') ? table[i][j] : table[7 - i][j];
                    }
                    
                    var finalValue = value + pstValue;
                    totalEvaluation += (piece.color === 'w' ? finalValue : -finalValue);
                }
            }
        }
        return totalEvaluation;
    };
    
    // Thuật toán Negamax - một biến thể của Minimax
    var negamax = function (game, depth, alpha, beta, color) {
        if (depth === 0) {
            return color * evaluateBoard(game.board());
        }

        var max = -Infinity;
        var moves = game.moves();

        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            var score = -negamax(game, depth - 1, -beta, -alpha, -color);
            game.undo();
            if (score > max) {
                max = score;
            }
            if (score > alpha) {
                alpha = score;
            }
            if (alpha >= beta) {
                break;
            }
        }
        return max;
    }

    // Hàm gốc để tìm nước đi tốt nhất
    var getBestMoveNegamax = function(game) {
        var newGameMoves = game.moves();
        if (newGameMoves.length === 0) return null;

        var bestValue = -Infinity;
        var bestMove = null;
        var searchDepth = 3; // Độ sâu tìm kiếm
        var color = game.turn() === 'w' ? 1 : -1;

        for (var i = 0; i < newGameMoves.length; i++) {
            var newGameMove = newGameMoves[i];
            game.move(newGameMove);
            var value = -negamax(game, searchDepth - 1, -Infinity, Infinity, -color);
            game.undo();
            if (value > bestValue) {
                bestValue = value;
                bestMove = newGameMove;
            }
        }
        return bestMove;
    };

    return {
        // Hàm này được gọi từ script.js
        getBestMove: function(game, callback) {
             setTimeout(function() {
                var bestMove = getBestMoveNegamax(game);
                callback(bestMove);
            }, 100);
        }
    };

})();