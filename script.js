// script.js - Có giọng đọc Google - Phiên bản gộp hint-box

var board = null;
var game = new Chess();
var $board = $('#myBoard');
var $hint = $('#move-hint');
var playerColor = 'w'; 
var squareToHighlight = null; 
var currentAI = ChessAI; // AI mặc định

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
            updateHint("Hay quá! Chờ máy đi nhé...");
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
            updateHint(guideText);
            
            // 2. Gọi Google đọc to câu hướng dẫn
            SoundManager.speakGoogle(guideText);
        }
    }
}

function handleMoveEffects(move) {
    // Kiểm tra nếu là nước đi ăn quân
    if (move.flags.includes('c') || move.flags.includes('e')) {
        // move.color là màu của quân cờ vừa di chuyển
        if (move.color === playerColor) {
            // Người chơi ăn quân của máy -> Vui
            SoundManager.play('capture');
            shootConfetti();
        } else {
            // Máy ăn quân của người chơi -> Buồn
            SoundManager.play('capture_sad'); // Âm thanh buồn
            $('#myBoard').addClass('shake-sad'); // Hiệu ứng rung buồn
            setTimeout(function() {
                $('#myBoard').removeClass('shake-sad');
            }, 500);
        }
    } else {
        // Nước đi bình thường
        SoundManager.play('move');
    }
}

function makeMachineMove() {
    if (game.game_over()) return;

    if (typeof currentAI !== 'undefined') {
        // AI giờ sẽ trả về nước đi qua callback
        currentAI.getBestMove(game, function(moveSan) {
            if (moveSan) {
                var move = game.move(moveSan, { sloppy: true }); // sloppy: true để chấp nhận định dạng từ stockfish
                board.position(game.fen());
                handleMoveEffects(move);
                updateStatus();
                updateHint("Đến lượt bé rồi!");
            }
        });
    }
}

function shootConfetti() {
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
}

function updateHint(message) {
    $hint.text(message);
    $hint.addClass('new-message');
    setTimeout(function() {
        $hint.removeClass('new-message');
    }, 500);
}

function updateStatus() {
    var moveColor = (game.turn() === 'b') ? 'Đen' : 'Trắng';

    $hint.removeClass('in-check');
    $('#myBoard').removeClass('shake-board');

    if (game.in_checkmate()) {
        updateHint('🏆 ' + (moveColor === 'Trắng' ? 'Đen' : 'Trắng') + ' thắng!');
        SoundManager.speakGoogle("Hết cờ rồi. " + (moveColor === 'Trắng' ? 'Đen' : 'Trắng') + " đã chiến thắng.");
        shootConfetti();
    } else if (game.in_draw()) {
        updateHint('🤝 Hòa!');
    } else {
        if (game.turn() === playerColor) {
            updateHint("Lượt của Bé");
        } else {
            updateHint("Máy đang nghĩ...");
        }
        
        if (game.in_check()) {
            updateHint('⚠️ VUA NGUY HIỂM ! ⚠️');
            $hint.addClass('in-check');
            $('#myBoard').addClass('shake-board');
            SoundManager.play('check');
            SoundManager.speakGoogle("Cẩn thận nha, Vua đang bị chiếu!");
        }
    }
}

// SETUP
var colorModal = new bootstrap.Modal(document.getElementById('colorModal'), { keyboard: false });

window.chooseColor = function(color) {
    SoundManager.init(); // Quan trọng cho iOS
    playerColor = (color === 'white') ? 'w' : 'b';

    // Đọc AI level từ dropdown
    var aiLevel = $('#aiLevel').val();
    var aiModeText = ''; // Chuỗi để hiển thị
    if (aiLevel === '1') {
        currentAI = ChessAI_lv1;
        aiModeText = '💪 Đang chơi với: Nghiêm túc';
    } else if (aiLevel === '2') {
        currentAI = ChessAI_lv2;
        aiModeText = '🤔 Đang chơi với: Thách đấu';
    } else if (aiLevel === 'max') {
        currentAI = ChessAI_max;
        aiModeText = '👾 Đang chơi với: Trùm cuối';
    } else {
        currentAI = ChessAI;
        aiModeText = '🍼 Đang chơi với: Tập chơi';
    }
    $('#ai-mode-display').text(aiModeText); // Cập nhật text


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
        updateHint("Máy đi trước nhé...");
        window.setTimeout(makeMachineMove, 1000);
    } else {
        updateStatus();
        updateHint("Chạm vào quân cờ để nghe hướng dẫn nhé!");
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
    updateHint("Đã đi lại.");
    updateStatus();
});

$(document).ready(function() { colorModal.show(); });