/**
 * VoiceOver Studio - Markers System
 * Handles creation, management, and export of timeline markers
 */

class MarkersManager extends Utils.EventEmitter {
    constructor(timeline) {
        super();

        this.timeline = timeline;
        this.markersLane = document.getElementById('markers-lane');
        this.markers = [];
        this.selectedMarker = null;

        this.colors = [
            '#f59e0b', // Yellow (default)
            '#ef4444', // Red
            '#22c55e', // Green
            '#3b82f6', // Blue
            '#8b5cf6', // Purple
            '#ec4899', // Pink
        ];

        this.init();
    }

    init() {
        // Click on markers lane to add marker
        this.markersLane.addEventListener('dblclick', (e) => {
            const rect = this.markersLane.getBoundingClientRect();
            const x = e.clientX - rect.left + this.timeline.scrollX;
            const time = this.timeline.xToTime(x);
            this.addMarker(time);
        });
    }

    /**
     * Add marker at specified time
     */
    addMarker(time, options = {}) {
        const marker = {
            id: Utils.generateId(),
            time: Utils.snapToGrid(time, this.timeline.settings.gridSize, this.timeline.settings.snapToGrid),
            label: options.label || `Marker ${this.markers.length + 1}`,
            color: options.color || this.colors[0],
            notes: options.notes || ''
        };

        this.markers.push(marker);
        this.markers.sort((a, b) => a.time - b.time);

        this.renderMarker(marker);
        this.emit('markerAdded', marker);

        return marker;
    }

    /**
     * Remove marker
     */
    removeMarker(markerId) {
        const index = this.markers.findIndex(m => m.id === markerId);
        if (index !== -1) {
            const marker = this.markers[index];
            this.markers.splice(index, 1);

            const markerEl = this.markersLane.querySelector(`[data-marker-id="${markerId}"]`);
            if (markerEl) {
                markerEl.remove();
            }

            this.emit('markerRemoved', marker);
        }
    }

    /**
     * Update marker
     */
    updateMarker(markerId, updates) {
        const marker = this.markers.find(m => m.id === markerId);
        if (marker) {
            Object.assign(marker, updates);
            this.refreshMarker(marker);
            this.emit('markerUpdated', marker);
        }
    }

    /**
     * Move marker to new time
     */
    moveMarker(markerId, time) {
        this.updateMarker(markerId, {
            time: Utils.snapToGrid(time, this.timeline.settings.gridSize, this.timeline.settings.snapToGrid)
        });
    }

    /**
     * Get marker by ID
     */
    getMarker(markerId) {
        return this.markers.find(m => m.id === markerId);
    }

    /**
     * Get marker at or near time
     */
    getMarkerAtTime(time, tolerance = 0.5) {
        return this.markers.find(m =>
            Math.abs(m.time - time) <= tolerance
        );
    }

    /**
     * Get next marker after time
     */
    getNextMarker(time) {
        return this.markers.find(m => m.time > time);
    }

    /**
     * Get previous marker before time
     */
    getPreviousMarker(time) {
        for (let i = this.markers.length - 1; i >= 0; i--) {
            if (this.markers[i].time < time) {
                return this.markers[i];
            }
        }
        return null;
    }

    /**
     * Select marker
     */
    selectMarker(marker) {
        this.selectedMarker = marker;

        // Update visual state
        this.markersLane.querySelectorAll('.marker').forEach(el => {
            el.classList.remove('selected');
        });

        const markerEl = this.markersLane.querySelector(`[data-marker-id="${marker.id}"]`);
        if (markerEl) {
            markerEl.classList.add('selected');
        }

        this.emit('markerSelected', marker);
    }

    /**
     * Deselect marker
     */
    deselectMarker() {
        this.selectedMarker = null;

        this.markersLane.querySelectorAll('.marker').forEach(el => {
            el.classList.remove('selected');
        });

        this.emit('markerDeselected');
    }

