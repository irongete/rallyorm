import { format } from 'util';
import { type IRallyProgressEvent } from './rally-client.js';

// ── ANSI escape helpers ─────────────────────────────────────────────────────
const ESC             = '\x1b';
const HIDE_CURSOR     = `${ESC}[?25l`;
const SHOW_CURSOR     = `${ESC}[?25h`;
const ERASE_LINE      = `${ESC}[2K`;

/**
 * Handles out-of-the-box CLI progress tracking when `telemetry: true` is enabled.
 *
 * Bars are rendered as a **sticky header** at the top of the visible terminal
 * using ANSI scroll-region: new log lines scroll in below the bars without
 * ever pushing them off-screen.
 * @internal
 */
export class TelemetryReporter {
    private barState = new Map<string, {
        title: string; current: number; total: number; done: boolean;
    }>();
    /** parentBarKey → ordered list of sub-bar keys (per-source-type breakdowns). */
    private barHierarchy     = new Map<string, string[]>();
    private keyOrder:        string[]            = [];
    private activeCount      = 0;
    private running          = false;
    private drawnLines       = 0;
    private logBuffer:       string[]            = [];
    private renderTimer:     NodeJS.Timeout | null = null;
    private completionTimer: NodeJS.Timeout | null = null;
    private resizeHandler:   (() => void)  | null = null;
    private originalConsole: {
        log:   typeof console.log;
        error: typeof console.error;
        warn:  typeof console.warn;
        info:  typeof console.info;
    } | null = null;

    private get rows() { return process.stdout.rows    ?? 24; }
    private get cols() { return process.stdout.columns ?? 80; }
    private get isTTY() { return !!process.stdout.isTTY; }

    // ── Public API ─────────────────────────────────────────────────────────

    /** Write a log line. Buffered during active progress, flushed when bars complete. */
    log(...args: unknown[]): void {
        const msg = format(...args);
        if (this.running) {
            this.logBuffer.push(msg);
        } else {
            process.stdout.write(msg + '\n');
        }
    }

    handleProgress(event: IRallyProgressEvent): void {
        // Collection events are per-individual-URL (one per entity's collection fetch).
        // Relationship events already aggregate this into clean hierarchical bars.
        if (event.operation === 'collection') return;

        const key  = `${event.operation}-${event.entityType}-${event.relationshipName ?? ''}`;

        if (event.sourceEntityType) {
            // Sub-bar: per-source-type breakdown of a polymorphic relation load.
            // Only create the sub-bar once the parent bar exists.
            if (!this.barState.has(key)) return;

            const subKey = `${key}:${event.sourceEntityType}`;
            const prev   = this.barState.get(subKey);

            if (!prev) {
                if (event.total <= 0) return;
                this.cancelCompletionTimer();
                this.activeCount++;

                const parentTitle  = this.barState.get(key)!.title;
                const parentIndent = parentTitle.match(/^(\s*)/)?.[1] ?? '';
                const subTitle     = `${parentIndent}    \u251C\u2500 ${event.sourceEntityType}`.padEnd(40);

                this.barState.set(subKey, { title: subTitle, current: 0, total: event.total, done: false });

                if (!this.barHierarchy.has(key)) this.barHierarchy.set(key, []);
                this.barHierarchy.get(key)!.push(subKey);
            } else if (!this.running) {
                return;
            }

            const subEntry  = this.barState.get(subKey)!;
            const nextDone  = event.current >= event.total;
            this.barState.set(subKey, { ...subEntry, current: event.current, done: nextDone });

            if (!subEntry.done && nextDone) {
                this.activeCount = Math.max(0, this.activeCount - 1);
                if (this.activeCount === 0) this.armCompletionTimer();
            }
            return;
        }

        const prev = this.barState.get(key);

        if (!prev) {
            if (event.total <= 0) return;
            this.cancelCompletionTimer();
            this.activeCount++;

            const indent = '    '.repeat(event.level ?? 0);
            const name   = event.operation === 'relationship' && event.relationshipName
                ? event.relationshipName
                : `${event.entityType
                    ? event.entityType.charAt(0).toUpperCase() + event.entityType.slice(1)
                    : 'Item'}s`;
            const title = `${indent}Fetching ${name}`.padEnd(40);

            this.barState.set(key, { title, current: 0, total: event.total, done: false });
            this.keyOrder.push(key);

            if (!this.running) {
                this.start();
            }
            // fall through to update `current` with the value from this first event
        } else if (!this.running) {
            return; // bars already stopped; ignore late events
        }

        const entry    = this.barState.get(key)!;
        const nextDone = event.current >= event.total;
        this.barState.set(key, { ...entry, current: event.current, done: nextDone });

        if (!entry.done && nextDone) {
            this.activeCount = Math.max(0, this.activeCount - 1);
            if (this.activeCount === 0) this.armCompletionTimer();
        }
    }

