<?php
header('Content-Type: application/json');
error_reporting(0);
session_start();

// --- CONFIG ---
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = uniqid('u_');
}
$user_id = $_SESSION['user_id'];

$room_id = $_REQUEST['room'] ?? 'room1';
$action = $_REQUEST['action'] ?? 'status';

if (!in_array($room_id, ['room1', 'room2'])) {
    die(json_encode(['error' => 'Phòng không hợp lệ']));
}

$file_path = __DIR__ . "/data/{$room_id}.json";
$TIMEOUT = 5; // 5 giây không thấy ping là coi như disconnect

// --- HELPERS ---
function get_data($path) {
    if (!file_exists($path)) return null;
    $fp = fopen($path, 'r');
    if (flock($fp, LOCK_SH)) {
        $content = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return json_decode($content, true);
    }
    fclose($fp);
    return null;
}

function save_data($path, $data) {
    $fp = fopen($path, 'c');
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

function init_room($id) {
    return [
        "id" => $id,
        "status" => "waiting", // waiting, playing
        "white" => null,
        "black" => null,
        "fen" => "start",
        "turn" => "w",
        "last_move" => null,
        "updated_at" => time(),
        "white_ping" => 0,
        "black_ping" => 0
    ];
}

// --- MAIN LOGIC ---

$data = get_data($file_path);
if (!$data) $data = init_room($room_id);

$now = time();

// 1. AUTO CLEANUP (Kick inactive users)
$white_inactive = ($data['white'] && ($now - $data['white_ping'] > $TIMEOUT));
$black_inactive = ($data['black'] && ($now - $data['black_ping'] > $TIMEOUT));

// Nếu cả 2 cùng thoát quá 5s -> Reset phòng luôn để người khác vào
if ( ($data['white'] == null || $white_inactive) && ($data['black'] == null || $black_inactive) ) {
    $data = init_room($room_id);
    // Nếu request này là join thì xử lý tiếp, không thì save và return
    if ($action !== 'join') { /* just save below */ }
} else {
    // Nếu chỉ 1 người thoát -> Xóa slot của người đó
    if ($white_inactive) { 
        $data['white'] = null; 
    }
    if ($black_inactive) { 
        $data['black'] = null; 
    }
    
    // Cập nhật trạng thái phòng
    if ($data['white'] && $data['black']) {
        $data['status'] = 'playing';
    } else {
        $data['status'] = 'waiting';
    }
}

// 2. HANDLE ACTIONS

if ($action === 'rooms_info') {
    // API đặc biệt để lấy info cả 2 phòng hiển thị ra menu
    $r1 = get_data(__DIR__ . "/data/room1.json");
    $r2 = get_data(__DIR__ . "/data/room2.json");
    
    // Helper check status
    $check = function($d) use ($now, $TIMEOUT) {
        if(!$d) return 'empty';
        $w = $d['white'] && ($now - $d['white_ping'] <= $TIMEOUT);
        $b = $d['black'] && ($now - $d['black_ping'] <= $TIMEOUT);
        if ($w && $b) return 'full';
        if ($w || $b) return 'waiting';
        return 'empty';
    };

    echo json_encode([
        'room1' => $check($r1),
        'room2' => $check($r2)
    ]);
    exit;
}
elseif ($action === 'join') {
    // Ping bản thân trước
    $is_rejoin = false;
    if ($data['white'] === $user_id) { $data['white_ping'] = $now; $is_rejoin = true; }
    if ($data['black'] === $user_id) { $data['black_ping'] = $now; $is_rejoin = true; }

    if (!$is_rejoin) {
        $color_pref = $_REQUEST['color'] ?? 'w'; // w or b
        
        // Logic ưu tiên chọn màu
        if ($color_pref === 'w' && !$data['white']) {
            $data['white'] = $user_id;
            $data['white_ping'] = $now;
        } elseif ($color_pref === 'b' && !$data['black']) {
            $data['black'] = $user_id;
            $data['black_ping'] = $now;
        } else {
            // Nếu màu thích đã bị chọn, ném vào màu còn lại
            if (!$data['white']) {
                $data['white'] = $user_id;
                $data['white_ping'] = $now;
            } elseif (!$data['black']) {
                $data['black'] = $user_id;
                $data['black_ping'] = $now;
            } else {
                die(json_encode(['error' => 'Phòng đã đầy']));
            }
        }
    }
    
    if ($data['white'] && $data['black']) {
        $data['status'] = 'playing';
        if ($data['fen'] === 'start') $data['updated_at'] = $now;
    }
}
elseif ($action === 'status') {
    // Update ping
    if ($data['white'] === $user_id) $data['white_ping'] = $now;
    if ($data['black'] === $user_id) $data['black_ping'] = $now;
}
elseif ($action === 'move') {
    $fen = $_REQUEST['fen'] ?? '';
    // Security check: Is it my turn?
    $am_i_white = ($data['white'] === $user_id);
    $am_i_black = ($data['black'] === $user_id);
    $current_turn = $data['turn']; // w or b
    
    $can_move = ($current_turn === 'w' && $am_i_white) || ($current_turn === 'b' && $am_i_black);
    
    if ($can_move && $fen) {
        $data['fen'] = $fen;
        $data['last_move'] = $_REQUEST['move'] ?? '';
        $data['turn'] = ($current_turn === 'w') ? 'b' : 'w';
        $data['updated_at'] = $now;
        
        // Update ping too
        if ($am_i_white) $data['white_ping'] = $now;
        if ($am_i_black) $data['black_ping'] = $now;
    }
}
elseif ($action === 'leave') {
    if ($data['white'] === $user_id) $data['white'] = null;
    if ($data['black'] === $user_id) $data['black'] = null;
    $data['status'] = 'waiting';
    // Nếu cả 2 đi hết -> Reset
    if (!$data['white'] && !$data['black']) $data = init_room($room_id);
}

save_data($file_path, $data);

// RESPONSE
$response = $data;
$response['me'] = $user_id;
$response['my_role'] = ($data['white'] === $user_id) ? 'w' : (($data['black'] === $user_id) ? 'b' : 'spectator');
$response['opponent_online'] = ($response['my_role'] === 'w') ? 
    ($data['black'] && ($now - $data['black_ping'] <= $TIMEOUT)) : 
    ($data['white'] && ($now - $data['white_ping'] <= $TIMEOUT));

echo json_encode($response);
