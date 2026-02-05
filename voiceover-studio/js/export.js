/**
 * VoiceOver Studio - Export Module
 * Handles exporting audio, markers, and subtitles
 */

class ExportManager extends Utils.EventEmitter {
    constructor(audioEngine, tracksPanel, markersManager) {
        super();

        this.audioEngine = audioEngine;
        this.tracksPanel = tracksPanel;
        this.markersManager = markersManager;

        this.modal = document.getElementById('export-modal');
        this.closeBtn = document.getElementById('close-export');
        this.cancelBtn = document.getElementById('btn-cancel-export');
        this.exportBtn = document.getElementById('btn-do-export');

        // Options elements
        this.exportAudioCheckbox = document.getElementById('export-audio');
        this.formatSelect = document.getElementById('export-format');
        this.exportMixCheckbox = document.getElementById('export-mix');
        this.exportSeparateCheckbox = document.getElementById('export-separate');
        this.exportMarkersCheckbox = document.getElementById('export-markers');
        this.markersFormatSelect = document.getElementById('markers-format');
        this.exportSrtCheckbox = document.getElementById('export-srt');

        this.init();
    }

    init() {
        // Close modal
        this.closeBtn.addEventListener('click', () => this.hide());
        this.cancelBtn.addEventListener('click', () => this.hide());

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Export button
        this.exportBtn.addEventListener('click', () => this.performExport());
    }

    /**
     * Show export modal
     */
    show() {
        this.modal.classList.add('active');

        // Update checkbox states based on available content
        this.exportAudioCheckbox.disabled = !this.hasAudio();
        this.exportMarkersCheckbox.disabled = this.markersManager.count === 0;
        this.exportSrtCheckbox.disabled = !this.hasSubtitles();
    }

    /**
     * Hide export modal
     */
    hide() {
        this.modal.classList.remove('active');
    }

    /**
     * Check if there's audio to export
     */
    hasAudio() {
        return this.tracksPanel.tracks.some(t => t.audioBuffer);
    }

    /**
     * Check if there are subtitles to export
     */
    hasSubtitles() {
        return this.tracksPanel.tracks.some(t => t.clips && t.clips.length > 0);
    }

    /**
     * Perform export based on selected options
     */
    async performExport() {
        const exportTasks = [];

        // Show loading state
        this.exportBtn.disabled = true;
        this.exportBtn.textContent = 'Exporting...';

        try {
            // Export audio
            if (this.exportAudioCheckbox.checked && !this.exportAudioCheckbox.disabled) {
                if (this.exportMixCheckbox.checked) {
                    exportTasks.push(this.exportAudioMix());
                }
                if (this.exportSeparateCheckbox.checked) {
                    exportTasks.push(this.exportSeparateTracks());
                }
            }

            // Export markers
            if (this.exportMarkersCheckbox.checked && !this.exportMarkersCheckbox.disabled) {
                exportTasks.push(this.exportMarkers());
            }

            // Export SRT
            if (this.exportSrtCheckbox.checked && !this.exportSrtCheckbox.disabled) {
                exportTasks.push(this.exportSRT());
            }

            await Promise.all(exportTasks);

            Utils.showToast('Export completed!', 'success');
            this.hide();

        } catch (error) {
            console.error('Export failed:', error);
            Utils.showToast('Export failed: ' + error.message, 'error');
        } finally {
            this.exportBtn.disabled = false;
            this.exportBtn.textContent = 'Export';
        }
    }

    /**
     * Export audio mix
     */
    async exportAudioMix() {
        const format = this.formatSelect.value;

        Utils.showToast('Rendering audio mix...', 'info');

        const blob = await this.audioEngine.exportMix({
            format,
            startTime: 0,
            endTime: this.audioEngine.duration
        });

        const filename = `voiceover-mix-${this.getTimestamp()}.${format}`;
        Utils.downloadBlob(blob, filename);

        this.emit('audioExported', { filename, format });
    }

    /**
     * Export separate tracks
     */
    async exportSeparateTracks() {
        const format = this.formatSelect.value;

        for (const track of this.tracksPanel.tracks) {
            if (track.audioBuffer) {
                Utils.showToast(`Exporting ${track.name}...`, 'info');

                // Create offline context for this track
                const duration = track.audioBuffer.duration;
                const sampleRate = track.audioBuffer.sampleRate;
                const offlineContext = new OfflineAudioContext(
                    track.audioBuffer.numberOfChannels,
                    Math.ceil(duration * sampleRate),
                    sampleRate
                );

                const source = offlineContext.createBufferSource();
                source.buffer = track.audioBuffer;
                source.connect(offlineContext.destination);
                source.start(0);

                const renderedBuffer = await offlineContext.startRendering();
                const blob = this.audioEngine.audioBufferToWav(renderedBuffer);

                const safeName = track.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const filename = `${safeName}-${this.getTimestamp()}.${format}`;
                Utils.downloadBlob(blob, filename);
            }
        }
    }

    /**
     * Export markers
     */
    async exportMarkers() {
        const format = this.markersFormatSelect.value;
        const content = this.markersManager.export(format);

        let mimeType;
        switch (format) {
            case 'json':
                mimeType = 'application/json';
                break;
            case 'csv':
                mimeType = 'text/csv';
                break;
            default:
                mimeType = 'text/plain';
        }

        const filename = `markers-${this.getTimestamp()}.${format}`;
        Utils.downloadFile(content, filename, mimeType);

        this.emit('markersExported', { filename, format });
    }

    /**
     * Export subtitles as SRT
     */
    async exportSRT() {
        const subtitles = this.tracksPanel.getAllSubtitles();

        if (subtitles.length === 0) {
            throw new Error('No subtitles to export');
        }

        const srtContent = SRTParser.generate(subtitles);
        const filename = `subtitles-${this.getTimestamp()}.srt`;

        Utils.downloadFile(srtContent, filename, 'text/plain');

        this.emit('srtExported', { filename, count: subtitles.length });
    }

    /**
     * Quick export - audio mix only
     */
    async quickExportAudio() {
        if (!this.hasAudio()) {
            Utils.showToast('No audio to export', 'warning');
            return;
        }

        try {
            await this.exportAudioMix();
            Utils.showToast('Audio exported!', 'success');
        } catch (error) {
            Utils.showToast('Export failed', 'error');
        }
    }

    /**
     * Quick export - SRT only
     */
    async quickExportSRT() {
        if (!this.hasSubtitles()) {
            Utils.showToast('No subtitles to export', 'warning');
            return;
        }

        try {
            await this.exportSRT();
            Utils.showToast('SRT exported!', 'success');
        } catch (error) {
            Utils.showToast('Export failed', 'error');
        }
    }

    /**
     * Get timestamp for filenames
     */
    getTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * Export project data (for save/load functionality)
     */
    exportProjectData() {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tracks: this.tracksPanel.getTracksData(),
            markers: this.markersManager.getAll(),
            duration: this.audioEngine.duration,
            settings: {
                ducking: this.audioEngine.duckingSettings
            }
        };
    }

    /**
     * Download project as JSON
     */
    downloadProject() {
        const projectData = this.exportProjectData();
        const content = JSON.stringify(projectData, null, 2);
        const filename = `voiceover-project-${this.getTimestamp()}.json`;

        Utils.downloadFile(content, filename, 'application/json');
        Utils.showToast('Project saved!', 'success');
    }
}

// Make ExportManager globally available
window.ExportManager = ExportManager;
