import { format } from 'util';
import { type IRallyProgressEvent } from './rally-client.js';

// ── ANSI escape helpers ─────────────────────────────────────────────────────
const ESC             = '\x1b';
const HIDE_CURSOR     = `${ESC}[?25l`;
const SHOW_CURSOR     = `${ESC}[?25h`;
const SAVE_CURSOR     = `${ESC}7`;           // DEC private – widely supported
const RESTORE_CURSOR  = `${ESC}8`;
const ERASE_LINE      = `${ESC}[2K`;
const RESET_SCROLL    = `${ESC}[r`;
const cursorTo        = (r: number, c = 1) => `${ESC}[${r};${c}H`;
const insertLines     = (n: number)         => `${ESC}[${n}L`;
const scrollRegion    = (t: number, b: number) => `${ESC}[${t};${b}r`;

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
    private keyOrder:        string[]            = [];
    private activeCount      = 0;
    private running          = false;
    private headerSize       = 0;
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

    /** Write a log line to the scrolling area below the sticky header. */
    log(...args: unknown[]): void {
        process.stdout.write(format(...args) + '\n');
    }

    handleProgress(event: IRallyProgressEvent): void {
        const key  = `${event.operation}-${event.entityType}-${event.relationshipName ?? ''}`;
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
            } else if (this.isTTY) {
                this.growHeader(this.keyOrder.length);
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
        this.growHeader(this.keyOrder.length);

        this.renderTimer = setInterval(() => this.renderBars(), 80);
        this.renderTimer.unref();

        this.resizeHandler = () => {
            if (!this.running) return;
            process.stdout.write(scrollRegion(this.headerSize + 1, this.rows));
            this.renderBars();
        };
        process.stdout.on('resize', this.resizeHandler);
    }

    private stop(): void {
        if (!this.running) return;
        if (this.renderTimer)    { clearInterval(this.renderTimer); this.renderTimer = null; }
        if (this.resizeHandler)  { process.stdout.off('resize', this.resizeHandler); this.resizeHandler = null; }
        this.running = false;

        if (this.isTTY) {
            this.renderBars();                          // final render (shows 100 %)
            process.stdout.write(RESET_SCROLL);         // restore full-screen scrolling
            process.stdout.write(cursorTo(this.rows));  // cursor to bottom
            process.stdout.write(SHOW_CURSOR);
        }

        this.restoreConsole();
        this.barState.clear();
        this.keyOrder  = [];
        this.headerSize = 0;
        this.activeCount = 0;
    }

    // ── Private: rendering ─────────────────────────────────────────────────

    /**
     * Reserve `targetSize` rows at the very top of the visible terminal for
     * the progress bars and push log output into an ANSI scroll region below.
     *
     * Uses INSERT_LINES (IL) which pushes existing screen content downward,
     * creating blank rows at the top without clearing the terminal history.
     */
    private growHeader(targetSize: number): void {
        if (targetSize <= this.headerSize) return;
        const extra = targetSize - this.headerSize;

        // 1. Temporarily remove any scroll region so IL acts on the whole screen.
        // 2. Jump to row 1 and insert `extra` blank lines – this pushes all
        //    visible content down, creating blank rows at the top.
        // 3. Re-establish the scroll region below the enlarged header.
        // 4. Park the cursor at the bottom of the scroll region for log output.
        let out = RESET_SCROLL;
        out    += cursorTo(1);
        out    += insertLines(extra);
        out    += scrollRegion(targetSize + 1, this.rows);
        out    += cursorTo(this.rows);
        process.stdout.write(out);

        this.headerSize = targetSize;
    }

    private renderBars(): void {
        if (this.keyOrder.length === 0) return;

        // Save cursor (inside scroll region), jump to header rows, redraw each
        // bar in-place, then restore cursor so log output continues unaffected.
        let out = SAVE_CURSOR;
        for (let i = 0; i < this.keyOrder.length; i++) {
            const b = this.barState.get(this.keyOrder[i])!;
            out += cursorTo(i + 1);
            out += ERASE_LINE;
            out += this.formatBar(b.title, b.current, b.total);
        }
        out += RESTORE_CURSOR;
        process.stdout.write(out);
    }

    private formatBar(title: string, current: number, total: number): string {
        const pct      = total > 0 ? current / total : 0;
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