    /**
     * Render marker element
     */
    renderMarker(marker) {
        const markerEl = document.createElement('div');
        markerEl.className = 'marker';
        markerEl.dataset.markerId = marker.id;

        const x = this.timeline.timeToX(marker.time);
        markerEl.style.left = x + 'px';

        // Flag
        const flag = document.createElement('div');
        flag.className = 'marker-flag';
        flag.style.borderLeftColor = marker.color;
        markerEl.appendChild(flag);

        // Line
        const line = document.createElement('div');
        line.className = 'marker-line';
        line.style.backgroundColor = marker.color;
        markerEl.appendChild(line);

        // Label
        const label = document.createElement('div');
        label.className = 'marker-label';
        label.textContent = marker.label;
        label.style.color = marker.color;
        markerEl.appendChild(label);

        // Event listeners
        markerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectMarker(marker);
            this.emit('seek', marker.time);
        });

        markerEl.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.showEditDialog(marker);
        });

        markerEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, marker);
        });

        // Dragging
        this.setupMarkerDrag(markerEl, marker);

        this.markersLane.appendChild(markerEl);
    }

    /**
     * Setup marker dragging
     */
    setupMarkerDrag(markerEl, marker) {
        let isDragging = false;
        let startX = 0;
        let startTime = 0;

        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startTime = marker.time;
            document.body.classList.add('dragging');
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaTime = deltaX / this.timeline.zoom;
            const newTime = Math.max(0, startTime + deltaTime);

            marker.time = Utils.snapToGrid(newTime, this.timeline.settings.gridSize, this.timeline.settings.snapToGrid);
            markerEl.style.left = this.timeline.timeToX(marker.time) + 'px';
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            document.body.classList.remove('dragging');
            this.emit('markerMoved', marker);
        };

        markerEl.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Refresh marker visual
     */
    refreshMarker(marker) {
        const markerEl = this.markersLane.querySelector(`[data-marker-id="${marker.id}"]`);
        if (markerEl) {
            markerEl.style.left = this.timeline.timeToX(marker.time) + 'px';

            const flag = markerEl.querySelector('.marker-flag');
            if (flag) flag.style.borderLeftColor = marker.color;

            const line = markerEl.querySelector('.marker-line');
            if (line) line.style.backgroundColor = marker.color;

            const label = markerEl.querySelector('.marker-label');
            if (label) {
                label.textContent = marker.label;
                label.style.color = marker.color;
            }
        }
    }

    /**
     * Refresh all markers
     */
    refreshAll() {
        this.markersLane.innerHTML = '';
        this.markers.forEach(marker => this.renderMarker(marker));
    }

    /**
     * Show edit dialog for marker
     */
    showEditDialog(marker) {
        const label = prompt('Marker label:', marker.label);
        if (label !== null) {
            this.updateMarker(marker.id, { label });
        }
    }

    /**
     * Show context menu
     */
    showContextMenu(e, marker) {
        // Remove existing context menu
        const existing = document.querySelector('.marker-context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'marker-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 4px 0;
            z-index: 1000;
            min-width: 150px;
            box-shadow: var(--shadow-lg);
        `;

        const items = [
            { label: 'Edit Label', action: () => this.showEditDialog(marker) },
            { label: 'Go to Marker', action: () => this.emit('seek', marker.time) },
            { label: 'divider' },
            { label: 'Delete', action: () => this.removeMarker(marker.id), danger: true }
        ];

        items.forEach(item => {
            if (item.label === 'divider') {
                const divider = document.createElement('div');
                divider.style.cssText = 'height: 1px; background: var(--border); margin: 4px 0;';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('button');
                menuItem.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 8px 16px;
                    text-align: left;
                    background: transparent;
                    border: none;
                    color: ${item.danger ? 'var(--error)' : 'var(--text-primary)'};
                    cursor: pointer;
                    font-size: 13px;
                `;
                menuItem.textContent = item.label;
                menuItem.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.background = 'var(--bg-hover)';
                });
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.background = 'transparent';
                });
                menu.appendChild(menuItem);
            }
        });

        document.body.appendChild(menu);

        // Close on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Clear all markers
     */
    clearAll() {
        this.markers = [];
        this.markersLane.innerHTML = '';
        this.selectedMarker = null;
        this.emit('markersCleared');
    }

    /**
     * Import markers from JSON
     */
    importFromJSON(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;

            if (Array.isArray(data)) {
                data.forEach(marker => {
                    this.addMarker(marker.time, {
                        label: marker.label,
                        color: marker.color,
                        notes: marker.notes
                    });
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to import markers:', error);
            return false;
        }
    }

    /**
     * Export markers to various formats
     */
    export(format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(this.markers.map(m => ({
                    time: m.time,
                    label: m.label,
                    color: m.color,
                    notes: m.notes
                })), null, 2);

            case 'csv':
                const headers = 'Time,Label,Notes\n';
                const rows = this.markers.map(m =>
                    `${Utils.formatTime(m.time)},"${m.label}","${m.notes || ''}"`
                ).join('\n');
                return headers + rows;

            case 'txt':
                return this.markers.map(m =>
                    `${Utils.formatTime(m.time)} - ${m.label}${m.notes ? ' (' + m.notes + ')' : ''}`
                ).join('\n');

            default:
                return this.export('json');
        }
    }

    /**
     * Get all markers
     */
    getAll() {
        return [...this.markers];
    }

    /**
     * Get markers count
     */
    get count() {
        return this.markers.length;
    }
}

// Make MarkersManager globally available
window.MarkersManager = MarkersManager;
