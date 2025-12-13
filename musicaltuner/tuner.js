// ==============================
// 🎵 PROFESSIONAL YIN TUNER
// ==============================

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4 = 440;

let audioContext;
let analyser;
let mediaStreamSource;
let gainNode;

const startButton = document.getElementById("start-button");
const noteDisplay = document.getElementById("note");
const freqDisplay = document.getElementById("frequency");
const needle = document.getElementById("needle");

startButton.onclick = startTuner;

// ==============================
// 🎙️ AUDIO SETUP
// ==============================
function startTuner() {
    startButton.disabled = true;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
        audioContext.resume().then(initMic);
    } else {
        initMic();
    }
}

function initMic() {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.35;

    navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
    }).then(stream => {
        mediaStreamSource = audioContext.createMediaStreamSource(stream);
        mediaStreamSource
            .connect(gainNode)
            .connect(analyser);

        processAudio();
    }).catch(err => {
        noteDisplay.textContent = "Erro ao acessar microfone";
        console.error(err);
        startButton.disabled = false;
    });
}

// ==============================
// 🔁 AUDIO LOOP
// ==============================
function processAudio() {
    const buffer = new Float32Array(analyser.fftSize);

    function update() {
        analyser.getFloatTimeDomainData(buffer);

        const pitch = yinPitch(buffer, audioContext.sampleRate);

        if (pitch > 0) {
            updateDisplay(pitch);
        } else {
            noteDisplay.textContent = "—";
            freqDisplay.textContent = "0.00 Hz";
            needle.style.transform = "translateX(-50%) rotate(0deg)";
        }

        requestAnimationFrame(update);
    }

    update();
}

// ==============================
// 🎯 YIN ALGORITHM
// ==============================
function yinPitch(buffer, sampleRate) {
    const size = buffer.length;
    const halfSize = Math.floor(size / 2);

    let rms = 0;
    for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / size);
    if (rms < 0.02) return -1;

    const difference = new Float32Array(halfSize);
    for (let tau = 1; tau < halfSize; tau++) {
        let sum = 0;
        for (let i = 0; i < halfSize; i++) {
            const delta = buffer[i] - buffer[i + tau];
            sum += delta * delta;
        }
        difference[tau] = sum;
    }

    const cmnd = new Float32Array(halfSize);
    cmnd[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < halfSize; tau++) {
        runningSum += difference[tau];
        cmnd[tau] = difference[tau] * tau / runningSum;
    }

    const threshold = 0.15;
    let tauEstimate = -1;

    for (let tau = 2; tau < halfSize; tau++) {
        if (cmnd[tau] < threshold && cmnd[tau] < cmnd[tau - 1]) {
            tauEstimate = tau;
            break;
        }
    }

    if (tauEstimate === -1) return -1;

    // 🎯 Parabolic interpolation
    const x0 = tauEstimate - 1;
    const x1 = tauEstimate;
    const x2 = tauEstimate + 1;

    const y0 = cmnd[x0];
    const y1 = cmnd[x1];
    const y2 = cmnd[x2];

    const betterTau = x1 + (y2 - y0) / (2 * (2 * y1 - y2 - y0));

    const pitch = sampleRate / betterTau;

    return (pitch > 50 && pitch < 2000) ? pitch : -1;
}

// ==============================
// 🎼 MUSICAL CONVERSIONS
// ==============================
function frequencyToMidi(freq) {
    return 69 + 12 * Math.log2(freq / A4);
}

function midiToNote(midi) {
    const midiInt = Math.round(midi);
    const cents = Math.floor((midi - midiInt) * 100);
    const note = noteStrings[midiInt % 12];
    return { note, cents };
}

// ==============================
// 🖥️ UI UPDATE
// ==============================
function updateDisplay(freq) {
    const midi = frequencyToMidi(freq);
    const { note, cents } = midiToNote(midi);

    noteDisplay.textContent = note;
    freqDisplay.textContent = freq.toFixed(2) + " Hz";

    const clamped = Math.max(-50, Math.min(50, cents));
    const angle = (clamped / 50) * 45;

    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    noteDisplay.style.color = Math.abs(cents) < 5 ? "green" : "#333";
}
