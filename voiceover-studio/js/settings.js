/**
 * VoiceOver Studio - Settings Manager
 * Handles settings UI and persistence
 */

class SettingsManager extends Utils.EventEmitter {
    constructor(audioEngine, timeline) {
        super();

        this.audioEngine = audioEngine;
        this.timeline = timeline;

        this.modal = document.getElementById('settings-modal');
        this.closeBtn = document.getElementById('close-settings');
        this.resetBtn = document.getElementById('btn-reset-settings');
        this.saveBtn = document.getElementById('btn-save-settings');

        // Tab buttons
        this.tabBtns = this.modal.querySelectorAll('.tab-btn');
        this.tabContents = this.modal.querySelectorAll('.tab-content');

        // Settings elements
        this.elements = {
            // Ducking
            duckingEnabled: document.getElementById('ducking-enabled'),
            duckingLevel: document.getElementById('ducking-level'),
            duckingLevelValue: document.getElementById('ducking-level-value'),
            duckingAttack: document.getElementById('ducking-attack'),
            duckingAttackValue: document.getElementById('ducking-attack-value'),
            duckingRelease: document.getElementById('ducking-release'),
            duckingReleaseValue: document.getElementById('ducking-release-value'),
            duckingLookahead: document.getElementById('ducking-lookahead'),
            duckingLookaheadValue: document.getElementById('ducking-lookahead-value'),

            // Audio
            inputDevice: document.getElementById('input-device'),
            outputDevice: document.getElementById('output-device'),
            sampleRate: document.getElementById('sample-rate'),
            bufferSize: document.getElementById('buffer-size'),
            monitorEnabled: document.getElementById('monitor-enabled'),

            // Display
            trackHeight: document.getElementById('track-height'),
            showWaveform: document.getElementById('show-waveform'),
            snapToGrid: document.getElementById('snap-to-grid'),
            gridSize: document.getElementById('grid-size'),
            subtitleFontSize: document.getElementById('subtitle-font-size')
        };

        // Default settings
        this.defaults = {
            ducking: {
                enabled: true,
                level: -12,
                attack: 50,
                release: 200,
                lookahead: 100
            },
            audio: {
                inputDevice: '',
                outputDevice: '',
                sampleRate: 48000,
                bufferSize: 512,
                monitorEnabled: false
            },
            display: {
                trackHeight: 80,
                showWaveform: true,
                snapToGrid: true,
                gridSize: 0.5,
                subtitleFontSize: 16
            }
        };

        this.settings = Utils.deepClone(this.defaults);

        this.init();
    }

    init() {
        // Load saved settings
        this.load();

        // Setup modal
        this.closeBtn.addEventListener('click', () => this.hide());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.saveBtn.addEventListener('click', () => this.saveAndClose());

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Setup value display updates for sliders
        this.setupSliderDisplays();

        // Load audio devices
        this.loadAudioDevices();

        // Apply loaded settings
        this.applySettings();
    }

    /**
     * Setup slider value displays
     */
    setupSliderDisplays() {
        // Ducking level
        this.elements.duckingLevel.addEventListener('input', () => {
            this.elements.duckingLevelValue.textContent = this.elements.duckingLevel.value;
        });

        // Ducking attack
        this.elements.duckingAttack.addEventListener('input', () => {
            this.elements.duckingAttackValue.textContent = this.elements.duckingAttack.value;
        });

        // Ducking release
        this.elements.duckingRelease.addEventListener('input', () => {
            this.elements.duckingReleaseValue.textContent = this.elements.duckingRelease.value;
        });

        // Ducking lookahead
        this.elements.duckingLookahead.addEventListener('input', () => {
            this.elements.duckingLookaheadValue.textContent = this.elements.duckingLookahead.value;
        });
    }

