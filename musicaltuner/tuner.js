// tuner.js

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const A4 = 440; // Frequência de referência Lá4

let audioContext;
let analyser;
let mediaStreamSource;

const startButton = document.getElementById('start-button');
const noteDisplay = document.getElementById('note');
const freqDisplay = document.getElementById('frequency');
const needle = document.getElementById('needle');

startButton.onclick = startTuner;

function startTuner() {
    startButton.disabled = true;
    
    // Cria AudioContext (compatibilidade com navegadores)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Configura o Analisador
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Tamanho do buffer para FFT
    const bufferLength = analyser.fftSize;
    
    // Array para armazenar os dados de frequência (magnitude)
    const dataArray = new Uint8Array(bufferLength);

    // 1. Acesso ao microfone
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            // Conecta o microfone ao analisador, mas não ao destino (speakers)
            mediaStreamSource.connect(analyser); 
            
            // 2. Inicia o loop de processamento
            processAudio();
        })
        .catch(err => {
            console.error('Erro ao acessar o microfone: ' + err);
            noteDisplay.textContent = "Erro: Microfone negado.";
            startButton.disabled = false;
        });
}

function processAudio() {
    // Pega a informação de frequência (domínio do tempo)
    // Usaremos getFloatTimeDomainData para um algoritmo mais preciso (ACF)
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    // Loop principal de processamento
    function updatePitch() {
        if (!analyser) return;

        analyser.getFloatTimeDomainData(buffer); // Captura a forma de onda
        
        // --- 3. Chamada ao Algoritmo de Detecção de Pitch (PRÓXIMA SEÇÃO) ---
        const pitch = autoCorrelate(buffer, audioContext.sampleRate);

        if (pitch > 0) {
            // Se o pitch foi detectado:
            updateDisplay(pitch);
        } else {
            // Silêncio ou ruído
            noteDisplay.textContent = "Aguardando som...";
            freqDisplay.textContent = "0.0 Hz";
            needle.style.transform = `translateX(-50%) rotate(0deg)`;
        }

        // Continua o loop no próximo frame
        requestAnimationFrame(updatePitch);
    }
    
    updatePitch();
}

// tuner.js (continuação)

/**
 * Otimização do Autocorrelação (ACF) com refinamento e verificação de limiar.
 * Este método é mais robusto que a ACF básica.
 * @param {Float32Array} buffer - O buffer de forma de onda.
 * @param {number} sampleRate - Taxa de amostragem.
 * @returns {number} A frequência (pitch) detectada em Hz, ou -1.
 */
