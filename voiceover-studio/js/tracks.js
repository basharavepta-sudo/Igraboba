/**
 * VoiceOver Studio - Tracks Panel
 * Manages track list UI and track operations
 */

class TracksPanel extends Utils.EventEmitter {
    constructor(audioEngine, timeline) {
        super();

        this.audioEngine = audioEngine;
        this.timeline = timeline;
        this.tracksList = document.getElementById('tracks-list');
        this.addTrackBtn = document.getElementById('btn-add-track');

        this.tracks = [];
        this.selectedTrackId = null;

        this.init();
    }

    init() {
        // Add track button
        this.addTrackBtn.addEventListener('click', () => {
            this.createTrack({ type: 'subtitles', name: 'New Track' });
        });

        // Create default tracks
        this.createDefaultTracks();
    }

    /**
     * Create default tracks
     */
    createDefaultTracks() {
        // Audio track for background music/original audio
        this.createTrack({
            type: 'audio',
            name: 'Audio',
            color: '#3b82f6'
        });

        // Subtitles track
        this.createTrack({
            type: 'subtitles',
            name: 'Subtitles',
            color: '#22c55e'
        });
    }

    /**
     * Create new track
     */
    createTrack(options = {}) {
        const trackId = Utils.generateId();
        const usedColors = this.tracks.map(t => t.color);

        const track = {
            id: trackId,
            type: options.type || 'subtitles',
            name: options.name || `Track ${this.tracks.length + 1}`,
            color: options.color || Utils.getNextTrackColor(usedColors),
            volume: 1,
            muted: false,
            solo: false,
            audioBuffer: null,
            clips: []
        };

        this.tracks.push(track);

        // Add to audio engine
        this.audioEngine.addTrack(trackId, {
            name: track.name,
            type: track.type,
            color: track.color,
            volume: track.volume
        });

        // Add to timeline
        this.timeline.addTrack(track);

        // Render track UI
        this.renderTrack(track);

        this.emit('trackCreated', track);

        return track;
    }

    /**
     * Remove track
     */
    removeTrack(trackId) {
        const index = this.tracks.findIndex(t => t.id === trackId);
        if (index !== -1) {
            const track = this.tracks[index];
            this.tracks.splice(index, 1);

            // Remove from audio engine
            this.audioEngine.removeTrack(trackId);

            // Remove from timeline
            this.timeline.removeTrack(trackId);

            // Remove UI
            const trackEl = this.tracksList.querySelector(`[data-track-id="${trackId}"]`);
            if (trackEl) {
                trackEl.remove();
            }

            this.emit('trackRemoved', track);
        }
    }

    /**
     * Get track by ID
     */
    getTrack(trackId) {
        return this.tracks.find(t => t.id === trackId);
    }

    /**
     * Get track by type
     */
    getTrackByType(type) {
        return this.tracks.find(t => t.type === type);
    }

    /**
     * Select track
     */
    selectTrack(trackId) {
        this.selectedTrackId = trackId;

        // Update UI
        this.tracksList.querySelectorAll('.track-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.trackId === trackId);
        });

