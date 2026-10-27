/* =========================================================
   SOUND.JS

   Web Audio sound engine.

   No external audio files required.
   No dependencies.
   Works with ordinary HTML script tags.

   Usage:

       initAudio();
       playSound(SOUND.STEP);

       setSoundVolume(0.5);
       toggleSound();

   Sound Types:
       0 = sine
       1 = square
       2 = triangle
       3 = sawtooth
       4 = filtered noise

   Sound Definition:
       [type, startHz, endHz, duration, volume]

   Optional advanced parameters:
       5  attack
       6  vibrato rate
       7  vibrato depth
       8  filter mode
       9  sustain level
       10 release
       11 repeat count
       12 repeat interval
       13 timing variation

   Supported lengths: 5, 8, 11, 14

   Duration = seconds
   Volume   = 0.0 to 1.0

========================================================= */

/* =========================================================
   VICTORY MUSIC

   Triumphant retro game fanfare.

   Melody:
       C E G C5 | G C5 E5 | C major chord

   Uses existing audioCtx and masterGain.
========================================================= */

function playVictoryMusic() {

    if (!initAudio())
        return;

    const start = audioCtx.currentTime + 0.05;

    const notes = [
        // MIDI note, start time, duration
        [60, 0.00, 0.22],  // C4
        [64, 0.25, 0.22],  // E4
        [67, 0.50, 0.22],  // G4
        [72, 0.75, 0.48],  // C5

        [67, 1.35, 0.22],  // G4
        [72, 1.60, 0.22],  // C5
        [76, 1.85, 0.55]   // E5
    ];

    function frequency(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function playNote(midi, offset, duration, volume = 0.12) {

        const t = start + offset;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(frequency(midi), t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.012);
        gain.gain.setValueAtTime(volume * 0.75, t + duration * 0.65);
        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            t + duration
        );

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    // Ascending victory melody
    for (const [midi, offset, duration] of notes) {
        playNote(midi, offset, duration);
    }

    // Final triumphant C major chord
    const chordStart = 2.55;
    const chordDuration = 1.35;

    playNote(60, chordStart, chordDuration, 0.10); // C4
    playNote(64, chordStart, chordDuration, 0.08); // E4
    playNote(67, chordStart, chordDuration, 0.08); // G4
    playNote(72, chordStart, chordDuration, 0.07); // C5
}

/* =========================================================
   DEATH MARCH

   11 power chords based on the guitar tab.

   Organic character = 0.55
   Playback speed    = 1.25

   Uses existing audioCtx and masterGain.
========================================================= */

function playDeathMarch() {

    if (!audioCtx)
        return;

    const speed = 1.25;
    const organic = 0.55;

    const sequence = [
        [43, 0.00, 0.29],
        [43, 0.34, 0.29],
        [43, 0.69, 0.29],
        [43, 1.05, 0.43],
        [46, 1.55, 0.39],
        [45, 2.01, 0.27],
        [45, 2.34, 0.43],
        [43, 2.86, 0.29],
        [43, 3.22, 0.44],
        [42, 3.79, 0.31],
        [43, 4.19, 0.82]
    ];

    const accents = [
        1.00, 0.82, 0.90, 1.08,
        1.13, 0.86, 1.00, 0.88,
        1.06, 0.83, 1.12
    ];

    const midiToHz = note =>
        440 * Math.pow(2, (note - 69) / 12);

    const startTime = audioCtx.currentTime + 0.05;

    for (let i = 0; i < sequence.length; i++) {

        const [root, time, duration] = sequence[i];

        const at = startTime + time / speed;
        const dur = duration / speed;

        const accent = accents[i];

        const voices = [
            [0,  "triangle", 0.064],
            [7,  "sawtooth", 0.016],
            [12, "triangle", 0.016]
        ];

        for (const [offset, waveform, level] of voices) {

            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            oscillator.type = waveform;

            const pitch = midiToHz(root + offset);

            const detune =
                (i % 3 - 1) * organic * 3;

            oscillator.frequency.setValueAtTime(
                pitch * Math.pow(2, detune / 1200),
                at
            );

            oscillator.frequency.linearRampToValueAtTime(
                pitch,
                at + Math.min(0.1, dur * 0.35)
            );

            const volume = level * accent;

            const attack = 0.009 + organic * 0.025;

            const release = Math.min(
                dur * 0.38,
                0.075 + organic * 0.065
            );

            gain.gain.setValueAtTime(0.0001, at);

            gain.gain.linearRampToValueAtTime(
                volume,
                at + attack
            );

            gain.gain.linearRampToValueAtTime(
                volume * (0.7 + organic * 0.08),
                at + dur - release
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                at + dur
            );

            oscillator.connect(gain);
            gain.connect(masterGain);

            oscillator.start(at);
            oscillator.stop(at + dur + 0.01);

        }

    }

}

/* =========================================================
   SOUND IDS
========================================================= */

const SOUND = {

    STEP:    0,
    SWORD:   1,
    BOW:     2,
    ARROW:   3,
    PICKUP:  4,
    VICTORY: 5,
    HIT:     6,
    DEATH:   7,
    BAT:     8,
    SNAKE:   9,
    DEMON:  10,
    DRAGON: 11,
    WATER:  12,
    WIND:   13,
    RAT:           14,
    SPIDER:        15,
    BLOB:          16,
    WINGED_DRAGON: 17,
    SNORING: 18
};


/* =========================================================
   SOUND DEFINITIONS

   [type, startHz, endHz, duration, volume]
========================================================= */

const SOUNDS = [

    [4, 650, 110, 0.145, 0.32, 0.002, 0, 0, 0, 0.15, 0.100], // 0 STEP
    [4, 1200, 150, 0.180, 0.15], // 1 SWORD
    [3, 260, 85, 0.240, 0.24, 0.012, 9, 18, 0, 0.55, 0.120], // 2 OW
    [4, 1800, 300, 0.120, 0.10], // 3 ARROW
    [2, 650, 1450, 0.155, 0.15, 0.008, 0, 0, 0, 0.75, 0.055], // 4 PICKUP
    [2, 900, 500, 0.100, 0.08], // 5 KEY
    [4, 1800, 90, 0.165, 0.42, 0.001, 0, 0, 0, 0.18, 0.125], // 6 HIT
    [3, 400, 40, 0.800, 0.15], // 7 DEATH
    [4, 950, 650, 0.180, 0.28, 0.015, 22, 180, 0, 0.75, 0.055], // 8 BAT
    [4, 4800, 4600, 0.473, 0.45, 0.080, 0, 0, 1, 0.95, 0.129], // 9 SNAKE
    [3, 620, 170, 0.680, 0.24, 0.035, 8, 65, 0, 0.55, 0.240], // 10 DEMON
    [3, 170, 55, 1.100, 0.35, 0.120, 18, 65, 0, 0.85, 0.350], // 11 DRAGON
    [4, 1800, 1800, 1.800, 0.14, 0.120, 13, 200, 2, 1.00, 0.010], // 12 WATER
    [4, 600, 100, 1.000, 0.04], // 13 WIND
    [3, 950, 800, 0.160, 0.14, 0.015, 0, 0, 0, 0.80, 0.055], // 14 RAT
    [4, 1800, 850, 0.045, 0.16, 0.001, 0, 0, 0, 0.10, 0.035, 6, 0.065, 0.30], // 15 SPIDER
    [2, 180, 65, 0.420, 0.24, 0.090, 9, 45, 0, 0.75, 0.140], // 16 BLOB
    [4, 420, 110, 0.750, 0.28, 0.220, 2, 65, 0, 0.65, 0.250], // 17 WINGED_DRAGON
    [4, 180, 75, 0.650, 0.20, 0.120, 5, 28, 0, 0.70, 0.180, 2, 0.075, 1.00] // 18 SNORING - low, raspy, rhythmic sleeping breath
];


/* =========================================================
   AUDIO STATE
========================================================= */

let audioCtx = null;

let masterGain = null;

let noiseBuffer = null;

let soundEnabled = true;

let soundVolume = 0.5;


/* =========================================================
   INITIALIZE AUDIO

   Call from a user interaction such as keydown,
   mousedown, or button click.

   Browsers generally prevent audio playback until
   the user has interacted with the page.
========================================================= */

function initAudio() {

    if (!audioCtx) {

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            console.warn(
                "Web Audio API is not supported."
            );
            return false;
        }

        audioCtx = new AudioContextClass();

        masterGain = audioCtx.createGain();

        masterGain.gain.value = soundVolume;

        masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === "suspended") {

        audioCtx.resume().catch(function(error) {

            console.warn(
                "Unable to resume audio:",
                error
            );

        });
    }

    return true;
}


