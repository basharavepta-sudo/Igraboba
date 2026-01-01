/**
 * VoiceOver Studio - Main Application
 * Initializes and coordinates all modules
 */

class VoiceOverStudio {
    constructor() {
        // Core modules
        this.audioEngine = null;
        this.timeline = null;
        this.tracksPanel = null;
        this.markersManager = null;
        this.exportManager = null;
        this.settingsManager = null;

        // UI Elements
        this.elements = {
            // Toolbar buttons
            btnImportAudio: document.getElementById('btn-import-audio'),
            btnImportSrt: document.getElementById('btn-import-srt'),
            btnAddMarker: document.getElementById('btn-add-marker'),
            btnSettings: document.getElementById('btn-settings'),
            btnExport: document.getElementById('btn-export'),

            // Transport
            btnPlay: document.getElementById('btn-play'),
            btnStop: document.getElementById('btn-stop'),
            btnRecord: document.getElementById('btn-record'),
            btnPrevSubtitle: document.getElementById('btn-prev-subtitle'),
            btnNextSubtitle: document.getElementById('btn-next-subtitle'),

            // Time display
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time'),

            // File inputs
            audioInput: document.getElementById('audio-input'),
            srtInput: document.getElementById('srt-input'),

            // Zoom
            zoomSlider: document.getElementById('zoom-slider'),
            zoomIn: document.getElementById('btn-zoom-in'),
            zoomOut: document.getElementById('btn-zoom-out'),
            zoomValue: document.getElementById('zoom-value'),

            // Subtitle editor
            subtitleText: document.getElementById('subtitle-text'),
            subtitleStart: document.getElementById('subtitle-start'),
            subtitleEnd: document.getElementById('subtitle-end'),
            subtitleDuration: document.getElementById('subtitle-duration'),
            btnPrevSub: document.getElementById('btn-prev-sub'),
            btnPlaySub: document.getElementById('btn-play-sub'),
            btnNextSub: document.getElementById('btn-next-sub'),

            // Preview
            previewText: document.getElementById('preview-text'),
            previewCounter: document.getElementById('preview-counter')
        };

        // State
        this.selectedSubtitle = null;
        this.isPlaying = false;

        this.init();
    }

    async init() {
        console.log('VoiceOver Studio initializing...');

        // Initialize core modules
        this.audioEngine = new AudioEngine();
        this.timeline = new Timeline(document.querySelector('.timeline-container'));
        this.tracksPanel = new TracksPanel(this.audioEngine, this.timeline);
        this.markersManager = new MarkersManager(this.timeline);
        this.settingsManager = new SettingsManager(this.audioEngine, this.timeline);
        this.exportManager = new ExportManager(this.audioEngine, this.tracksPanel, this.markersManager);

        // Setup event listeners
        this.setupToolbarEvents();
        this.setupTransportEvents();
        this.setupZoomEvents();
        this.setupEditorEvents();
        this.setupKeyboardShortcuts();
        this.setupModuleEvents();

        // Initial render
        this.timeline.render();

        console.log('VoiceOver Studio ready!');
    }

