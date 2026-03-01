// ============================================
// AEGIS — Sound Effects Engine
// Web Audio API synthesized military sounds
// ============================================

class AudioEngine {
    constructor() {
        this._ctx = null;
        this._enabled = true;
        this._volume = 0.3;
        this._initialized = false;
    }

    _ensureContext() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        this._initialized = true;
        return this._ctx;
    }

    get enabled() { return this._enabled; }
    set enabled(v) { this._enabled = v; }

    get volume() { return this._volume; }
    set volume(v) { this._volume = Math.max(0, Math.min(1, v)); }

    // -- Launch sound: rising tone + noise burst --
    playLaunch() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(this._volume * 0.25, now);
        gain.gain.exponentialDecayTo?.(0.001, now + 0.6) ||
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        // Rising tone
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.5);

        // Noise burst
        this._playNoiseBurst(ctx, now, 0.15, this._volume * 0.15);
    }

    // -- Intercept sound: sharp pop + high ping --
    playIntercept() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;

        // Sharp pop
        const gain1 = ctx.createGain();
        gain1.connect(ctx.destination);
        gain1.gain.setValueAtTime(this._volume * 0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(2000, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + 0.12);
        osc1.connect(gain1);
        osc1.start(now);
        osc1.stop(now + 0.15);

        // Success ping
        const gain2 = ctx.createGain();
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(this._volume * 0.2, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, now + 0.05);
        osc2.frequency.setValueAtTime(1600, now + 0.15);
        osc2.connect(gain2);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.5);
    }

    // -- Impact/miss sound: deep boom + rumble --
    playImpact() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;

        // Deep boom
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(this._volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.8);

        // Noise rumble
        this._playNoiseBurst(ctx, now, 0.5, this._volume * 0.2);

        // Sub-bass thud
        const gain2 = ctx.createGain();
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(this._volume * 0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(50, now);
        osc2.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        osc2.connect(gain2);
        osc2.start(now);
        osc2.stop(now + 0.4);
    }

    // -- Engage sound: quick electronic chirp --
    playEngage() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(this._volume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.05);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // -- Alert / threat detected: two-tone beep --
    playAlert() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;

        for (let i = 0; i < 2; i++) {
            const t = now + i * 0.15;
            const gain = ctx.createGain();
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(this._volume * 0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(i === 0 ? 800 : 1000, t);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.1);
        }
    }

    // -- Scenario start: dramatic ascending tones --
    playScenarioStart() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;

        const notes = [200, 300, 400, 600];
        notes.forEach((freq, i) => {
            const t = now + i * 0.12;
            const gain = ctx.createGain();
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(this._volume * 0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.25);
        });
    }

    // -- Wave incoming: low warning pulse --
    playWaveIncoming() {
        if (!this._enabled) return;
        const ctx = this._ensureContext();
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this._volume * 0.2, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.4);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    // -- Helpers --

    _playNoiseBurst(ctx, time, duration, volume) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        // Low-pass filter for more bassy rumble
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(time);
    }
}

export default new AudioEngine();
