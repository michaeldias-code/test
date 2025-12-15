<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Afinador Cromático Profissional</title>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  color: #eee;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 100%;
}

h1 {
  font-size: 2.1em;
  margin-bottom: 10px;
  font-weight: 300;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    color: red;
}

button {
  padding: 10px 30px;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  font-weight: 600;
  margin-bottom: 10px;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.6);
}

button:active {
  transform: translateY(0);
}

button.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

#note {
  font-size: 96px;
  font-weight: bold;
  margin: 20px 0;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
  letter-spacing: 5px;
}

#octave {
  font-size: 48px;
  color: #aaa;
  margin-top: -15px;
  margin-bottom: 20px;
}

#status {
  font-size: 24px;
  margin: 20px 0;
  font-weight: 600;
  min-height: 30px;
}

#freq {
  font-size: 20px;
  color: #aaa;
  margin-bottom: 30px;
}

.tuner-display {
  position: relative;
  margin: 30px 0;
}

.scale {
  width: 100%;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.scale-marks {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  height: 100%;
  align-items: center;
}

.mark {
  width: 2px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

.mark.center {
  height: 60px;
  width: 3px;
  background: #4ade80;
  box-shadow: 0 0 10px #4ade80;
}

#needle {
  position: absolute;
  width: 4px;
  height: 70px;
  background: linear-gradient(to bottom, #ff4444, #ff6666);
  top: 5px;
  left: 50%;
  transform-origin: top center;
  transition: transform 0.1s ease-out;
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
}

#needle::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 12px solid #ff4444;
}

.cents-display {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #888;
}

#meter {
  width: 100%;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin: 20px 0;
  overflow: hidden;
  position: relative;
}

#level {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.1s ease;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
}

.info {
  margin-top: 20px;
  font-size: 14px;
  color: #888;
  line-height: 1.6;
}

.perfect-indicator {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 20px auto;
  transition: all 0.3s ease;
}

.perfect-indicator.tuned {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
}

@media (max-width: 768px) {
  .container {
    padding: 20px;
  }
  
  h1 {
    font-size: 2em;
  }
  
  #note {
    font-size: 72px;
  }
  
  #octave {
    font-size: 36px;
  }
}
</style>
</head>
<body>

<div class="container">
  <h1>🎵 Afinador Cromático</h1>
  
  <button id="start">🎤 Iniciar Afinador</button>
  
  <div id="note">–</div>
  <div id="octave"></div>
  
  <div class="perfect-indicator" id="perfectIndicator">
    <span id="perfectIcon">🎯</span>
  </div>
  
  <div id="status">Clique em "Iniciar" para começar</div>
  <div id="freq">0 Hz</div>
  
  <div class="tuner-display">
    <div class="scale">
      <div class="scale-marks">
        <div class="mark"></div>
        <div class="mark"></div>
        <div class="mark"></div>
        <div class="mark"></div>
        <div class="mark center"></div>
        <div class="mark"></div>
        <div class="mark"></div>
        <div class="mark"></div>
        <div class="mark"></div>
      </div>
      <div id="needle"></div>
    </div>
    <div class="cents-display">
      <span>-50¢</span>
      <span>-25¢</span>
      <span style="color: #4ade80;">0¢</span>
      <span>+25¢</span>
      <span>+50¢</span>
    </div>
  </div>
  
  <div id="meter">
    <div id="level"></div>
  </div>
  
  <div class="info">
    💡 <strong>Dica:</strong> Toque uma nota próxima ao microfone. O afinador mostrará a nota detectada e o desvio em cents.
  </div>
</div>

<script>
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const notesPT = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
let ctx, analyser;
let lastPitch = null;
let isRunning = false;

const startBtn = document.getElementById("start");
const noteEl = document.getElementById("note");
const octaveEl = document.getElementById("octave");
const statusEl = document.getElementById("status");
const freqEl = document.getElementById("freq");
const levelEl = document.getElementById("level");
const needleEl = document.getElementById("needle");
const perfectIndicator = document.getElementById("perfectIndicator");
const perfectIcon = document.getElementById("perfectIcon");

startBtn.onclick = async () => {
  if (isRunning) {
    // Parar
    isRunning = false;
    startBtn.textContent = "🎤 Iniciar Afinador";
    startBtn.classList.remove("active");
    statusEl.textContent = "Parado";
    statusEl.style.color = "#888";
    return;
  }
  
  try {
    ctx = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
    
    const src = ctx.createMediaStreamSource(stream);
    
    // Filtros para melhorar a detecção
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 60;  // Filtrar ruídos graves
    hp.Q.value = 0.7;
    
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2000;  // Aumentado para captar notas agudas
    lp.Q.value = 0.7;
    
    analyser = ctx.createAnalyser();
    analyser.fftSize = 4096;  // Aumentado para melhor precisão
    analyser.smoothingTimeConstant = 0.8;
    
    src.connect(hp);
    hp.connect(lp);
    lp.connect(analyser);
    
    isRunning = true;
    startBtn.textContent = "⏸ Parar";
    startBtn.classList.add("active");
    statusEl.textContent = "Ouvindo...";
    statusEl.style.color = "#aaa";
    
    update();
  } catch (err) {
    alert("Erro ao acessar o microfone. Verifique as permissões.");
    console.error(err);
  }
};

