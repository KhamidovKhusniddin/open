/**
 * Zilola AI - OpenAI Realtime (Ultimate WebRTC Fix)
 * Optimized for guaranteed audio playback and reliable connection.
 */

document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.getElementById('typed-text');
    const nurseImage = document.querySelector('.main-nurse');
    const micBtn = document.querySelector('.mic-trigger');
    const waves = document.querySelectorAll('.audio-waves span');

    let pc = null;
    let dc = null;
    let stream = null;

    // Global audio element to prevent garbage collection
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);

    async function startZilola() {
        try {
            console.log("Zilola: Starting session...");
            textElement.innerText = "Zilola bilan ulanish o'rnatilmoqda...";

            // 1. Setup PeerConnection with Transceiver
            pc = new RTCPeerConnection();

            // 2. Add Audio Transceiver (Recommended for OpenAI WebRTC)
            pc.addTransceiver('audio', { direction: 'sendrecv' });

            // 3. Handle incoming audio
            pc.ontrack = e => {
                console.log("Zilola: Incoming audio stream detected!");
                audioEl.srcObject = e.streams[0];

                // Visual feedback
                nurseImage.classList.add('speaking');
                waves.forEach(wave => wave.style.animationPlayState = 'running');

                // Try to play immediately
                audioEl.play().catch(err => {
                    console.warn("Autoplay blocked by browser. User interaction required.");
                    textElement.innerText = "Iltimos, ovozni yoqish uchun ekranga bir marta bosing.";
                    window.addEventListener('click', () => {
                        audioEl.play();
                        textElement.innerText = "Rahmat! Zilola gapiryapti...";
                    }, { once: true });
                });
            };

            // 4. Capture Microphone
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // 5. Setup Data Channel
            dc = pc.createDataChannel("oai-events");

            dc.onmessage = (e) => {
                const event = JSON.parse(e.data);

                // Transcription delta
                if (event.type === "response.audio_transcript.delta") {
                    if (textElement.innerText.includes("...")) textElement.innerText = "";
                    textElement.innerText += event.delta;
                }

                // Speech started/ended indicators
                if (event.type === "response.audio_done") {
                    console.log("Zilola: Finished speaking.");
                }

                if (event.type === "input_audio_buffer.speech_started") {
                    console.log("User: Started speaking.");
                    // Stop AI if it was speaking (handled by server_vad usually)
                }
            };

            // 6. Configure Session on Open
            dc.onopen = () => {
                console.log("Zilola: Data channel opened. Sending configuration...");

                const sessionUpdate = {
                    type: "session.update",
                    session: {
                        instructions: "Sening isming Zilola. Poliklinika hamshirasisan. O'ta mayin, muloyim va professional o'zbek tilida gapir. Javoblaringni doim ham matn (text), ham ovoz (audio) ko'rinishida ber. Hozir ulanishing bilan darhol o'zingni tanishtir va bemorga salom ber.",
                        voice: "shimmer",
                        modalities: ["text", "audio"],
                        turn_detection: { type: "server_vad" },
                        input_audio_format: "pcm16",
                        output_audio_format: "pcm16"
                    }
                };
                dc.send(JSON.stringify(sessionUpdate));

                // Trigger immediate greeting
                const initialGreeting = {
                    type: "response.create",
                    response: {
                        modalities: ["audio", "text"],
                        instructions: "O'zbek tilida salom ber va 'Men Zilolaman, sizni eshityapman' deb ayt."
                    }
                };
                dc.send(JSON.stringify(initialGreeting));

                textElement.innerText = "Zilola tayyor. Marhamat gapiring!";
            };

            // 7. WebRTC Offer/Answer via Proxy
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const res = await fetch('/api/realtime/proxy', {
                method: "POST",
                body: offer.sdp,
                headers: { "Content-Type": "application/sdp" }
            });

            if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

            const answerSdp = await res.text();
            await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
            console.log("Zilola: Connection established successfully.");

        } catch (err) {
            console.error("Zilola Error:", err);
            textElement.innerText = "Xato: " + err.message;
            stopZilola();
        }
    }

    function stopZilola() {
        if (pc) pc.close();
        if (stream) stream.getTracks().forEach(track => track.stop());
        pc = null;
        dc = null;
        nurseImage.classList.remove('speaking');
        waves.forEach(wave => wave.style.animationPlayState = 'paused');

        // Agar xato xabari bo'lsa, uni o'chirib yubormaslik
        if (!textElement.innerText.includes("Xato") && !textElement.innerText.includes("Server xatosi")) {
            textElement.innerText = "Suhbat yakunlandi.";
        }
    }

    // Mic button triggers the whole flow
    micBtn.addEventListener('click', () => {
        if (!pc) startZilola();
        else stopZilola();
    });
});