function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    const maxOffset = Math.floor(SIZE / 2); // Busca até metade do buffer
    let bestOffset = -1;
    let bestCorrelation = -Infinity;
    let threshold = 0.2; // Limiar mínimo de volume (RMS)
    let minCorrelation = 0.9; // Limiar mínimo para a correlação

    let rms = 0;
    for(let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);

    if(rms < threshold) return -1; // Silêncio ou muito baixo

    // 1. Calcula Autocorrelação discreta e encontra o melhor pico
    for (let offset = 1; offset < maxOffset; offset++) {
        let correlation = 0;

        for (let i = 0; i < maxOffset; i++) {
            correlation += buffer[i] * buffer[i + offset];
        }

        // Normalização (opcional, mas recomendado para robustez)
        let normalization = 0;
        for (let i = 0; i < maxOffset; i++) {
            normalization += buffer[i] * buffer[i] + buffer[i + offset] * buffer[i + offset];
        }
        correlation = 2 * correlation / normalization;

        // Procura o pico, ignorando o primeiro (offset=0, que é sempre 1)
        if (correlation > bestCorrelation && correlation > minCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
        }
    }

    // Nenhuma correlação forte encontrada
    if (bestOffset === -1) return -1;

    // 2. Interpolação Parabólica para aumentar a precisão (Sub-pixel/Sub-lag)
    // Refina o pico usando os pontos vizinhos (lag - 1, lag, lag + 1)
    
    // a) Define os pontos de correlação vizinhos
    const c0 = bestOffset > 0 ? bestCorrelation : 0; // Correlação no pico
    const c1 = bestOffset > 0 && bestOffset < maxOffset - 1 ? (
        // Recalcula o lag anterior para a interpolação, se possível
        (2 * buffer.slice(0, maxOffset - 1).reduce((sum, val, i) => sum + val * buffer[i + bestOffset - 1], 0) / 
         buffer.slice(0, maxOffset - 1).reduce((sum, val, i) => sum + val * val + buffer[i + bestOffset - 1] * buffer[i + bestOffset - 1], 0))
    ) : c0; 
    const c2 = bestOffset < maxOffset - 1 ? (
        // Recalcula o lag seguinte para a interpolação, se possível
        (2 * buffer.slice(0, maxOffset - 1).reduce((sum, val, i) => sum + val * buffer[i + bestOffset + 1], 0) / 
         buffer.slice(0, maxOffset - 1).reduce((sum, val, i) => sum + val * val + buffer[i + bestOffset + 1] * buffer[i + bestOffset + 1], 0))
    ) : c0;

    // b) Aplica a fórmula da interpolação parabólica
    // Fórmula: p = (c1 - c2) / (2 * (c1 - 2*c0 + c2))
    const p = (c1 - c2) / (2 * (c1 - 2 * c0 + c2));

    // O melhor offset real é o offset discreto + o ajuste da interpolação
    const preciseOffset = bestOffset + p;

    // 3. Calcula a Frequência Precisa
    const pitch = sampleRate / preciseOffset;

    // Retorna a frequência se for razoável (aprox. A0 a B7)
    return (pitch > 20 && pitch < 5000) ? pitch : -1;
}


// --- Funções de Conversão Musical ---

/**
 * Converte a frequência (Hz) em um número MIDI (0-127).
 * @param {number} frequency - Frequência em Hz.
 * @returns {number} Número MIDI (com ponto flutuante).
 */
function frequencyToMidi(frequency) {
    // Fórmula: MIDI = 69 + 12 * log2(f / 440)
    return 69 + 12 * Math.log2(frequency / A4);
}

/**
 * Converte o número MIDI para a nota (ex: 69 -> A).
 * @param {number} midi - Número MIDI (ponto flutuante).
 * @returns {object} { note: string, cents: number }
 */
function midiToNote(midi) {
    // Número MIDI inteiro corresponde ao centro da nota
    const midiInteger = Math.round(midi);
    
    // Calcula o desvio em Cents (100 cents = 1 semitom)
    // cents = 100 * (MIDI real - MIDI inteiro mais próximo)
    const cents = Math.floor(100 * (midi - midiInteger));
    
    // Calcula o índice da nota (0 = C, 11 = B)
    const noteIndex = midiInteger % 12;
    const note = noteStrings[noteIndex];
    
    return { note, cents };
}


// --- Funções de Display ---

/**
 * Atualiza a interface com a nota e o desvio detectados.
 * @param {number} pitch - Frequência detectada em Hz.
 */
function updateDisplay(pitch) {
    const midi = frequencyToMidi(pitch);
    const { note, cents } = midiToNote(midi);
    
    // 1. Atualiza Nota e Frequência
    noteDisplay.textContent = note;
    freqDisplay.textContent = pitch.toFixed(2) + " Hz";
    
    // 2. Atualiza o indicador (agulha)
    // Mapeia Cents (-50 a +50) para um ângulo de rotação (ex: -45deg a +45deg)
    // Clamp Cents para evitar rotação excessiva
    const clampedCents = Math.max(-50, Math.min(50, cents));
    
    // Mapeia -50 -> -45 graus e 50 -> 45 graus.
    // O 0 grau é o centro (afinada).
    const rotation = (clampedCents / 50) * 45; 
    
    needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    
    // Adiciona feedback visual (Verde se estiver afinado)
    if (Math.abs(cents) < 5) { // 5 cents de tolerância
        noteDisplay.style.color = "green";
    } else {
        noteDisplay.style.color = "#333";
    }
}