/**
 * Zilola AI - OpenAI Realtime (Final Ultimate Audio Fix)
 */

document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.getElementById('typed-text');
    const nurseImage = document.querySelector('.main-nurse');
    const micBtn = document.querySelector('.mic-trigger');
    const waves = document.querySelectorAll('.audio-waves span');

    let peerConnection = null;
    let dataChannel = null;
    let audioStream = null;

    // Ovoz uchun doimiy element
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);

    async function startZilola() {
        try {
            // Audio tizimini uyg'otish
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            textElement.innerText = "Zilola bilan aloqa o'rnatilmoqda...";

            peerConnection = new RTCPeerConnection();

            // AI OVOZI KELGANDA (ASOSIY QISM)
            peerConnection.ontrack = e => {
                console.log("DEBUG: Audio keldi!");
                audioEl.srcObject = e.streams[0];
                audioEl.play().catch(err => {
                    // Agar bloklansa, foydalanuvchidan ruxsat so'rash
                    textElement.innerText = "Ovozni yoqish uchun ekraningizga bitta bosing!";
                    window.addEventListener('click', () => audioEl.play(), { once: true });
                });

                nurseImage.classList.add('speaking');
                waves.forEach(wave => wave.style.animationPlayState = 'running');
            };

            // Mikrofon ruxsati
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getTracks().forEach(track => peerConnection.addTrack(track, audioStream));

            // Data Channel
            dataChannel = peerConnection.createDataChannel("oai-events");
            dataChannel.onmessage = (e) => {
                const event = JSON.parse(e.data);
                if (event.type === "response.audio_transcript.delta") {
                    if (textElement.innerText.includes("...")) textElement.innerText = "";
                    textElement.innerText += event.delta;
                }
                if (event.type === "response.done") {
                    nurseImage.classList.remove('speaking');
                    waves.forEach(wave => wave.style.animationPlayState = 'paused');
                }
            };

            // OpenAI Sozlamalari (FORCE SPEECH)
            dataChannel.onopen = () => {
                const sessionUpdate = {
                    type: "session.update",
                    session: {
                        instructions: "Sening isming Zilola. Poliklinika hamshirasisan. O'ta mayin va insoniy ovozda faqat O'ZBEK tilida gapir. Ulanishing bilan darhol o'zingni tanishtirib, bemorni qutla. Pauza qilma!",
                        voice: "shimmer",
                        modalities: ["text", "audio"],
                        turn_detection: { type: "server_vad" }
                    }
                };
                dataChannel.send(JSON.stringify(sessionUpdate));

                // Darhol javob yaratish buyrug'i
                dataChannel.send(JSON.stringify({
                    type: "response.create",
                    response: {
                        modalities: ["audio", "text"],
                        instructions: "Assalomu alaykum, men Zilolaman. Sizga qanday yordam bera olaman?"
                    }
                }));

                textElement.innerText = "Zilola sizni eshitmoqda...";
            };

            // SDP Offer (Backend orqali)
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            const response = await fetch('/api/realtime/proxy', {
                method: "POST",
                body: offer.sdp,
                headers: { "Content-Type": "application/sdp" }
            });

            if (!response.ok) throw new Error("Server ulanishda xato qildi.");

            const answer = { type: "answer", sdp: await response.text() };
            await peerConnection.setRemoteDescription(answer);

        } catch (err) {
            console.error(err);
            textElement.innerText = "Xato: " + err.message;
            stopZilola();
        }
    }

    function stopZilola() {
        if (peerConnection) peerConnection.close();
        if (audioStream) audioStream.getTracks().forEach(track => track.stop());
        peerConnection = null;
        nurseImage.classList.remove('speaking');
        waves.forEach(wave => wave.style.animationPlayState = 'paused');
        textElement.innerText = "Suhbat yakunlandi.";
    }

    micBtn.addEventListener('click', () => {
        if (!peerConnection) startZilola();
        else stopZilola();
    });
});