/* =========================================================
   GENERATE NOISE BUFFER

   Creates two seconds of white noise.

   Generated once and reused for all noise sounds.
========================================================= */

function getNoiseBuffer() {

    if (!audioCtx) return null;

    if (noiseBuffer) return noiseBuffer;

    const length =
        Math.floor(audioCtx.sampleRate * 2);

    noiseBuffer = audioCtx.createBuffer(
        1,
        length,
        audioCtx.sampleRate
    );

    const data =
        noiseBuffer.getChannelData(0);

    for (let i = 0; i < length; i++) {

        data[i] =
            Math.random() * 2 - 1;

    }

    return noiseBuffer;
}


/* =========================================================
   GET ENVELOPE

   Returns attack, sustain and release settings.

   Older 5 and 8 parameter sounds retain their
   original exponential decay behavior.
========================================================= */

function getEnvelope(s) {

    const duration = s[3];

    const attack = Math.min(
        Math.max(0, s[5] ?? 0),
        duration * 0.9
    );

    if (s.length < 11) {

        return {
            attack,
            release: 0,
            sustain: 0.0001,
            legacy: true
        };
    }

    const release = Math.min(
        Math.max(0, s[10]),
        Math.max(0, duration - attack)
    );

    return {
        attack,
        release,
        sustain: s[9],
        legacy: false
    };
}


