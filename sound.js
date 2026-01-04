// sound.js - Quản lý âm thanh & Giọng đọc Google

const SoundManager = (function() {
    let audioCtx = null;
    let isUnlocked = false;
    let currentVoiceAudio = null; // Biến lưu giọng đọc hiện tại để tránh chồng âm

    // Link file âm thanh hiệu ứng (SFX)
    const sounds = {
        move: 'https://images.chesscomfiles.com/chess-themes/sounds/_common/move-self.mp3',
        capture: 'https://images.chesscomfiles.com/chess-themes/sounds/_common/capture.mp3',
        start: 'https://images.chesscomfiles.com/chess-themes/sounds/_common/game-start.mp3',
        check: 'https://images.chesscomfiles.com/chess-themes/sounds/_common/illegal.mp3'
    };

    const audioBuffers = {};

    // Tải file âm thanh SFX
    async function loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            if (audioCtx) {
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                audioBuffers[name] = audioBuffer;
            }
        } catch (e) {
            console.error(`Lỗi tải SFX: ${name}`);
        }
    }

    return {
        // Khởi tạo AudioContext
        init: function() {
            if (isUnlocked) return;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            // Mồi âm thanh rỗng để mở khóa iOS
            const buffer = audioCtx.createBuffer(1, 1, 22050);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(0);

            loadSound('move', sounds.move);
            loadSound('capture', sounds.capture);
            loadSound('start', sounds.start);
            loadSound('check', sounds.check);

            isUnlocked = true;
        },

        // Phát hiệu ứng (SFX)
        play: function(name) {
            if (!audioCtx || !audioBuffers[name]) return;
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffers[name];
            source.connect(audioCtx.destination);
            source.start(0);
        },

        // --- MỚI: ĐỌC BẰNG GIỌNG GOOGLE ---
        speakGoogle: function(text) {
            // 1. Nếu đang đọc câu cũ dở dang thì dừng lại
            if (currentVoiceAudio) {
                currentVoiceAudio.pause();
                currentVoiceAudio.currentTime = 0;
            }

            if (!text) return;

            // 2. Tạo đường dẫn đến Google Translate API
            // client=tw-ob là tham số giúp lấy file mp3 trực tiếp
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=vi`;

            // 3. Phát âm thanh
            currentVoiceAudio = new Audio(url);
            
            // Xử lý lỗi nếu mạng yếu
            currentVoiceAudio.onerror = function() {
                console.log("Không tải được giọng Google (Kiểm tra mạng).");
            };

            currentVoiceAudio.play().catch(e => {
                console.log("Trình duyệt chặn phát tự động (Cần tương tác chạm):", e);
            });
        }
    };
})();