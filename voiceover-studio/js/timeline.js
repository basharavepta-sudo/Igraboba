/**
 * VoiceOver Studio - Timeline
 * Handles timeline rendering, navigation, and clip manipulation
 */

class Timeline extends Utils.EventEmitter {
    constructor(container, options = {}) {
        super();

        this.container = container;
        this.rulerCanvas = document.getElementById('ruler-canvas');
        this.rulerCtx = this.rulerCanvas.getContext('2d');
        this.tracksContainer = document.getElementById('timeline-tracks');
        this.playhead = document.getElementById('playhead');
        this.markersLane = document.getElementById('markers-lane');

        // State
        this.duration = options.duration || 300; // 5 minutes default
        this.zoom = 100; // pixels per second
        this.scrollX = 0;
        this.currentTime = 0;
        this.tracks = [];
        this.selectedClip = null;
        this.selectedSubtitleId = null;

        // Drag state
        this.isDragging = false;
        this.dragType = null; // 'clip', 'handle-left', 'handle-right', 'playhead', 'scrub'
        this.dragStartX = 0;
        this.dragStartTime = 0;
        this.dragClip = null;

        // Settings
        this.settings = {
            snapToGrid: true,
            gridSize: 0.5, // seconds
            trackHeight: 80,
            showWaveform: true
        };

        // Initialize
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.render();

        // Handle resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.setupCanvas();
            this.render();
        }, 100));
    }

    setupCanvas() {
        const rect = this.rulerCanvas.parentElement.getBoundingClientRect();
        this.rulerCanvas.width = rect.width * window.devicePixelRatio;
        this.rulerCanvas.height = rect.height * window.devicePixelRatio;
        this.rulerCanvas.style.width = rect.width + 'px';
        this.rulerCanvas.style.height = rect.height + 'px';
        this.rulerCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    setupEventListeners() {
        // Ruler click for seeking
        this.rulerCanvas.addEventListener('mousedown', (e) => this.handleRulerMouseDown(e));
        this.rulerCanvas.addEventListener('touchstart', (e) => this.handleRulerTouchStart(e));

        // Tracks container click for seeking (anywhere on timeline)
        this.tracksContainer.addEventListener('mousedown', (e) => this.handleTracksMouseDown(e));
        this.tracksContainer.addEventListener('touchstart', (e) => this.handleTracksTouchStart(e));

        // Tracks container for scrolling and clip interaction
        this.tracksContainer.addEventListener('scroll', () => {
            this.scrollX = this.tracksContainer.scrollLeft;
            this.render();
        });

        // Global mouse events for dragging
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Set zoom level (pixels per second)
     */
    setZoom(zoom) {
        const oldZoom = this.zoom;
        this.zoom = Utils.clamp(zoom, 10, 500);

        // Maintain scroll position relative to current time
        const centerTime = this.scrollX / oldZoom + this.getVisibleWidth() / (2 * oldZoom);
        this.scrollX = centerTime * this.zoom - this.getVisibleWidth() / 2;
        this.scrollX = Math.max(0, this.scrollX);

        this.updateTracksWidth();
        this.render();
        this.emit('zoomChange', this.zoom);
    }

    /**
     * Set current time and update playhead
     */
    setCurrentTime(time) {
        this.currentTime = Utils.clamp(time, 0, this.duration);
        this.updatePlayhead();
        this.updateCurrentSubtitle();
    }

    /**
     * Set duration
     */
    setDuration(duration) {
        this.duration = Math.max(duration, 10);
        this.updateTracksWidth();
        this.render();
    }

    /**
     * Get visible width
     */
    getVisibleWidth() {
        return this.tracksContainer.clientWidth;
    }

    /**
     * Get total timeline width
     */
    getTotalWidth() {
        return this.duration * this.zoom;
    }

    /**
     * Convert time to X position
     */
    timeToX(time) {
        return time * this.zoom;
    }

    /**
     * Convert X position to time
     */
    xToTime(x) {
        return x / this.zoom;
    }

    /**
     * Update tracks container width
     */
    updateTracksWidth() {
        const width = this.getTotalWidth();
        const tracks = this.tracksContainer.querySelectorAll('.timeline-track');
        tracks.forEach(track => {
            track.style.width = width + 'px';
        });
        this.markersLane.style.width = width + 'px';
    }

    /**
     * Update playhead position
     */
    updatePlayhead() {
        const x = this.timeToX(this.currentTime);
        this.playhead.style.transform = `translateX(${x - this.scrollX}px)`;

        // Auto-scroll if playhead is out of view
        if (this.currentTime > 0) {
            const visibleStart = this.scrollX / this.zoom;
            const visibleEnd = (this.scrollX + this.getVisibleWidth()) / this.zoom;

            if (this.currentTime > visibleEnd - 1) {
                this.tracksContainer.scrollLeft = (this.currentTime - this.getVisibleWidth() / this.zoom + 2) * this.zoom;
            } else if (this.currentTime < visibleStart) {
                this.tracksContainer.scrollLeft = this.currentTime * this.zoom;
            }
        }
    }

    /**
     * Add track to timeline
     */
    addTrack(track) {
        this.tracks.push(track);
        this.renderTrack(track);
        return track;
    }

    /**
     * Remove track from timeline
     */
    removeTrack(trackId) {
        const index = this.tracks.findIndex(t => t.id === trackId);
        if (index !== -1) {
            this.tracks.splice(index, 1);
            const trackEl = this.tracksContainer.querySelector(`[data-track-id="${trackId}"]`);
            if (trackEl) {
                trackEl.remove();
            }
        }
    }

    /**
     * Get track by ID
     */
    getTrack(trackId) {
        return this.tracks.find(t => t.id === trackId);
    }

    /**
     * Render entire timeline
     */
    render() {
        this.renderRuler();
        this.updatePlayhead();
    }

    /**
     * Render time ruler
     */
    renderRuler() {
        const ctx = this.rulerCtx;
        const width = this.rulerCanvas.width / window.devicePixelRatio;
        const height = this.rulerCanvas.height / window.devicePixelRatio;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#2d2d35';
        ctx.fillRect(0, 0, width, height);

        // Calculate visible range
        const startTime = this.scrollX / this.zoom;
        const endTime = startTime + width / this.zoom;

        // Determine tick intervals based on zoom
        let majorInterval, minorInterval;
        if (this.zoom >= 200) {
            majorInterval = 1;
            minorInterval = 0.1;
        } else if (this.zoom >= 50) {
            majorInterval = 5;
            minorInterval = 1;
        } else if (this.zoom >= 20) {
            majorInterval = 10;
            minorInterval = 2;
        } else {
            majorInterval = 30;
            minorInterval = 5;
        }

        // Draw minor ticks
        ctx.strokeStyle = '#3a3a45';
        ctx.lineWidth = 1;
        ctx.beginPath();

        for (let t = Math.floor(startTime / minorInterval) * minorInterval; t <= endTime; t += minorInterval) {
            const x = (t - startTime) * this.zoom;
            ctx.moveTo(x, height - 8);
            ctx.lineTo(x, height);
        }
        ctx.stroke();

        // Draw major ticks and labels
        ctx.strokeStyle = '#5a5a65';
        ctx.fillStyle = '#a0a0a8';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.beginPath();

        for (let t = Math.floor(startTime / majorInterval) * majorInterval; t <= endTime; t += majorInterval) {
            const x = (t - startTime) * this.zoom;
            ctx.moveTo(x, height - 15);
            ctx.lineTo(x, height);

            // Time label
            const label = Utils.formatTime(t, false);
            ctx.fillText(label, x, height - 18);
        }
        ctx.stroke();
    }

    /**
     * Render single track
     */
    renderTrack(track) {
        // Check if track element exists
        let trackEl = this.tracksContainer.querySelector(`[data-track-id="${track.id}"]`);

        if (!trackEl) {
            trackEl = document.createElement('div');
            trackEl.className = 'timeline-track';
            trackEl.dataset.trackId = track.id;
            trackEl.style.height = this.settings.trackHeight + 'px';
            trackEl.style.width = this.getTotalWidth() + 'px';
            this.tracksContainer.appendChild(trackEl);
        }

        // Clear existing clips
        trackEl.innerHTML = '';

        // Render clips (subtitles)
        if (track.clips) {
            track.clips.forEach(clip => {
                this.renderClip(trackEl, track, clip);
            });
        }

        // Render audio waveform if exists
        if (track.audioBuffer && this.settings.showWaveform) {
            this.renderWaveform(trackEl, track);
        }
    }

    /**
     * Render subtitle clip
     */
    renderClip(trackEl, track, clip) {
        const clipEl = document.createElement('div');
        clipEl.className = 'subtitle-clip';
        clipEl.dataset.clipId = clip.id;

        const startX = this.timeToX(clip.startTime);
        const width = this.timeToX(clip.endTime - clip.startTime);

        clipEl.style.left = startX + 'px';
        clipEl.style.width = Math.max(width, 40) + 'px';

        if (track.color) {
            clipEl.style.borderLeftColor = track.color;
            clipEl.style.borderLeftWidth = '3px';
        }

        if (clip.id === this.selectedSubtitleId) {
            clipEl.classList.add('selected');
        }

        // Text content
        const textEl = document.createElement('span');
        textEl.className = 'subtitle-clip-text';
        textEl.textContent = clip.text.replace(/\n/g, ' ');
        clipEl.appendChild(textEl);

        // Left handle
        const leftHandle = document.createElement('div');
        leftHandle.className = 'subtitle-clip-handle left';
        clipEl.appendChild(leftHandle);

        // Right handle
        const rightHandle = document.createElement('div');
        rightHandle.className = 'subtitle-clip-handle right';
        clipEl.appendChild(rightHandle);

        // Event listeners
        clipEl.addEventListener('mousedown', (e) => this.handleClipMouseDown(e, track, clip));
        clipEl.addEventListener('touchstart', (e) => this.handleClipTouchStart(e, track, clip));
        clipEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectClip(track, clip);
        });

        leftHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e, 'handle-left', track, clip);
        });

        rightHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startDrag(e, 'handle-right', track, clip);
        });

        trackEl.appendChild(clipEl);
    }

    /**
     * Render audio waveform
     */
    renderWaveform(trackEl, track) {
        if (!track.audioBuffer) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'audio-clip-waveform';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';

        const width = this.getTotalWidth();
        const height = this.settings.trackHeight;

        canvas.width = Math.min(width, 8000) * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;

        const ctx = canvas.getContext('2d');
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        const data = track.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / (width * 2));

        ctx.fillStyle = track.color || '#6366f1';
        ctx.globalAlpha = 0.3;

        for (let i = 0; i < width; i++) {
            const index = Math.floor(i * data.length / width);
            let min = 1, max = -1;

            for (let j = 0; j < step; j++) {
                const sample = data[index + j] || 0;
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }

            const y1 = ((1 + min) / 2) * height;
            const y2 = ((1 + max) / 2) * height;
            ctx.fillRect(i, y1, 1, y2 - y1);
        }

        trackEl.insertBefore(canvas, trackEl.firstChild);
    }

    /**
     * Select clip
     */
    selectClip(track, clip) {
        this.selectedSubtitleId = clip.id;
        this.selectedClip = { track, clip };

        // Update visual state
        this.tracksContainer.querySelectorAll('.subtitle-clip').forEach(el => {
            el.classList.remove('selected');
        });

        const clipEl = this.tracksContainer.querySelector(`[data-clip-id="${clip.id}"]`);
        if (clipEl) {
            clipEl.classList.add('selected');
        }

        this.emit('clipSelected', { track, clip });
    }

    /**
     * Deselect clip
     */
    deselectClip() {
        this.selectedSubtitleId = null;
        this.selectedClip = null;

        this.tracksContainer.querySelectorAll('.subtitle-clip').forEach(el => {
            el.classList.remove('selected');
        });

        this.emit('clipDeselected');
    }

    /**
     * Update current subtitle highlight
     */
    updateCurrentSubtitle() {
        // Remove current class from all clips
        this.tracksContainer.querySelectorAll('.subtitle-clip.current').forEach(el => {
            el.classList.remove('current');
        });

        // Find and highlight current subtitle
        for (const track of this.tracks) {
            if (track.clips) {
                const current = track.clips.find(clip =>
                    this.currentTime >= clip.startTime && this.currentTime < clip.endTime
                );
                if (current) {
                    const clipEl = this.tracksContainer.querySelector(`[data-clip-id="${current.id}"]`);
                    if (clipEl) {
                        clipEl.classList.add('current');
                    }
                    this.emit('currentSubtitle', current);
                    return;
                }
            }
        }

        this.emit('currentSubtitle', null);
    }

    /**
     * Handle ruler mouse down
     */
    handleRulerMouseDown(e) {
        e.preventDefault();
        const rect = this.rulerCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.scrollX;
        const time = this.xToTime(x);

        this.emit('seek', Utils.clamp(time, 0, this.duration));
        this.startDrag(e, 'scrub');
    }

    /**
     * Handle ruler touch start
     */
    handleRulerTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.rulerCanvas.getBoundingClientRect();
        const x = touch.clientX - rect.left + this.scrollX;
        const time = this.xToTime(x);

        this.emit('seek', Utils.clamp(time, 0, this.duration));
        this.startDrag({ clientX: touch.clientX, clientY: touch.clientY }, 'scrub');
    }

    /**
     * Handle tracks container mouse down (click anywhere on timeline)
     */
    handleTracksMouseDown(e) {
        // Ignore if clicking on a clip or handle
        if (e.target.closest('.subtitle-clip')) return;

        e.preventDefault();
        const rect = this.tracksContainer.getBoundingClientRect();
        const x = e.clientX - rect.left + this.tracksContainer.scrollLeft;
        const time = this.xToTime(x);

        this.emit('seek', Utils.clamp(time, 0, this.duration));
        this.startDrag(e, 'scrub');
    }

    /**
     * Handle tracks container touch start
     */
    handleTracksTouchStart(e) {
        // Ignore if touching a clip
        if (e.target.closest('.subtitle-clip')) return;

        const touch = e.touches[0];
        const rect = this.tracksContainer.getBoundingClientRect();
        const x = touch.clientX - rect.left + this.tracksContainer.scrollLeft;
        const time = this.xToTime(x);

        this.emit('seek', Utils.clamp(time, 0, this.duration));
        this.startDrag({ clientX: touch.clientX, clientY: touch.clientY }, 'scrub');
    }

    /**
     * Handle clip mouse down
     */
    handleClipMouseDown(e, track, clip) {
        if (e.target.classList.contains('subtitle-clip-handle')) return;
        e.preventDefault();
        this.selectClip(track, clip);
        this.startDrag(e, 'clip', track, clip);
    }

    /**
     * Handle clip touch start
     */
    handleClipTouchStart(e, track, clip) {
        const touch = e.touches[0];
        this.selectClip(track, clip);
        this.startDrag({ clientX: touch.clientX, clientY: touch.clientY }, 'clip', track, clip);
    }

    /**
     * Start drag operation
     */
    startDrag(e, type, track = null, clip = null) {
        this.isDragging = true;
        this.dragType = type;
        this.dragStartX = e.clientX;
        this.dragTrack = track;
        this.dragClip = clip;

        if (clip) {
            this.dragStartTime = clip.startTime;
            this.dragStartEnd = clip.endTime;
        }

        document.body.classList.add('dragging');
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.dragStartX;
        const deltaTime = deltaX / this.zoom;

        switch (this.dragType) {
            case 'scrub':
                const rect = this.rulerCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left + this.scrollX;
                const time = Utils.clamp(this.xToTime(x), 0, this.duration);
                this.emit('seek', time);
                break;

            case 'clip':
                this.moveClip(deltaTime);
                break;

            case 'handle-left':
                this.resizeClipLeft(deltaTime);
                break;

            case 'handle-right':
                this.resizeClipRight(deltaTime);
                break;
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.dragType = null;
        this.dragClip = null;
        this.dragTrack = null;

        document.body.classList.remove('dragging');

        // Emit change event if clip was modified
        if (this.selectedClip) {
            this.emit('clipChanged', this.selectedClip);
        }
    }

    /**
     * Handle touch end
     */
    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }

    /**
     * Move clip
     */
    moveClip(deltaTime) {
        if (!this.dragClip) return;

        let newStart = this.dragStartTime + deltaTime;
        const duration = this.dragStartEnd - this.dragStartTime;

        // Snap to grid
        if (this.settings.snapToGrid) {
            newStart = Utils.snapToGrid(newStart, this.settings.gridSize);
        }

        // Clamp to valid range
        newStart = Math.max(0, newStart);

        this.dragClip.startTime = newStart;
        this.dragClip.endTime = newStart + duration;

        // Update visual
        this.refreshClip(this.dragTrack, this.dragClip);
        this.emit('clipMoved', { track: this.dragTrack, clip: this.dragClip });
    }

    /**
     * Resize clip from left
     */
    resizeClipLeft(deltaTime) {
        if (!this.dragClip) return;

        let newStart = this.dragStartTime + deltaTime;

        // Snap to grid
        if (this.settings.snapToGrid) {
            newStart = Utils.snapToGrid(newStart, this.settings.gridSize);
        }

        // Clamp
        newStart = Math.max(0, newStart);
        newStart = Math.min(newStart, this.dragClip.endTime - 0.1);

        this.dragClip.startTime = newStart;

        // Update visual
        this.refreshClip(this.dragTrack, this.dragClip);
    }

    /**
     * Resize clip from right
     */
    resizeClipRight(deltaTime) {
        if (!this.dragClip) return;

        let newEnd = this.dragStartEnd + deltaTime;

        // Snap to grid
        if (this.settings.snapToGrid) {
            newEnd = Utils.snapToGrid(newEnd, this.settings.gridSize);
        }

        // Clamp
        newEnd = Math.max(this.dragClip.startTime + 0.1, newEnd);

        this.dragClip.endTime = newEnd;

        // Update visual
        this.refreshClip(this.dragTrack, this.dragClip);
    }

    /**
     * Refresh single clip visual
     */
    refreshClip(track, clip) {
        const clipEl = this.tracksContainer.querySelector(`[data-clip-id="${clip.id}"]`);
        if (clipEl) {
            const startX = this.timeToX(clip.startTime);
            const width = this.timeToX(clip.endTime - clip.startTime);
            clipEl.style.left = startX + 'px';
            clipEl.style.width = Math.max(width, 40) + 'px';
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(e) {
        // Delete selected clip
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedClip) {
            e.preventDefault();
            this.emit('deleteClip', this.selectedClip);
        }
    }

    /**
     * Go to next subtitle
     */
    goToNextSubtitle() {
        for (const track of this.tracks) {
            if (!track.clips) continue;

            const next = SRTParser.findNextAfter(track.clips, this.currentTime);
            if (next) {
                this.emit('seek', next.startTime);
                this.selectClip(track, next);
                return;
            }
        }
    }

    /**
     * Go to previous subtitle
     */
    goToPreviousSubtitle() {
        for (const track of this.tracks) {
            if (!track.clips) continue;

            // First check if we're in the middle of a subtitle
            const currentIndex = track.clips.findIndex(clip =>
                this.currentTime >= clip.startTime && this.currentTime < clip.endTime
            );

            if (currentIndex > 0) {
                const prev = track.clips[currentIndex - 1];
                this.emit('seek', prev.startTime);
                this.selectClip(track, prev);
                return;
            }

            // Find previous subtitle
            const prev = SRTParser.findPreviousBefore(track.clips, this.currentTime);
            if (prev) {
                this.emit('seek', prev.startTime);
                this.selectClip(track, prev);
                return;
            }
        }
    }

    /**
     * Update settings
     */
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };

        // Update track heights
        if (settings.trackHeight) {
            document.documentElement.style.setProperty('--track-height', settings.trackHeight + 'px');
            this.tracksContainer.querySelectorAll('.timeline-track').forEach(el => {
                el.style.height = settings.trackHeight + 'px';
            });
        }

        this.render();
    }

    /**
     * Refresh all tracks
     */
    refresh() {
        this.tracks.forEach(track => this.renderTrack(track));
        this.render();
    }
}

// Make Timeline globally available
window.Timeline = Timeline;