/* =========================================================
   BUILD REPEAT TIMING

   Returns the relative start time of each pulse.

   The first pulse always begins at zero.
========================================================= */

function getPulseTimes(s) {

    const count = s[11] ?? 1;
    const interval = s[12] ?? 0.065;
    const variation = s[13] ?? 0;

    const times = [0];

    let time = 0;

    for (let i = 1; i < count; i++) {

        const random =
            (Math.random() * 2 - 1) * variation;

        const gap = Math.max(
            0.005,
            interval * (1 + random)
        );

        time += gap;

        times.push(time);
    }

    return times;
}


/* =========================================================
   PLAY SOUND PULSE

   Core synthesis routine.

   Supports:
       Frequency sweeps
       Filtered noise
       Attack
       Sustain
       Release
       Vibrato

   startTime is an AudioContext timestamp.
========================================================= */

function playSoundPulse(
    s,
    startTime,
    volumeMultiplier = 1
) {

    const [
        type,
        startHz,
        endHz,
        duration,
        volume,
        attack = 0,
        vibratoRate = 0,
        vibratoDepth = 0,
        filterMode = 0
    ] = s;

    const now = startTime;
    const end = now + duration;

    const gain = audioCtx.createGain();

    const peak = Math.max(
        0.0001,
        volume * Math.max(0, volumeMultiplier)
    );

    const e = getEnvelope(s);

    /* -----------------------------------------------------
       VOLUME ENVELOPE
    ----------------------------------------------------- */

    if (e.legacy) {

        if (e.attack > 0) {

            gain.gain.setValueAtTime(
                0.0001,
                now
            );

            gain.gain.linearRampToValueAtTime(
                peak,
                now + e.attack
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                end
            );

        } else {

            gain.gain.setValueAtTime(
                peak,
                now
            );

            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                end
            );
        }

    } else {

        const sustainEnd = end - e.release;

        gain.gain.setValueAtTime(
            e.attack > 0 ? 0 : peak,
            now
        );

        if (e.attack > 0) {

            gain.gain.linearRampToValueAtTime(
                peak,
                now + e.attack
            );
        }

        if (sustainEnd > now + e.attack) {

            gain.gain.linearRampToValueAtTime(
                peak * e.sustain,
                sustainEnd
            );
        }

        if (e.release > 0) {

            gain.gain.linearRampToValueAtTime(
                0,
                end
            );

        } else {

            gain.gain.setValueAtTime(0, end);
        }
    }

    gain.connect(masterGain);

    let source;
    let filter = null;

    let vibrato = null;
    let vibratoGain = null;

    /* -----------------------------------------------------
       FILTERED NOISE
    ----------------------------------------------------- */

    if (type === 4) {

        source = audioCtx.createBufferSource();

        source.buffer = getNoiseBuffer();
        source.loop = true;

        // Start each pulse at a different noise position.
        const noiseOffset = Math.random() * 2;

        filter = audioCtx.createBiquadFilter();

        filter.type = [
            "lowpass",
            "highpass",
            "bandpass"
        ][filterMode] || "lowpass";

        if (filterMode === 2)
            filter.Q.value = 0.8;

        const nyquist = audioCtx.sampleRate / 2;

        const f1 = Math.max(
            20,
            Math.min(startHz, nyquist * 0.95)
        );

        const f2 = Math.max(
            20,
            Math.min(endHz, nyquist * 0.95)
        );

        filter.frequency.setValueAtTime(
            f1,
            now
        );

        filter.frequency.exponentialRampToValueAtTime(
            f2,
            end
        );

        source.connect(filter);
        filter.connect(gain);

        source.start(now, noiseOffset);

    }

    /* -----------------------------------------------------
       OSCILLATOR SOURCE
    ----------------------------------------------------- */

    else {

        const waveforms = [
            "sine",
            "square",
            "triangle",
            "sawtooth"
        ];

        if (!waveforms[type]) {
            gain.disconnect();
            return;
        }

        source = audioCtx.createOscillator();

        source.type = waveforms[type];

        source.frequency.setValueAtTime(
            Math.max(1, startHz),
            now
        );

        source.frequency.exponentialRampToValueAtTime(
            Math.max(1, endHz),
            end
        );

        source.connect(gain);

        source.start(now);
    }

    /* -----------------------------------------------------
       VIBRATO
    ----------------------------------------------------- */

    if (
        vibratoRate > 0 &&
        vibratoDepth > 0
    ) {

        vibrato = audioCtx.createOscillator();

        vibrato.type = "sine";

        vibrato.frequency.value = vibratoRate;

        vibratoGain = audioCtx.createGain();

        vibratoGain.gain.value = vibratoDepth;

        vibrato.connect(vibratoGain);

        vibratoGain.connect(
            type === 4
                ? filter.frequency
                : source.frequency
        );

        vibrato.start(now);
        vibrato.stop(end);
    }

    /* -----------------------------------------------------
       CLEANUP
    ----------------------------------------------------- */

    source.onended = function() {

        source.disconnect();

        if (filter)
            filter.disconnect();

        if (vibrato) {
            vibrato.disconnect();
            vibratoGain.disconnect();
        }

        gain.disconnect();
    };

    source.stop(end);
}


