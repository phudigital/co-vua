// ai.js - Trí tuệ nhân tạo (Đơn giản)

var ChessAI = (function() {
    return {
        // Hàm trả về nước đi tốt nhất (Hiện tại là ngẫu nhiên)
        getBestMove: function(game) {
            var possibleMoves = game.moves();
            
            // Hết nước đi
            if (possibleMoves.length === 0) return null;

            // Chọn ngẫu nhiên
            var randomIdx = Math.floor(Math.random() * possibleMoves.length);
            return possibleMoves[randomIdx];
        }
    };
})();