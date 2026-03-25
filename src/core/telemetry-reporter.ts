import cliProgress, { MultiBar, SingleBar } from 'cli-progress';
import { format } from 'util';
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
    private originalConsole: {
        log: typeof console.log;
        error: typeof console.error;
        warn: typeof console.warn;
        info: typeof console.info;
    } | null = null;

    /**
     * Print a message above the progress bars. When no bars are active the
     * message is written directly to stdout so behaviour is identical to a
     * plain console.log call.
     */
    log(...args: unknown[]): void {
        const msg = format(...args);
        if (this.bars) {
            this.bars.log(msg + '\n');
        } else {
            process.stdout.write(msg + '\n');
        }
    }

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
            this.interceptConsole();
        }
    }

    /**
     * Redirects console output through MultiBar.log() so messages are printed
     * above the progress bars without mixing with or overwriting them.
     */
    private interceptConsole(): void {
        if (this.originalConsole) return;

        const bars = this.bars!;
        this.originalConsole = {
            log: console.log.bind(console),
            error: console.error.bind(console),
            warn: console.warn.bind(console),
            info: console.info.bind(console),
        };

        const makeInterceptor = () => (...args: unknown[]) => {
            bars.log(format(...args) + '\n');
        };

        console.log = makeInterceptor();
        console.error = makeInterceptor();
        console.warn = makeInterceptor();
        console.info = makeInterceptor();
    }

    private restoreConsole(): void {
        if (!this.originalConsole) return;
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.info = this.originalConsole.info;
        this.originalConsole = null;
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
                this.restoreConsole();
                this.bars = null;
                this.activeBars.clear();
                this.progressState.clear();
            }
        }, 100);
    }
}