function update() {
  if (!isRunning) return;
  
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  
  // Calcular RMS para nível de volume
  const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
  levelEl.style.width = Math.min(100, rms * 500) + "%";
  
  // Só processar se houver volume suficiente
  if (rms > 0.005) {
    const pitch = yin(buf, ctx.sampleRate);
    
    if (pitch > 0 && pitch >= 60 && pitch <= 2000) {
      // Suavização temporal mais agressiva
      lastPitch = lastPitch ? lastPitch * 0.85 + pitch * 0.15 : pitch;
      display(lastPitch);
    }
  }
  
  requestAnimationFrame(update);
}

function display(freq) {
  // Calcular nota MIDI
  const midi = 69 + 12 * Math.log2(freq / 440);
  const roundedMidi = Math.round(midi);
  const noteIndex = roundedMidi % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const note = notes[noteIndex];
  
  // Calcular desvio em cents
  const cents = (midi - roundedMidi) * 100;
  
  // Atualizar display
  noteEl.textContent = note;
  octaveEl.textContent = octave;
  freqEl.textContent = freq.toFixed(1) + " Hz";
  
  // Atualizar agulha (limite de -50 a +50 cents)
  const clamped = Math.max(-50, Math.min(50, cents));
  needleEl.style.transform = `translateX(-50%) rotate(${clamped * 0.9}deg)`;
  
  // Status e indicador de afinação perfeita
  const threshold = 3;  // Mais tolerante: ±3 cents
  if (Math.abs(cents) < threshold) {
    statusEl.textContent = "✓ PERFEITAMENTE AFINADO";
    statusEl.style.color = "#4ade80";
    perfectIndicator.classList.add("tuned");
    perfectIcon.textContent = "✓";
  } else if (Math.abs(cents) < 10) {
    statusEl.textContent = "Quase lá: " + (cents > 0 ? "+" : "") + cents.toFixed(1) + "¢";
    statusEl.style.color = "#fbbf24";
    perfectIndicator.classList.remove("tuned");
    perfectIcon.textContent = cents > 0 ? "↑" : "↓";
  } else {
    const direction = cents > 0 ? "Muito alto" : "Muito baixo";
    statusEl.textContent = direction + ": " + (cents > 0 ? "+" : "") + cents.toFixed(1) + "¢";
    statusEl.style.color = "#888";
    perfectIndicator.classList.remove("tuned");
    perfectIcon.textContent = cents > 0 ? "↑↑" : "↓↓";
  }
}

// Algoritmo YIN otimizado
function yin(buf, sr) {
  const SIZE = buf.length;
  const minFreq = 60;   // Ajustado para notas mais graves
  const maxFreq = 2000; // Ajustado para notas mais agudas
  const minTau = Math.floor(sr / maxFreq);
  const maxTau = Math.min(Math.floor(sr / minFreq), SIZE / 2);
  
  let yinBuf = new Float32Array(maxTau);
  
  // Passo 1: Diferença
  for (let tau = 1; tau < maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < SIZE - tau; i++) {
      let d = buf[i] - buf[i + tau];
      sum += d * d;
    }
    yinBuf[tau] = sum;
  }
  
  // Passo 2: Diferença cumulativa normalizada
  let runningSum = 0;
  yinBuf[0] = 1;
  for (let tau = 1; tau < maxTau; tau++) {
    runningSum += yinBuf[tau];
    yinBuf[tau] *= tau / runningSum;
  }
  
  // Passo 3: Busca do mínimo absoluto
  const threshold = 0.1;  // Threshold mais rigoroso
  let bestTau = -1;
  
  for (let tau = minTau; tau < maxTau; tau++) {
    if (yinBuf[tau] < threshold) {
      // Encontrou candidato, mas vamos procurar o mínimo local
      while (tau + 1 < maxTau && yinBuf[tau + 1] < yinBuf[tau]) {
        tau++;
      }
      bestTau = tau;
      break;
    }
  }
  
  if (bestTau === -1) return -1;
  
  // Passo 4: Interpolação parabólica para melhor precisão
  let betterTau = bestTau;
  if (bestTau > 0 && bestTau < maxTau - 1) {
    const s0 = yinBuf[bestTau - 1];
    const s1 = yinBuf[bestTau];
    const s2 = yinBuf[bestTau + 1];
    betterTau = bestTau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }
  
  return sr / betterTau;
}
</script>

</body>
</html>