    /**
     * Setup toolbar button events
     */
    setupToolbarEvents() {
        // Import audio
        this.elements.btnImportAudio.addEventListener('click', () => {
            this.elements.audioInput.click();
        });

        this.elements.audioInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importAudio(e.target.files[0]);
                e.target.value = '';
            }
        });

        // Import SRT
        this.elements.btnImportSrt.addEventListener('click', () => {
            this.elements.srtInput.click();
        });

        this.elements.srtInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importSRT(e.target.files[0]);
                e.target.value = '';
            }
        });

        // Add marker
        this.elements.btnAddMarker.addEventListener('click', () => {
            this.addMarkerAtCurrentTime();
        });

        // Settings
        this.elements.btnSettings.addEventListener('click', () => {
            this.settingsManager.show();
        });

        // Export
        this.elements.btnExport.addEventListener('click', () => {
            this.exportManager.show();
        });
    }

    /**
     * Setup transport control events
     */
    setupTransportEvents() {
        // Play/Pause
        this.elements.btnPlay.addEventListener('click', () => {
            this.togglePlayback();
        });

        // Stop
        this.elements.btnStop.addEventListener('click', () => {
            this.stop();
        });

        // Record
        this.elements.btnRecord.addEventListener('click', () => {
            this.toggleRecording();
        });

        // Previous subtitle
        this.elements.btnPrevSubtitle.addEventListener('click', () => {
            this.timeline.goToPreviousSubtitle();
        });

        // Next subtitle
        this.elements.btnNextSubtitle.addEventListener('click', () => {
            this.timeline.goToNextSubtitle();
        });
    }

    /**
     * Setup zoom controls
     */
    setupZoomEvents() {
        this.elements.zoomSlider.addEventListener('input', () => {
            this.setZoom(parseInt(this.elements.zoomSlider.value));
        });

        this.elements.zoomIn.addEventListener('click', () => {
            this.setZoom(this.timeline.zoom * 1.2);
        });

        this.elements.zoomOut.addEventListener('click', () => {
            this.setZoom(this.timeline.zoom / 1.2);
        });
    }

    /**
     * Setup subtitle editor events
     */
    setupEditorEvents() {
        // Text editing
        this.elements.subtitleText.addEventListener('input', Utils.debounce(() => {
            if (this.selectedSubtitle) {
                this.updateSelectedSubtitle({ text: this.elements.subtitleText.value });
            }
        }, 300));

        // Start time editing
        this.elements.subtitleStart.addEventListener('change', () => {
            if (this.selectedSubtitle) {
                const time = Utils.parseTimeInput(this.elements.subtitleStart.value);
                if (time !== null) {
                    this.updateSelectedSubtitle({ startTime: time });
                }
            }
        });

        // End time editing
        this.elements.subtitleEnd.addEventListener('change', () => {
            if (this.selectedSubtitle) {
                const time = Utils.parseTimeInput(this.elements.subtitleEnd.value);
                if (time !== null) {
                    this.updateSelectedSubtitle({ endTime: time });
                }
            }
        });

        // Editor navigation buttons
        this.elements.btnPrevSub.addEventListener('click', () => {
            this.timeline.goToPreviousSubtitle();
        });

        this.elements.btnPlaySub.addEventListener('click', () => {
            this.playSelectedSubtitle();
        });

        this.elements.btnNextSub.addEventListener('click', () => {
            this.timeline.goToNextSubtitle();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.matches('input, textarea, select')) {
                // Allow Escape to blur inputs
                if (e.key === 'Escape') {
                    e.target.blur();
                }
                return;
            }

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlayback();
                    break;

                case 'Escape':
                    this.stop();
                    break;

                case 'r':
                case 'R':
                    if (!e.ctrlKey && !e.metaKey) {
                        this.toggleRecording();
                    }
                    break;

                case 'm':
                case 'M':
                    this.addMarkerAtCurrentTime();
                    break;

                case ',':
                case '<':
                    this.timeline.goToPreviousSubtitle();
                    break;

                case '.':
                case '>':
                    this.timeline.goToNextSubtitle();
                    break;

                case 'Home':
                    this.seek(0);
                    break;

                case 'End':
                    this.seek(this.audioEngine.duration);
                    break;

                case '+':
                case '=':
                    this.setZoom(this.timeline.zoom * 1.2);
                    break;

                case '-':
                    this.setZoom(this.timeline.zoom / 1.2);
                    break;

                case 'Enter':
                    if (this.selectedSubtitle) {
                        this.playSelectedSubtitle();
                    }
                    break;

                case 'o':
                case 'O':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.elements.audioInput.click();
                    }
                    break;

                case 'i':
                case 'I':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.elements.srtInput.click();
                    }
                    break;

                case 'e':
                case 'E':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.exportManager.show();
                    }
                    break;

                case 's':
                case 'S':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.exportManager.downloadProject();
                    }
                    break;
            }
        });
    }

    /**
     * Setup module event listeners
     */
    setupModuleEvents() {
        // Audio engine events
        this.audioEngine.on('timeUpdate', (time) => {
            this.updateTimeDisplay(time);
            this.timeline.setCurrentTime(time);
        });

        this.audioEngine.on('play', () => {
            this.isPlaying = true;
            this.elements.btnPlay.classList.add('playing');
        });

        this.audioEngine.on('pause', () => {
            this.isPlaying = false;
            this.elements.btnPlay.classList.remove('playing');
        });

        this.audioEngine.on('stop', () => {
            this.isPlaying = false;
            this.elements.btnPlay.classList.remove('playing');
        });

        this.audioEngine.on('durationChange', (duration) => {
            this.elements.totalTime.textContent = Utils.formatTime(duration);
            this.timeline.setDuration(duration);
        });

        this.audioEngine.on('recordingStart', () => {
            this.elements.btnRecord.classList.add('recording');
        });

        this.audioEngine.on('recordingStop', () => {
            this.elements.btnRecord.classList.remove('recording');
        });

        // Timeline events
        this.timeline.on('seek', (time) => {
            this.seek(time);
        });

        this.timeline.on('zoomChange', (zoom) => {
            this.elements.zoomSlider.value = zoom;
            this.elements.zoomValue.textContent = Math.round(zoom) + '%';
        });

        this.timeline.on('clipSelected', ({ track, clip }) => {
            this.selectSubtitle(track, clip);
        });

        this.timeline.on('clipDeselected', () => {
            this.deselectSubtitle();
        });

        this.timeline.on('clipChanged', ({ track, clip }) => {
            if (this.selectedSubtitle && this.selectedSubtitle.id === clip.id) {
                this.updateEditorFromSubtitle(clip);
            }
        });

        this.timeline.on('currentSubtitle', (subtitle) => {
            this.updatePreview(subtitle);
        });

        this.timeline.on('deleteClip', ({ track, clip }) => {
            this.deleteSubtitle(track.id, clip.id);
        });

        // Markers events
        this.markersManager.on('seek', (time) => {
            this.seek(time);
        });

        // Tracks panel events
        this.tracksPanel.on('trackAudioSet', () => {
            this.timeline.refresh();
        });

        this.tracksPanel.on('trackSubtitlesSet', () => {
            this.timeline.refresh();
        });
    }

    /**
     * Import audio file
     */
    async importAudio(file) {
        try {
            Utils.showToast(`Loading ${file.name}...`, 'info');

            const result = await this.audioEngine.loadAudioFile(file);

            // Find audio track or create one
            let audioTrack = this.tracksPanel.getTrackByType('audio');
            if (!audioTrack) {
                audioTrack = this.tracksPanel.createTrack({
                    type: 'audio',
                    name: file.name
                });
            }

            this.tracksPanel.setTrackAudio(audioTrack.id, result.buffer, file.name);

            Utils.showToast(`Audio loaded: ${Utils.formatTime(result.duration)}`, 'success');

        } catch (error) {
            console.error('Failed to import audio:', error);
            Utils.showToast('Failed to load audio file', 'error');
        }
    }

    /**
     * Import SRT file
     */
    async importSRT(file) {
        try {
            Utils.showToast(`Loading ${file.name}...`, 'info');

            const content = await file.text();
            const subtitles = SRTParser.parse(content);

            if (subtitles.length === 0) {
                Utils.showToast('No subtitles found in file', 'warning');
                return;
            }

            // Find subtitles track or create one
            let subtitlesTrack = this.tracksPanel.getTrackByType('subtitles');
            if (!subtitlesTrack) {
                subtitlesTrack = this.tracksPanel.createTrack({
                    type: 'subtitles',
                    name: 'Subtitles'
                });
            }

            this.tracksPanel.setTrackSubtitles(subtitlesTrack.id, subtitles);

            // Update duration if longer than current
            const stats = SRTParser.getStats(subtitles);
            const lastSubtitle = subtitles[subtitles.length - 1];
            if (lastSubtitle.endTime > this.audioEngine.duration) {
                this.audioEngine.duration = lastSubtitle.endTime + 5;
                this.timeline.setDuration(this.audioEngine.duration);
            }

            Utils.showToast(`Loaded ${subtitles.length} subtitles`, 'success');
            this.updatePreview(null);

        } catch (error) {
            console.error('Failed to import SRT:', error);
            Utils.showToast('Failed to load SRT file', 'error');
        }
    }

    /**
     * Toggle playback
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.audioEngine.pause();
        } else {
            this.audioEngine.play();
        }
    }

    /**
     * Stop playback
     */
    stop() {
        this.audioEngine.stop();
        this.updateTimeDisplay(0);
    }

    /**
     * Seek to time
     */
    seek(time) {
        this.audioEngine.seek(time);
        this.updateTimeDisplay(time);
    }

    /**
     * Toggle recording
     */
    toggleRecording() {
        if (this.audioEngine.isRecording) {
            this.audioEngine.stopRecording();
        } else {
            this.audioEngine.startRecording();
        }
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        this.timeline.setZoom(zoom);
        this.elements.zoomSlider.value = this.timeline.zoom;
        this.elements.zoomValue.textContent = Math.round(this.timeline.zoom) + '%';
        this.markersManager.refreshAll();
    }

    /**
     * Add marker at current playback time
     */
    addMarkerAtCurrentTime() {
        const time = this.audioEngine.getCurrentTime();
        this.markersManager.addMarker(time);
        Utils.showToast('Marker added', 'success');
    }

    /**
     * Update time display
     */
    updateTimeDisplay(time) {
        this.elements.currentTime.textContent = Utils.formatTime(time);
    }

    /**
     * Select subtitle
     */
    selectSubtitle(track, subtitle) {
        this.selectedSubtitle = subtitle;
        this.selectedSubtitleTrack = track;

        this.updateEditorFromSubtitle(subtitle);

        // Enable editor inputs
        this.elements.subtitleText.disabled = false;
        this.elements.subtitleStart.disabled = false;
        this.elements.subtitleEnd.disabled = false;
    }

    /**
     * Deselect subtitle
     */
    deselectSubtitle() {
        this.selectedSubtitle = null;
        this.selectedSubtitleTrack = null;

        this.elements.subtitleText.value = '';
        this.elements.subtitleStart.value = '';
        this.elements.subtitleEnd.value = '';
        this.elements.subtitleDuration.textContent = '-';

        // Disable editor inputs
        this.elements.subtitleText.disabled = true;
        this.elements.subtitleStart.disabled = true;
        this.elements.subtitleEnd.disabled = true;
    }

    /**
     * Update editor from subtitle data
     */
    updateEditorFromSubtitle(subtitle) {
        this.elements.subtitleText.value = subtitle.text;
        this.elements.subtitleStart.value = Utils.toSrtTime(subtitle.startTime);
        this.elements.subtitleEnd.value = Utils.toSrtTime(subtitle.endTime);

        const duration = subtitle.endTime - subtitle.startTime;
        this.elements.subtitleDuration.textContent = duration.toFixed(2) + 's';
    }

    /**
     * Update selected subtitle
     */
    updateSelectedSubtitle(updates) {
        if (this.selectedSubtitle && this.selectedSubtitleTrack) {
            this.tracksPanel.updateSubtitle(
                this.selectedSubtitleTrack.id,
                this.selectedSubtitle.id,
                updates
            );

            // Update editor if timing changed
            if (updates.startTime !== undefined || updates.endTime !== undefined) {
                const duration = this.selectedSubtitle.endTime - this.selectedSubtitle.startTime;
                this.elements.subtitleDuration.textContent = duration.toFixed(2) + 's';
            }
        }
    }

    /**
     * Delete subtitle
     */
    deleteSubtitle(trackId, subtitleId) {
        this.tracksPanel.removeSubtitle(trackId, subtitleId);

        if (this.selectedSubtitle && this.selectedSubtitle.id === subtitleId) {
            this.deselectSubtitle();
        }

        Utils.showToast('Subtitle deleted', 'info');
    }

    /**
     * Play selected subtitle
     */
    playSelectedSubtitle() {
        if (this.selectedSubtitle) {
            this.seek(this.selectedSubtitle.startTime);
            this.audioEngine.play();
        }
    }

    /**
     * Update subtitle preview display
     */
    updatePreview(subtitle) {
        if (subtitle) {
            this.elements.previewText.textContent = subtitle.text;

            // Find subtitle index
            const allSubtitles = this.tracksPanel.getAllSubtitles();
            const index = allSubtitles.findIndex(s => s.id === subtitle.id);
            this.elements.previewCounter.textContent = `${index + 1} / ${allSubtitles.length}`;
        } else {
            const allSubtitles = this.tracksPanel.getAllSubtitles();
            if (allSubtitles.length > 0) {
                this.elements.previewText.textContent = '';
                this.elements.previewCounter.textContent = `0 / ${allSubtitles.length}`;
            } else {
                this.elements.previewText.textContent = 'Load SRT file to start';
                this.elements.previewCounter.textContent = '';
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VoiceOverStudio();
});

// Handle visibility change to pause audio when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.app && window.app.isPlaying) {
        window.app.audioEngine.pause();
    }
});

// Prevent accidental page close with unsaved work
window.addEventListener('beforeunload', (e) => {
    if (window.app && window.app.tracksPanel.tracks.some(t => t.clips && t.clips.length > 0)) {
        e.preventDefault();
        e.returnValue = '';
    }
});