    // ── Private: lifecycle ─────────────────────────────────────────────────

    private start(): void {
        this.running = true;
        this.interceptConsole();
        if (!this.isTTY) return; // piped / headless – skip visual bars

        process.stdout.write(HIDE_CURSOR);

        this.renderTimer = setInterval(() => this.renderBars(), 80);
        this.renderTimer.unref();

        this.resizeHandler = () => { if (this.running) this.renderBars(); };
        process.stdout.on('resize', this.resizeHandler);
    }

    private stop(): void {
        if (!this.running) return;
        if (this.renderTimer)    { clearInterval(this.renderTimer); this.renderTimer = null; }
        if (this.resizeHandler)  { process.stdout.off('resize', this.resizeHandler); this.resizeHandler = null; }
        this.running = false;

        if (this.isTTY) {
            this.renderBars();   // final render (shows 100 %)
            process.stdout.write('\n');
            process.stdout.write(SHOW_CURSOR);
        }

        this.restoreConsole();

        // Flush all buffered log lines below the completed bars
        for (const msg of this.logBuffer) {
            process.stdout.write(msg + '\n');
        }

        this.logBuffer   = [];
        this.drawnLines  = 0;
        this.barState.clear();
        this.barHierarchy.clear();
        this.keyOrder    = [];
        this.activeCount = 0;
    }

    // ── Private: rendering ─────────────────────────────────────────────────

    private renderBars(): void {
        if (this.keyOrder.length === 0) return;

        // Move cursor up to overwrite previously drawn bars, then redraw all.
        let out = this.drawnLines > 0 ? `${ESC}[${this.drawnLines}A` : '';
        let lineCount = 0;

        for (const key of this.keyOrder) {
            const b = this.barState.get(key)!;
            out += '\r' + ERASE_LINE;
            out += this.formatBar(b.title, b.current, b.total) + '\n';
            lineCount++;

            // Render any per-source-type sub-bars under this parent
            const children = this.barHierarchy.get(key);
            if (children && children.length > 0) {
                for (let i = 0; i < children.length; i++) {
                    const childKey = children[i];
                    const cb = this.barState.get(childKey);
                    if (!cb) continue;
                    // Use └─ for the last child, ├─ for all others
                    const treeChar  = i === children.length - 1 ? '\u2514\u2500' : '\u251C\u2500';
                    const childTitle = cb.title.replace(/[\u251C\u2514]\u2500/, treeChar);
                    out += '\r' + ERASE_LINE;
                    out += this.formatBar(childTitle, cb.current, cb.total) + '\n';
                    lineCount++;
                }
            }
        }

        this.drawnLines = lineCount;
        process.stdout.write(out);
    }

    private formatBar(title: string, current: number, total: number): string {
        const pct      = total > 0 ? Math.min(1, current / total) : 0;
        const barWidth = Math.max(8, this.cols - title.length - 22);
        const filled   = Math.round(pct * barWidth);
        const barStr   = `\x1b[36m${'█'.repeat(filled)}${'░'.repeat(barWidth - filled)}\x1b[0m`;
        const pctStr   = `${Math.round(pct * 100)}`.padStart(3);
        return `${title}[${barStr}] ${pctStr}% | ${current}/${total}`;
    }

    // ── Private: timing ────────────────────────────────────────────────────

    private armCompletionTimer(): void {
        this.cancelCompletionTimer();
        this.completionTimer = setTimeout(() => {
            if (this.activeCount > 0) return; // new phase started during grace period
            this.stop();
        }, 1000);
    }

    private cancelCompletionTimer(): void {
        if (this.completionTimer) { clearTimeout(this.completionTimer); this.completionTimer = null; }
    }

    // ── Private: console interception ─────────────────────────────────────

    private interceptConsole(): void {
        if (this.originalConsole) return;
        this.originalConsole = {
            log:   console.log.bind(console),
            error: console.error.bind(console),
            warn:  console.warn.bind(console),
            info:  console.info.bind(console),
        };
        const intercept = (...args: unknown[]) => this.log(...args);
        console.log   = intercept;
        console.error = intercept;
        console.warn  = intercept;
        console.info  = intercept;
    }

    private restoreConsole(): void {
        if (!this.originalConsole) return;
        console.log   = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn  = this.originalConsole.warn;
        console.info  = this.originalConsole.info;
        this.originalConsole = null;
    }
}
