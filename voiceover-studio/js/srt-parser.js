/**
 * VoiceOver Studio - SRT Parser
 * Handles parsing and generation of SRT subtitle files
 */

class SRTParser {
    /**
     * Parse SRT content to array of subtitle objects
     */
    static parse(content) {
        const subtitles = [];

        // Normalize line endings and split
        const blocks = content
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim()
            .split(/\n\n+/);

        for (const block of blocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 3) continue;

            // Parse index
            const index = parseInt(lines[0]);
            if (isNaN(index)) continue;

            // Parse timing
            const timingMatch = lines[1].match(
                /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
            );
            if (!timingMatch) continue;

            const startTime = Utils.parseSrtTime(timingMatch[1]);
            const endTime = Utils.parseSrtTime(timingMatch[2]);

            // Parse text (may be multiple lines)
            const text = lines.slice(2).join('\n').trim();

            subtitles.push({
                id: Utils.generateId(),
                index,
                startTime,
                endTime,
                text,
                color: null // Will be assigned by track
            });
        }

        return subtitles.sort((a, b) => a.startTime - b.startTime);
    }

    /**
     * Generate SRT content from subtitle array
     */
    static generate(subtitles) {
        const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);

        return sorted.map((sub, idx) => {
            const index = idx + 1;
            const start = Utils.toSrtTime(sub.startTime);
            const end = Utils.toSrtTime(sub.endTime);
            return `${index}\n${start} --> ${end}\n${sub.text}`;
        }).join('\n\n');
    }

    /**
     * Validate SRT content
     */
    static validate(content) {
        try {
            const subtitles = this.parse(content);
            return {
                valid: subtitles.length > 0,
                count: subtitles.length,
                errors: []
            };
        } catch (error) {
            return {
                valid: false,
                count: 0,
                errors: [error.message]
            };
        }
    }

    /**
     * Merge overlapping subtitles
     */
    static mergeOverlapping(subtitles, maxGap = 0.1) {
        if (subtitles.length < 2) return subtitles;

        const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
        const merged = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const last = merged[merged.length - 1];

            // Check if current overlaps or is very close to last
            if (current.startTime <= last.endTime + maxGap) {
                // Merge texts
                last.text = last.text + '\n' + current.text;
                // Extend end time
                last.endTime = Math.max(last.endTime, current.endTime);
            } else {
                merged.push(current);
            }
        }

        return merged;
    }

    /**
     * Shift all subtitles by offset (in seconds)
     */
    static shiftAll(subtitles, offset) {
        return subtitles.map(sub => ({
            ...sub,
            startTime: Math.max(0, sub.startTime + offset),
            endTime: Math.max(0, sub.endTime + offset)
        }));
    }

    /**
     * Scale subtitle timing by factor
     */
    static scale(subtitles, factor, anchor = 0) {
        return subtitles.map(sub => ({
            ...sub,
            startTime: anchor + (sub.startTime - anchor) * factor,
            endTime: anchor + (sub.endTime - anchor) * factor
        }));
    }

    /**
     * Find subtitle at given time
     */
    static findAtTime(subtitles, time) {
        return subtitles.find(sub =>
            time >= sub.startTime && time < sub.endTime
        );
    }

    /**
     * Find subtitle index at given time
     */
    static findIndexAtTime(subtitles, time) {
        return subtitles.findIndex(sub =>
            time >= sub.startTime && time < sub.endTime
        );
    }

    /**
     * Get next subtitle after given time
     */
    static findNextAfter(subtitles, time) {
        const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
        return sorted.find(sub => sub.startTime > time);
    }

    /**
     * Get previous subtitle before given time
     */
    static findPreviousBefore(subtitles, time) {
        const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].endTime < time) {
                return sorted[i];
            }
        }
        return null;
    }

    /**
     * Calculate statistics for subtitles
     */
    static getStats(subtitles) {
        if (!subtitles.length) {
            return {
                count: 0,
                totalDuration: 0,
                averageDuration: 0,
                averageCharsPerSec: 0,
                minDuration: 0,
                maxDuration: 0
            };
        }

        let totalDuration = 0;
        let totalChars = 0;
        let minDuration = Infinity;
        let maxDuration = 0;

        for (const sub of subtitles) {
            const duration = sub.endTime - sub.startTime;
            totalDuration += duration;
            totalChars += sub.text.length;
            minDuration = Math.min(minDuration, duration);
            maxDuration = Math.max(maxDuration, duration);
        }

        return {
            count: subtitles.length,
            totalDuration,
            averageDuration: totalDuration / subtitles.length,
            averageCharsPerSec: totalChars / totalDuration,
            minDuration,
            maxDuration
        };
    }
}

// Make SRTParser globally available
window.SRTParser = SRTParser;
