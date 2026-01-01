/**
 * VoiceOver Studio - Audio Engine
 * Handles all audio playback, recording, and processing including ducking
 */

class AudioEngine extends Utils.EventEmitter {
    constructor() {
        super();

        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;

        // State
        this.isPlaying = false;
        this.isRecording = false;
        this.currentTime = 0;
        this.duration = 0;
        this.startTimestamp = 0;
        this.startOffset = 0;

        // Tracks
        this.tracks = new Map();
        this.activeAudioNodes = new Map();

        // Recording
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingStream = null;

        // Ducking
        this.duckingSettings = {
            enabled: true,
            level: -12, // dB
            attack: 50, // ms
            release: 200, // ms
            lookahead: 100 // ms
        };

        // Animation frame
        this.animationFrame = null;

        // Initialize
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 48000
            });

            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            // Create analyser for visualization
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.masterGain.connect(this.analyser);

            console.log('AudioEngine initialized');
        } catch (error) {
            console.error('Failed to initialize AudioEngine:', error);
            Utils.showToast('Failed to initialize audio', 'error');
        }
    }

    /**
     * Resume audio context (required after user interaction)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Load audio file and return buffer
     */
    async loadAudioFile(file) {
        await this.resume();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    resolve({
                        buffer: audioBuffer,
                        duration: audioBuffer.duration,
                        sampleRate: audioBuffer.sampleRate,
                        numberOfChannels: audioBuffer.numberOfChannels
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read audio file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Add audio track
     */
    addTrack(trackId, options = {}) {
        const track = {
            id: trackId,
            name: options.name || `Track ${this.tracks.size + 1}`,
            type: options.type || 'audio', // 'audio' or 'voiceover'
            audioBuffer: options.audioBuffer || null,
            gain: this.audioContext.createGain(),
            pan: this.audioContext.createStereoPanner(),
            volume: options.volume ?? 1,
            muted: false,
            solo: false,
            clips: [],
            color: options.color || Utils.getNextTrackColor([...this.tracks.values()].map(t => t.color))
        };

        // Connect nodes
        track.gain.connect(track.pan);
        track.pan.connect(this.masterGain);
        track.gain.gain.value = track.volume;

        this.tracks.set(trackId, track);
        this.emit('trackAdded', track);

        return track;
    }

    /**
     * Remove track
     */
    removeTrack(trackId) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.gain.disconnect();
            track.pan.disconnect();
            this.tracks.delete(trackId);
            this.emit('trackRemoved', trackId);
        }
    }

    /**
     * Get track by ID
     */
    getTrack(trackId) {
        return this.tracks.get(trackId);
    }

    /**
     * Set track volume
     */
    setTrackVolume(trackId, volume) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.volume = Utils.clamp(volume, 0, 2);
            if (!track.muted) {
                track.gain.gain.value = track.volume;
            }
        }
    }

    /**
     * Set track mute
     */
    setTrackMute(trackId, muted) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.muted = muted;
            this.updateTrackGains();
        }
    }

    /**
     * Set track solo
     */
    setTrackSolo(trackId, solo) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.solo = solo;
            this.updateTrackGains();
        }
    }

    /**
     * Update track gains based on mute/solo state
     */
    updateTrackGains() {
        const hasSolo = [...this.tracks.values()].some(t => t.solo);

        for (const track of this.tracks.values()) {
            let gain = track.volume;

            if (track.muted) {
                gain = 0;
            } else if (hasSolo && !track.solo) {
                gain = 0;
            }

            track.gain.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
        }
    }

    /**
     * Add audio clip to track
     */
    addClip(trackId, clip) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.clips.push(clip);
            this.emit('clipAdded', { trackId, clip });
        }
    }

    /**
     * Play
     */
    async play(startTime = null) {
        await this.resume();

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.startOffset = startTime !== null ? startTime : this.currentTime;
        this.startTimestamp = this.audioContext.currentTime;

        // Schedule all audio for playback
        this.scheduleAudio();

        // Start update loop
        this.startUpdateLoop();

        this.emit('play');
    }

    /**
     * Pause
     */
    pause() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.currentTime = this.getCurrentTime();

        // Stop all scheduled audio
        this.stopAllAudio();

        // Stop update loop
        this.stopUpdateLoop();

        this.emit('pause');
    }

    /**
     * Stop (pause and go to beginning)
     */
    stop() {
        this.pause();
        this.currentTime = 0;
        this.emit('stop');
        this.emit('timeUpdate', 0);
    }

    /**
     * Seek to time
     */
    seek(time) {
        const wasPlaying = this.isPlaying;

        if (wasPlaying) {
            this.stopAllAudio();
        }

        this.currentTime = Utils.clamp(time, 0, this.duration);

        if (wasPlaying) {
            this.startOffset = this.currentTime;
            this.startTimestamp = this.audioContext.currentTime;
            this.scheduleAudio();
        }

        this.emit('seek', this.currentTime);
        this.emit('timeUpdate', this.currentTime);
    }

    /**
     * Get current playback time
     */
    getCurrentTime() {
        if (this.isPlaying) {
            return this.startOffset + (this.audioContext.currentTime - this.startTimestamp);
        }
        return this.currentTime;
    }

    /**
     * Schedule audio for playback
     */
    scheduleAudio() {
        for (const [trackId, track] of this.tracks) {
            if (!track.audioBuffer) continue;

            const source = this.audioContext.createBufferSource();
            source.buffer = track.audioBuffer;
            source.connect(track.gain);

            const offset = Math.max(0, this.startOffset);
            const duration = track.audioBuffer.duration - offset;

            if (duration > 0) {
                source.start(0, offset, duration);
                this.activeAudioNodes.set(trackId, source);

                source.onended = () => {
                    this.activeAudioNodes.delete(trackId);
                    // Check if all tracks ended
                    if (this.activeAudioNodes.size === 0 && this.isPlaying) {
                        this.stop();
                    }
                };
            }
        }
    }

    /**
     * Stop all scheduled audio
     */
    stopAllAudio() {
        for (const [trackId, source] of this.activeAudioNodes) {
            try {
                source.stop();
            } catch (e) {
                // Already stopped
            }
        }
        this.activeAudioNodes.clear();
    }

    /**
     * Start playback update loop
     */
    startUpdateLoop() {
        const update = () => {
            if (!this.isPlaying) return;

            const time = this.getCurrentTime();
            this.emit('timeUpdate', time);

            // Apply ducking
            if (this.duckingSettings.enabled) {
                this.applyDucking(time);
            }

            // Check if reached end
            if (time >= this.duration) {
                this.stop();
                return;
            }

            this.animationFrame = requestAnimationFrame(update);
        };

        this.animationFrame = requestAnimationFrame(update);
    }

    /**
     * Stop update loop
     */
    stopUpdateLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Apply ducking based on subtitle timing
     */
    applyDucking(currentTime) {
        const lookaheadTime = currentTime + (this.duckingSettings.lookahead / 1000);

        // Check if any voiceover track has a subtitle at current time
        let shouldDuck = false;

        for (const track of this.tracks.values()) {
            if (track.type === 'subtitles') {
                for (const clip of track.clips) {
                    if (lookaheadTime >= clip.startTime && currentTime < clip.endTime) {
                        shouldDuck = true;
                        break;
                    }
                }
            }
            if (shouldDuck) break;
        }

        // Apply ducking to audio tracks
        for (const track of this.tracks.values()) {
            if (track.type === 'audio' && !track.muted) {
                const targetGain = shouldDuck
                    ? track.volume * Utils.dbToGain(this.duckingSettings.level)
                    : track.volume;

                const transitionTime = shouldDuck
                    ? this.duckingSettings.attack / 1000
                    : this.duckingSettings.release / 1000;

                track.gain.gain.setTargetAtTime(
                    targetGain,
                    this.audioContext.currentTime,
                    transitionTime / 3 // Time constant
                );
            }
        }
    }

    /**
     * Set ducking settings
     */
    setDuckingSettings(settings) {
        this.duckingSettings = { ...this.duckingSettings, ...settings };
        this.emit('duckingSettingsChanged', this.duckingSettings);
    }

    /**
     * Start recording
     */
    async startRecording() {
        try {
            this.recordingStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            this.mediaRecorder = new MediaRecorder(this.recordingStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.recordedChunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

                this.emit('recordingComplete', {
                    buffer: audioBuffer,
                    blob
                });
            };

            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            this.emit('recordingStart');

        } catch (error) {
            console.error('Failed to start recording:', error);
            Utils.showToast('Failed to access microphone', 'error');
        }
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            if (this.recordingStream) {
                this.recordingStream.getTracks().forEach(track => track.stop());
                this.recordingStream = null;
            }

            this.emit('recordingStop');
        }
    }

    /**
     * Get available audio devices
     */
    async getAudioDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();

            return {
                inputs: devices.filter(d => d.kind === 'audioinput'),
                outputs: devices.filter(d => d.kind === 'audiooutput')
            };
        } catch (error) {
            console.error('Failed to get audio devices:', error);
            return { inputs: [], outputs: [] };
        }
    }

    /**
     * Export audio mix
     */
    async exportMix(options = {}) {
        const {
            format = 'wav',
            sampleRate = 48000,
            startTime = 0,
            endTime = this.duration
        } = options;

        const duration = endTime - startTime;
        const offlineContext = new OfflineAudioContext(
            2, // Stereo
            Math.ceil(duration * sampleRate),
            sampleRate
        );

        // Create master gain for offline context
        const masterGain = offlineContext.createGain();
        masterGain.connect(offlineContext.destination);

        // Schedule all tracks
        for (const track of this.tracks.values()) {
            if (track.audioBuffer && !track.muted) {
                const source = offlineContext.createBufferSource();
                source.buffer = track.audioBuffer;

                const gain = offlineContext.createGain();
                gain.gain.value = track.volume;

                source.connect(gain);
                gain.connect(masterGain);

                const trackOffset = Math.max(0, startTime);
                const trackDuration = Math.min(track.audioBuffer.duration - trackOffset, duration);

                if (trackDuration > 0) {
                    source.start(0, trackOffset, trackDuration);
                }
            }
        }

        // Render
        const renderedBuffer = await offlineContext.startRendering();

        // Convert to WAV
        const wavBlob = this.audioBufferToWav(renderedBuffer);

        return wavBlob;
    }

    /**
     * Convert AudioBuffer to WAV Blob
     */
    audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const dataLength = buffer.length * blockAlign;
        const bufferLength = 44 + dataLength;

        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        // Write WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, bufferLength - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // Format chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // Write audio data
        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, channels[channel][i]));
                const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Update total duration
     */
    updateDuration() {
        let maxDuration = 0;

        for (const track of this.tracks.values()) {
            if (track.audioBuffer) {
                maxDuration = Math.max(maxDuration, track.audioBuffer.duration);
            }
            for (const clip of track.clips) {
                maxDuration = Math.max(maxDuration, clip.endTime);
            }
        }

        this.duration = maxDuration;
        this.emit('durationChange', this.duration);
    }

    /**
     * Get analyser data for visualization
     */
    getAnalyserData() {
        if (!this.analyser) return null;

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    /**
     * Destroy audio engine
     */
    destroy() {
        this.stop();

        if (this.audioContext) {
            this.audioContext.close();
        }

        if (this.recordingStream) {
            this.recordingStream.getTracks().forEach(track => track.stop());
        }
    }
}

// Make AudioEngine globally available
window.AudioEngine = AudioEngine;