    /**
     * Load audio devices
     */
    async loadAudioDevices() {
        try {
            const devices = await this.audioEngine.getAudioDevices();

            // Input devices
            this.elements.inputDevice.innerHTML = '<option value="">Default</option>';
            devices.inputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Microphone ${device.deviceId.slice(0, 8)}`;
                this.elements.inputDevice.appendChild(option);
            });

            // Output devices
            this.elements.outputDevice.innerHTML = '<option value="">Default</option>';
            devices.outputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Speaker ${device.deviceId.slice(0, 8)}`;
                this.elements.outputDevice.appendChild(option);
            });

        } catch (error) {
            console.warn('Could not load audio devices:', error);
        }
    }

    /**
     * Switch tab
     */
    switchTab(tabId) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    }

    /**
     * Show settings modal
     */
    show() {
        this.updateUIFromSettings();
        this.modal.classList.add('active');
    }

    /**
     * Hide settings modal
     */
    hide() {
        this.modal.classList.remove('active');
    }

    /**
     * Update UI elements from settings
     */
    updateUIFromSettings() {
        // Ducking
        this.elements.duckingEnabled.checked = this.settings.ducking.enabled;
        this.elements.duckingLevel.value = this.settings.ducking.level;
        this.elements.duckingLevelValue.textContent = this.settings.ducking.level;
        this.elements.duckingAttack.value = this.settings.ducking.attack;
        this.elements.duckingAttackValue.textContent = this.settings.ducking.attack;
        this.elements.duckingRelease.value = this.settings.ducking.release;
        this.elements.duckingReleaseValue.textContent = this.settings.ducking.release;
        this.elements.duckingLookahead.value = this.settings.ducking.lookahead;
        this.elements.duckingLookaheadValue.textContent = this.settings.ducking.lookahead;

        // Audio
        this.elements.inputDevice.value = this.settings.audio.inputDevice;
        this.elements.outputDevice.value = this.settings.audio.outputDevice;
        this.elements.sampleRate.value = this.settings.audio.sampleRate;
        this.elements.bufferSize.value = this.settings.audio.bufferSize;
        this.elements.monitorEnabled.checked = this.settings.audio.monitorEnabled;

        // Display
        this.elements.trackHeight.value = this.settings.display.trackHeight;
        this.elements.showWaveform.checked = this.settings.display.showWaveform;
        this.elements.snapToGrid.checked = this.settings.display.snapToGrid;
        this.elements.gridSize.value = this.settings.display.gridSize;
        this.elements.subtitleFontSize.value = this.settings.display.subtitleFontSize;
    }

    /**
     * Get settings from UI elements
     */
    getSettingsFromUI() {
        return {
            ducking: {
                enabled: this.elements.duckingEnabled.checked,
                level: parseInt(this.elements.duckingLevel.value),
                attack: parseInt(this.elements.duckingAttack.value),
                release: parseInt(this.elements.duckingRelease.value),
                lookahead: parseInt(this.elements.duckingLookahead.value)
            },
            audio: {
                inputDevice: this.elements.inputDevice.value,
                outputDevice: this.elements.outputDevice.value,
                sampleRate: parseInt(this.elements.sampleRate.value),
                bufferSize: parseInt(this.elements.bufferSize.value),
                monitorEnabled: this.elements.monitorEnabled.checked
            },
            display: {
                trackHeight: parseInt(this.elements.trackHeight.value),
                showWaveform: this.elements.showWaveform.checked,
                snapToGrid: this.elements.snapToGrid.checked,
                gridSize: parseFloat(this.elements.gridSize.value),
                subtitleFontSize: parseInt(this.elements.subtitleFontSize.value)
            }
        };
    }

    /**
     * Apply settings to components
     */
    applySettings() {
        // Apply ducking settings to audio engine
        this.audioEngine.setDuckingSettings(this.settings.ducking);

        // Apply timeline settings
        this.timeline.updateSettings({
            trackHeight: this.settings.display.trackHeight,
            showWaveform: this.settings.display.showWaveform,
            snapToGrid: this.settings.display.snapToGrid,
            gridSize: this.settings.display.gridSize
        });

        // Apply subtitle font size
        document.documentElement.style.setProperty(
            '--subtitle-font-size',
            this.settings.display.subtitleFontSize + 'px'
        );

        // Update preview text size
        const previewText = document.getElementById('preview-text');
        if (previewText) {
            previewText.style.fontSize = (this.settings.display.subtitleFontSize + 4) + 'px';
        }

        this.emit('settingsApplied', this.settings);
    }

    /**
     * Save settings to localStorage
     */
    save() {
        try {
            localStorage.setItem('voiceover-studio-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Could not save settings:', error);
        }
    }

    /**
     * Load settings from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('voiceover-studio-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = {
                    ducking: { ...this.defaults.ducking, ...parsed.ducking },
                    audio: { ...this.defaults.audio, ...parsed.audio },
                    display: { ...this.defaults.display, ...parsed.display }
                };
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
        }
    }

    /**
     * Reset to defaults
     */
    reset() {
        if (confirm('Reset all settings to defaults?')) {
            this.settings = Utils.deepClone(this.defaults);
            this.updateUIFromSettings();
            this.applySettings();
            this.save();
            Utils.showToast('Settings reset to defaults', 'info');
        }
    }

    /**
     * Save and close
     */
    saveAndClose() {
        this.settings = this.getSettingsFromUI();
        this.applySettings();
        this.save();
        this.hide();
        Utils.showToast('Settings saved', 'success');
    }

    /**
     * Get current settings
     */
    getSettings() {
        return Utils.deepClone(this.settings);
    }

    /**
     * Update specific setting
     */
    updateSetting(category, key, value) {
        if (this.settings[category]) {
            this.settings[category][key] = value;
            this.applySettings();
            this.save();
        }
    }
}

// Make SettingsManager globally available
window.SettingsManager = SettingsManager;
