/**
 * Sound-Reactive ASCII Visualizer
 * Audio-driven ASCII patterns using Web Audio API
 */

export class SoundViz {
  constructor(container, options = {}) {
    this.container = container;
    this.cols = options.cols || 60;
    this.rows = options.rows || 20;
    this.mode = options.mode || "bars";

    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.source = null;
    this.isPlaying = false;
    this.animationFrame = null;

    this.intensityChars = " .-:=+*#%@";
    this.blockChars = " ░▒▓█";

    this.init();
  }

  init() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "sound-viz-wrapper";
    this.wrapper.style.cssText = `
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1;
      background: var(--bg-primary, #000);
      padding: 20px;
      text-align: center;
    `;
    this.container.appendChild(this.wrapper);

    this.controls = document.createElement("div");
    this.controls.className = "sound-viz-controls";
    this.controls.style.cssText = `
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    `;
    this.wrapper.appendChild(this.controls);

    this.micBtn = this.createButton("[ MIC ]", () => this.startMicrophone());
    this.demoBtn = this.createButton("[ DEMO ]", () => this.startDemo());
    this.stopBtn = this.createButton("[ STOP ]", () => this.stop());

    ["bars", "radial", "wave"].forEach((mode) => {
      this.createButton(`[ ${mode.toUpperCase()} ]`, () => (this.mode = mode));
    });

    this.display = document.createElement("pre");
    this.display.className = "sound-viz-display";
    this.display.style.cssText = `
      margin: 0;
      color: var(--text-primary, #fff);
      white-space: pre;
      text-align: left;
      display: inline-block;
    `;
    this.wrapper.appendChild(this.display);

    this.renderIdle();
  }

  createButton(text, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.style.cssText = `
      background: transparent;
      border: 1px solid var(--border-primary, #333);
      color: var(--text-primary, #fff);
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      padding: 5px 10px;
      cursor: pointer;
    `;
    btn.addEventListener("click", onClick);
    this.controls.appendChild(btn);
    return btn;
  }

  async initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  async startMicrophone() {
    try {
      await this.initAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      this.isPlaying = true;
      this.animate();
    } catch (err) {
      console.error("Microphone access denied:", err);
      this.display.textContent = "Microphone access denied.";
    }
  }

  async startDemo() {
    await this.initAudio();

    this.oscillator = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 0.3;

    this.oscillator.type = "sawtooth";
    this.oscillator.frequency.value = 100;

    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.oscillator.frequency);
    this.lfo.frequency.value = 0.5;
    this.lfoGain.gain.value = 80;

    this.oscillator.start();
    this.lfo.start();
    this.isPlaying = true;
    this.animate();
  }

  stop() {
    this.isPlaying = false;
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }
    if (this.lfo) {
      this.lfo.stop();
      this.lfo = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.renderIdle();
  }

  renderIdle() {
    let output = "";
    const centerY = Math.floor(this.rows / 2);
    const text = "CLICK MIC OR DEMO TO START";
    const textStart = Math.floor((this.cols - text.length) / 2);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (y === centerY && x >= textStart && x < textStart + text.length) {
          output += text[x - textStart];
        } else {
          output += ".";
        }
      }
      output += "\n";
    }
    this.display.textContent = output;
  }

  animate() {
    if (!this.isPlaying) return;
    this.analyser.getByteFrequencyData(this.dataArray);

    switch (this.mode) {
      case "bars":
        this.renderBars();
        break;
      case "radial":
        this.renderRadial();
        break;
      case "wave":
        this.renderWave();
        break;
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  renderBars() {
    const bucketSize = Math.floor(this.dataArray.length / this.cols);
    let output = "";

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let sum = 0;
        for (let i = 0; i < bucketSize; i++)
          sum += this.dataArray[x * bucketSize + i];
        const value = sum / bucketSize / 255;
        const barHeight = value * this.rows;
        const rowFromBottom = this.rows - y - 1;

        if (rowFromBottom < barHeight) {
          const idx = Math.floor(value * (this.blockChars.length - 1));
          output += this.blockChars[idx];
        } else {
          output += " ";
        }
      }
      output += "\n";
    }
    this.display.textContent = output;
  }

  renderRadial() {
    const cx = this.cols / 2;
    const cy = this.rows / 2;
    const maxR = Math.min(cx, cy) - 1;
    let output = "";

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const dx = (x - cx) * 0.5;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const normAngle = (angle + Math.PI) / (2 * Math.PI);
        const bucket = Math.floor(normAngle * this.dataArray.length);
        const value = this.dataArray[bucket] / 255;
        const targetDist = value * maxR;

        if (dist < targetDist && dist > targetDist - 2) {
          const idx = Math.floor(value * (this.intensityChars.length - 1));
          output += this.intensityChars[idx];
        } else if (dist < 1) {
          output += "●";
        } else {
          output += " ";
        }
      }
      output += "\n";
    }
    this.display.textContent = output;
  }

  renderWave() {
    const waveData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(waveData);
    const centerY = this.rows / 2;
    let output = "";

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const sampleIdx = Math.floor((x / this.cols) * waveData.length);
        const sample = (waveData[sampleIdx] - 128) / 128;
        const waveY = centerY + sample * (this.rows / 2 - 1);

        if (Math.abs(y - waveY) < 0.8) output += "█";
        else if (Math.abs(y - centerY) < 0.5) output += "─";
        else output += " ";
      }
      output += "\n";
    }
    this.display.textContent = output;
  }

  dispose() {
    this.stop();
    if (this.audioContext) this.audioContext.close();
    this.wrapper.remove();
  }
}
