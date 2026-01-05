// ai.js - Trí tuệ nhân tạo (Đơn giản)

var ChessAI = (function() {
    return {
        // Hàm này giờ sẽ nhận một "callback" function
        getBestMove: function(game, callback) {
            var possibleMoves = game.moves();
            
            if (possibleMoves.length === 0) {
                callback(null); // Trả về null qua callback
                return;
            }

            var randomIdx = Math.floor(Math.random() * possibleMoves.length);
            
            // Trì hoãn một chút để mô phỏng AI "đang suy nghĩ"
            setTimeout(function() {
                callback(possibleMoves[randomIdx]); // Trả về nước đi qua callback
            }, 100); 
        }
    };
})();