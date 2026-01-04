// script.js - Có giọng đọc Google

var board = null;
var game = new Chess();
var $status = $('#status');
var $board = $('#myBoard');
var $hint = $('#move-hint');
var playerColor = 'w'; 
var squareToHighlight = null; 

// --- TỪ ĐIỂN HƯỚNG DẪN (Nội dung sẽ được Google đọc) ---
const hints = {
    'k': 'Vua. Đi một ô mỗi lượt theo mọi hướng.',
    'q': 'Hậu. Di chuyển ngang, dọc, chéo không giới hạn ô.',
    'r': 'Xe. Đi thẳng theo hàng ngang hoặc cột dọc.',
    'b': 'Tượng. Chỉ di chuyển theo các đường chéo cùng màu.',
    'n': 'Mã. Đi hình chữ L, có thể nhảy qua quân khác.',
    'p': 'Tốt. Đi thẳng một ô, ăn chéo, không được đi lùi.'
};

function removeHighlights() {
    $board.find('.square-55d63').removeClass('highlight-selected');
    $board.find('.square-55d63').removeClass('highlight-move');
}

function onSquareClick(square) {
    if (game.game_over()) return;
    if (game.turn() !== playerColor) return; 

    var pieceAtSquare = game.get(square);

    // 1. ĐÃ CHỌN QUÂN -> ĐI QUÂN
    if (squareToHighlight) {
        var move = game.move({
            from: squareToHighlight,
            to: square,
            promotion: 'q'
        });

        if (move !== null) {
            board.position(game.fen());
            removeHighlights();
            squareToHighlight = null;
            $hint.text("Hay quá! Chờ máy đi nhé...");
            handleMoveEffects(move);
            updateStatus();
            window.setTimeout(makeMachineMove, 500);
            return;
        } 
        else if (pieceAtSquare && pieceAtSquare.color === playerColor) {
            // Đổi quân (logic chạy xuống dưới)
        }
        else {
            removeHighlights();
            squareToHighlight = null;
            return;
        }
    }

    // 2. CHỌN QUÂN -> HIỆN HƯỚNG DẪN & ĐỌC
    if (pieceAtSquare && pieceAtSquare.color === playerColor) {
        removeHighlights();
        
        $board.find('.square-' + square).addClass('highlight-selected');
        
        var moves = game.moves({ square: square, verbose: true });
        for (var i = 0; i < moves.length; i++) {
            $board.find('.square-' + moves[i].to).addClass('highlight-move');
        }
        
        squareToHighlight = square;

        // --- XỬ LÝ HƯỚNG DẪN & ĐỌC ---
        var guideText = hints[pieceAtSquare.type.toLowerCase()];
        if (guideText) {
            // 1. Hiện chữ
            $hint.text(guideText);
            
            // 2. Gọi Google đọc to câu hướng dẫn
            SoundManager.speakGoogle(guideText);
        }
    }
}

function handleMoveEffects(move) {
    if (move.flags.includes('c') || move.flags.includes('e')) {
        SoundManager.play('capture'); 
        shootConfetti(); 
    } else {
        SoundManager.play('move'); 
    }
}

function makeMachineMove() {
    if (game.game_over()) return;

    if (typeof ChessAI !== 'undefined') {
        var moveSan = ChessAI.getBestMove(game);
        if (moveSan) {
            var move = game.move(moveSan);
            board.position(game.fen());
            handleMoveEffects(move);
            updateStatus();
            $hint.text("Đến lượt bé rồi!");
        }
    }
}

function shootConfetti() {
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
}

function updateStatus() {
    var status = '';
    var moveColor = (game.turn() === 'b') ? 'Đen' : 'Trắng';

    $status.removeClass('in-check');
    $('#myBoard').removeClass('shake-board');

    if (game.in_checkmate()) {
        status = '🏆 ' + (moveColor === 'Trắng' ? 'Đen' : 'Trắng') + ' thắng!';
        $hint.text("Ván cờ kết thúc!");
        SoundManager.speakGoogle("Hết cờ rồi. " + (moveColor === 'Trắng' ? 'Đen' : 'Trắng') + " đã chiến thắng.");
        shootConfetti();
    } else if (game.in_draw()) {
        status = '🤝 Hòa!';
    } else {
        if (game.turn() === playerColor) status = "Lượt của Bé";
        else status = "Máy đang nghĩ...";
        
        if (game.in_check()) {
            status = '⚠️ CHIẾU TƯỚNG! ⚠️';
            $status.addClass('in-check');
            $('#myBoard').addClass('shake-board');
            SoundManager.play('check');
            SoundManager.speakGoogle("Cẩn thận nha, Vua đang bị chiếu!");
        }
    }
    $status.text(status);
}

// SETUP
var colorModal = new bootstrap.Modal(document.getElementById('colorModal'), { keyboard: false });

window.chooseColor = function(color) {
    SoundManager.init(); // Quan trọng cho iOS
    playerColor = (color === 'white') ? 'w' : 'b';
    colorModal.hide();
    game.reset();
    
    var config = {
        draggable: false, 
        position: 'start',
        orientation: color, 
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    
    if(board) board.destroy();
    board = Chessboard('myBoard', config);

    $('#myBoard').on('click', '.square-55d63', function() {
        onSquareClick($(this).attr('data-square'));
    });
    
    $(window).resize(board.resize);
    SoundManager.play('start');
    
    if (playerColor === 'b') {
        $status.text("Máy đang nghĩ...");
        $hint.text("Máy đi trước nhé...");
        window.setTimeout(makeMachineMove, 1000);
    } else {
        updateStatus();
        $hint.text("Chạm vào quân cờ để nghe hướng dẫn nhé!");
        // Đọc lời chào mừng
        SoundManager.speakGoogle("Bắt đầu thôi. Chạm vào quân cờ để nghe hướng dẫn nhé.");
    }
};

$('#btnNewGame').on('click', function() { colorModal.show(); });
$('#btnUndo').on('click', function() {
    game.undo(); game.undo();
    board.position(game.fen());
    removeHighlights();
    squareToHighlight = null;
    $hint.text("Đã đi lại.");
    updateStatus();
});

$(document).ready(function() { colorModal.show(); });