/* =========================================================
   PLAY SOUND

   id = index into SOUNDS array.

   Supports advanced sound definitions.

   Multiple sounds can play simultaneously.

   volumeMultiplier supports distance attenuation.
========================================================= */

function playSound(id, volumeMultiplier = 1) {

    if (id === SOUND.DEATH) {
        playDeathMarch();
        return;
    }

    if (id === SOUND.VICTORY) {
        playVictoryMusic();
        return;
    }

    if (!soundEnabled) return;

    if (!audioCtx || !masterGain) return;

    const def = SOUNDS[id];

    if (!def) return;

    if (def[3] <= 0) return;

    const now = audioCtx.currentTime;

    const times = getPulseTimes(def);

    for (const offset of times) {

        playSoundPulse(
            def,
            now + offset,
            volumeMultiplier
        );
    }
}


/* =========================================================
   SET MASTER VOLUME

   value = 0.0 to 1.0
========================================================= */

function setSoundVolume(value) {

    soundVolume = Math.max(
        0,
        Math.min(1, value)
    );

    if (masterGain) {

        masterGain.gain.value =
            soundVolume;

    }
}


/* =========================================================
   ENABLE / DISABLE SOUND

   Returns current enabled state.
========================================================= */

function toggleSound() {

    soundEnabled = !soundEnabled;

    if (masterGain && audioCtx) {

        masterGain.gain.setTargetAtTime(
            soundEnabled ? soundVolume : 0,
            audioCtx.currentTime,
            0.01
        );

    }

    return soundEnabled;
}


/* =========================================================
   QUERY SOUND STATE
========================================================= */

function isSoundEnabled() {

    return soundEnabled;

}


/* =========================================================
   STOP ALL SOUND

   Immediately mutes the master output.

   Future sounds can play after restoring volume.
========================================================= */

function stopAllSounds() {

    if (!audioCtx || !masterGain) return;

    masterGain.gain.cancelScheduledValues(
        audioCtx.currentTime
    );

    masterGain.gain.setValueAtTime(
        0,
        audioCtx.currentTime
    );

    masterGain.gain.setTargetAtTime(
        soundEnabled ? soundVolume : 0,
        audioCtx.currentTime,
        0.02
    );

}