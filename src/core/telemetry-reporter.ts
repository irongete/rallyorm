import cliProgress, { MultiBar, SingleBar } from 'cli-progress';
import { type IRallyProgressEvent } from './rally-client.js';

/**
 * Handles out-of-the-box CLI progress tracking when `telemetry: true` is enabled.
 * @internal
 */
export class TelemetryReporter {
    private bars: MultiBar | null = null;
    private activeBars: Map<string, SingleBar> = new Map();
    private progressState: Map<string, { current: number, total: number }> = new Map();
    private completionTimer: NodeJS.Timeout | null = null;

    handleProgress(event: IRallyProgressEvent): void {
        this.initializeBars();

        const key = `${event.operation}-${event.entityType}-${event.relationshipName || ''}`;
        let bar = this.activeBars.get(key);
        
        if (!bar && event.total > 0 && this.bars) {
            const depth = event.level || 0;
            const indent = '    '.repeat(depth);
            
            let title = '';
            if (event.operation === 'relationship' && event.relationshipName) {
                title = `${indent}Fetching ${event.relationshipName}`;
            } else {
                const typeCapitalized = event.entityType 
                    ? event.entityType.charAt(0).toUpperCase() + event.entityType.slice(1) 
                    : 'Items';
                title = `${indent}Fetching ${typeCapitalized}s`;
            }

            bar = this.bars.create(event.total, 0, { 
                title: title.padEnd(40)
            });
            this.activeBars.set(key, bar);
        }

        if (bar) {
            bar.update(event.current);
            this.progressState.set(key, { current: event.current, total: event.total });
        }

        this.checkCompletion();
    }

    private initializeBars(): void {
        if (!this.bars) {
            this.bars = new cliProgress.MultiBar({
                clearOnComplete: false,
                hideCursor: true,
                format: '{title} [\x1b[36m{bar}\x1b[0m] {percentage}% | {value}/{total}'
            }, cliProgress.Presets.shades_classic);
        }
    }

    private checkCompletion(): void {
        if (this.completionTimer) {
            clearTimeout(this.completionTimer);
        }

        this.completionTimer = setTimeout(() => {
            let allDone = true;
            for (const state of this.progressState.values()) {
                if (state.current < state.total) {
                    allDone = false;
                    break;
                }
            }
            
            if (allDone && this.bars) {
                this.bars.stop();
                this.bars = null;
                this.activeBars.clear();
                this.progressState.clear();
            }
        }, 100);
    }
}
