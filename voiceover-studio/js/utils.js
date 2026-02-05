/**
 * VoiceOver Studio - Utility Functions
 */

const Utils = {
    /**
     * Format time in seconds to HH:MM:SS.mmm
     */
    formatTime(seconds, showMs = true) {
        if (isNaN(seconds) || seconds < 0) seconds = 0;

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        const mmm = String(ms).padStart(3, '0');

        return showMs ? `${hh}:${mm}:${ss}.${mmm}` : `${hh}:${mm}:${ss}`;
    },

    /**
     * Parse SRT time format (HH:MM:SS,mmm) to seconds
     */
    parseSrtTime(timeStr) {
        const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
        if (!match) return 0;

        const [, h, m, s, ms] = match;
        return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
    },

    /**
     * Format seconds to SRT time format (HH:MM:SS,mmm)
     */
    toSrtTime(seconds) {
        if (isNaN(seconds) || seconds < 0) seconds = 0;

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Map value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
    },

    /**
     * Convert dB to linear gain
     */
    dbToGain(db) {
        return Math.pow(10, db / 20);
    },

    /**
     * Convert linear gain to dB
     */
    gainToDb(gain) {
        if (gain === 0) return -Infinity;
        return 20 * Math.log10(gain);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Download file
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    },

    /**
     * Get track colors palette
     */
    getTrackColors() {
        return [
            '#6366f1', // Indigo
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#ef4444', // Red
            '#f97316', // Orange
            '#eab308', // Yellow
            '#22c55e', // Green
            '#14b8a6', // Teal
            '#06b6d4', // Cyan
            '#3b82f6', // Blue
        ];
    },

    /**
     * Get next track color
     */
    getNextTrackColor(usedColors = []) {
        const colors = this.getTrackColors();
        for (const color of colors) {
            if (!usedColors.includes(color)) {
                return color;
            }
        }
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /**
     * Snap time to grid
     */
    snapToGrid(time, gridSize, enabled = true) {
        if (!enabled || gridSize <= 0) return time;
        return Math.round(time / gridSize) * gridSize;
    },

    /**
     * Parse time input string to seconds
     */
    parseTimeInput(input) {
        // Try HH:MM:SS,mmm or HH:MM:SS.mmm format
        let match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/);
        if (match) {
            const [, h, m, s, ms] = match;
            return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
        }

        // Try HH:MM:SS format
        match = input.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
        if (match) {
            const [, h, m, s] = match;
            return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
        }

        // Try MM:SS format
        match = input.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
            const [, m, s] = match;
            return parseInt(m) * 60 + parseInt(s);
        }

        // Try seconds
        const num = parseFloat(input);
        if (!isNaN(num)) {
            return num;
        }

        return null;
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * EventEmitter class for custom events
     */
    EventEmitter: class {
        constructor() {
            this.events = {};
        }

        on(event, listener) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(listener);
            return () => this.off(event, listener);
        }

        off(event, listener) {
            if (!this.events[event]) return;
            this.events[event] = this.events[event].filter(l => l !== listener);
        }

        emit(event, ...args) {
            if (!this.events[event]) return;
            this.events[event].forEach(listener => listener(...args));
        }

        once(event, listener) {
            const remove = this.on(event, (...args) => {
                remove();
                listener(...args);
            });
        }
    }
};

// Make Utils globally available
window.Utils = Utils;