        this.emit('trackSelected', this.getTrack(trackId));
    }

    /**
     * Render track UI element
     */
    renderTrack(track) {
        const trackEl = document.createElement('div');
        trackEl.className = 'track-item';
        trackEl.dataset.trackId = track.id;

        trackEl.innerHTML = `
            <div class="track-name">
                <div class="track-color" style="background-color: ${track.color}"></div>
                <input type="text" value="${track.name}" title="Track name">
            </div>
            <div class="track-controls">
                <button class="track-btn mute" title="Mute (M)">M</button>
                <button class="track-btn solo" title="Solo (S)">S</button>
                <input type="range" class="track-volume" min="0" max="100" value="${track.volume * 100}" title="Volume">
                <button class="track-btn delete" title="Delete track">×</button>
            </div>
        `;

        // Name input
        const nameInput = trackEl.querySelector('input[type="text"]');
        nameInput.addEventListener('change', () => {
            track.name = nameInput.value;
            this.emit('trackRenamed', track);
        });

        // Mute button
        const muteBtn = trackEl.querySelector('.mute');
        muteBtn.addEventListener('click', () => {
            track.muted = !track.muted;
            muteBtn.classList.toggle('active', track.muted);
            this.audioEngine.setTrackMute(track.id, track.muted);
            this.emit('trackMuteChanged', track);
        });

        // Solo button
        const soloBtn = trackEl.querySelector('.solo');
        soloBtn.addEventListener('click', () => {
            track.solo = !track.solo;
            soloBtn.classList.toggle('active', track.solo);
            this.audioEngine.setTrackSolo(track.id, track.solo);
            this.emit('trackSoloChanged', track);
        });

        // Volume slider
        const volumeSlider = trackEl.querySelector('.track-volume');
        volumeSlider.addEventListener('input', () => {
            track.volume = volumeSlider.value / 100;
            this.audioEngine.setTrackVolume(track.id, track.volume);
        });

        // Delete button
        const deleteBtn = trackEl.querySelector('.delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete track "${track.name}"?`)) {
                this.removeTrack(track.id);
            }
        });

        // Click to select
        trackEl.addEventListener('click', () => {
            this.selectTrack(track.id);
        });

        this.tracksList.appendChild(trackEl);
    }

    /**
     * Set audio buffer for track
     */
    setTrackAudio(trackId, audioBuffer, fileName) {
        const track = this.getTrack(trackId);
        if (track) {
            track.audioBuffer = audioBuffer;
            track.fileName = fileName;

            // Update audio engine
            const audioTrack = this.audioEngine.getTrack(trackId);
            if (audioTrack) {
                audioTrack.audioBuffer = audioBuffer;
            }

            // Update duration
            this.audioEngine.updateDuration();
            this.timeline.setDuration(this.audioEngine.duration);

            // Refresh timeline
            this.timeline.renderTrack(track);

            this.emit('trackAudioSet', track);
        }
    }

    /**
     * Set subtitles for track
     */
    setTrackSubtitles(trackId, subtitles) {
        const track = this.getTrack(trackId);
        if (track) {
            // Assign track color to subtitles
            subtitles.forEach(sub => {
                sub.color = track.color;
            });

            track.clips = subtitles;

            // Update audio engine clips
            const audioTrack = this.audioEngine.getTrack(trackId);
            if (audioTrack) {
                audioTrack.clips = subtitles;
            }

            // Update duration
            this.audioEngine.updateDuration();
            this.timeline.setDuration(this.audioEngine.duration);

            // Refresh timeline
            this.timeline.renderTrack(track);

            this.emit('trackSubtitlesSet', track);
        }
    }

    /**
     * Add subtitle to track
     */
    addSubtitle(trackId, subtitle) {
        const track = this.getTrack(trackId);
        if (track) {
            subtitle.color = track.color;
            track.clips.push(subtitle);
            track.clips.sort((a, b) => a.startTime - b.startTime);

            // Update audio engine
            const audioTrack = this.audioEngine.getTrack(trackId);
            if (audioTrack) {
                audioTrack.clips = track.clips;
            }

            // Refresh timeline
            this.timeline.renderTrack(track);

            this.emit('subtitleAdded', { track, subtitle });
        }
    }

    /**
     * Remove subtitle from track
     */
    removeSubtitle(trackId, subtitleId) {
        const track = this.getTrack(trackId);
        if (track) {
            const index = track.clips.findIndex(c => c.id === subtitleId);
            if (index !== -1) {
                const subtitle = track.clips[index];
                track.clips.splice(index, 1);

                // Update audio engine
                const audioTrack = this.audioEngine.getTrack(trackId);
                if (audioTrack) {
                    audioTrack.clips = track.clips;
                }

                // Refresh timeline
                this.timeline.renderTrack(track);

                this.emit('subtitleRemoved', { track, subtitle });
            }
        }
    }

    /**
     * Update subtitle in track
     */
    updateSubtitle(trackId, subtitleId, updates) {
        const track = this.getTrack(trackId);
        if (track) {
            const subtitle = track.clips.find(c => c.id === subtitleId);
            if (subtitle) {
                Object.assign(subtitle, updates);

                // Re-sort if timing changed
                if (updates.startTime !== undefined || updates.endTime !== undefined) {
                    track.clips.sort((a, b) => a.startTime - b.startTime);
                }

                // Refresh timeline
                this.timeline.renderTrack(track);

                this.emit('subtitleUpdated', { track, subtitle });
            }
        }
    }

    /**
     * Get all subtitles from all tracks
     */
    getAllSubtitles() {
        const allSubtitles = [];

        for (const track of this.tracks) {
            if (track.type === 'subtitles' && track.clips) {
                allSubtitles.push(...track.clips);
            }
        }

        return allSubtitles.sort((a, b) => a.startTime - b.startTime);
    }

    /**
     * Get subtitle by ID
     */
    getSubtitle(subtitleId) {
        for (const track of this.tracks) {
            if (track.clips) {
                const subtitle = track.clips.find(c => c.id === subtitleId);
                if (subtitle) {
                    return { track, subtitle };
                }
            }
        }
        return null;
    }

    /**
     * Refresh all track UIs
     */
    refreshAll() {
        this.tracksList.innerHTML = '';
        this.tracks.forEach(track => this.renderTrack(track));
        this.timeline.refresh();
    }

    /**
     * Get tracks data for export
     */
    getTracksData() {
        return this.tracks.map(track => ({
            id: track.id,
            type: track.type,
            name: track.name,
            color: track.color,
            volume: track.volume,
            muted: track.muted,
            solo: track.solo,
            clips: track.clips
        }));
    }
}

// Make TracksPanel globally available
window.TracksPanel = TracksPanel;
