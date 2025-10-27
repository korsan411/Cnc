/**
 * Debug System for CNC AI application
 * Provides logging, error tracking, and debugging utilities
 */
class DebugSystem {
    constructor() {
        this.logs = [];
        this.isInitialized = false;
        this.maxLogs = CONFIG.maxDebugLogs;
        this.levels = {
            ERROR: 'error',
            WARN: 'warn', 
            INFO: 'info',
            DEBUG: 'debug'
        };
    }

    /**
     * Initialize the debug system
     */
    init() {
        if (this.isInitialized) return;

        this.createDebugOverlay();
        this.overrideConsoleMethods();
        this.setupErrorHandlers();
        
        this.isInitialized = true;
        this.log('تم تهيئة نظام التصحيح', this.levels.INFO);
    }

    /**
     * Create debug overlay UI
     */
    createDebugOverlay() {
        // Remove existing debug overlay if any
        const existingOverlay = document.getElementById('debugOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlayHTML = `
            <div id="debugOverlay" class="minimized">
                <div id="debugHeader">
                    <div style="display:flex;align-items:center;gap:8px">
                        <b>🐞 CncAi Debug</b>
                        <small id="debugSummary">0 سجلات</small>
                    </div>
                    <div id="debugControls">
                        <button id="dbgToggleSize" class="dbg-btn" title="تكبير/تصغير">🔽</button>
                        <button id="dbgClear" class="dbg-btn" title="مسح السجلات">🧹</button>
                        <button id="dbgCopy" class="dbg-btn" title="نسخ السجلات">📋</button>
                        <button id="dbgClose" class="dbg-btn" title="إخفاء">❌</button>
                    </div>
                </div>
                <div id="debugTopbar">
                    <div style="padding:6px 10px;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(255,255,255,0.03);display:flex;gap:6px;align-items:center">
                        <button id="dbgToggleSizeTop" class="dbg-btn" style="font-size:11px">🔽 حجم</button>
                        <button id="dbgHideTop" class="dbg-btn" style="font-size:11px">👁️ إخفاء</button>
                        <button id="dbgResetTop" class="dbg-btn" style="font-size:11px">🔄 إعادة تعيين</button>
                        <div style="flex:1"></div>
                        <small style="color:#9bb0c8">انقر التصغير لحفظ الشاشة</small>
                    </div>
                </div>
                <div id="debugList"></div>
                <div id="debugFooter">
                    <div style="flex:1"></div>
                    <div style="font-size:12px;color:#9bb0c8">CncAi ${CONFIG.version}</div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        this.setupDebugEvents();
    }

    /**
     * Setup debug overlay event handlers
     */
    setupDebugEvents() {
        const debugOverlay = document.getElementById('debugOverlay');
        const dbgClear = document.getElementById('dbgClear');
        const dbgCopy = document.getElementById('dbgCopy');
        const dbgToggleSize = document.getElementById('dbgToggleSize');
        const dbgClose = document.getElementById('dbgClose');
        const dbgToggleSizeTop = document.getElementById('dbgToggleSizeTop');
        const dbgHideTop = document.getElementById('dbgHideTop');
        const dbgResetTop = document.getElementById('dbgResetTop');

        // Toggle size
        if (dbgToggleSize) {
            dbgToggleSize.addEventListener('click', (ev) => {
                ev.stopPropagation();
                debugOverlay.classList.toggle('minimized');
                dbgToggleSize.textContent = debugOverlay.classList.contains('minimized') ? '🔼' : '🔽';
            });
        }

        if (dbgToggleSizeTop) {
            dbgToggleSizeTop.addEventListener('click', () => {
                const debugList = document.getElementById('debugList');
                if (debugList.style.maxHeight === '120px') {
                    debugList.style.maxHeight = '40vh';
                    dbgToggleSizeTop.textContent = '🔽 حجم';
                } else {
                    debugList.style.maxHeight = '120px';
                    dbgToggleSizeTop.textContent = '🔼 حجم';
                }
            });
        }

        // Clear logs
        if (dbgClear) {
            dbgClear.addEventListener('click', () => {
                this.clearLogs();
            });
        }

        // Copy logs
        if (dbgCopy) {
            dbgCopy.addEventListener('click', async () => {
                await this.copyLogs();
            });
        }

        // Hide overlay
        if (dbgClose) {
            dbgClose.addEventListener('click', () => {
                debugOverlay.style.display = 'none';
            });
        }

        if (dbgHideTop) {
            dbgHideTop.addEventListener('click', () => {
                debugOverlay.style.display = debugOverlay.style.display === 'none' ? 'flex' : 'none';
            });
        }

        // Reset position
        if (dbgResetTop) {
            dbgResetTop.addEventListener('click', () => {
                debugOverlay.style.bottom = '12px';
                debugOverlay.style.left = '5vw';
                debugOverlay.style.width = (window.innerWidth < 600) ? '96vw' : '90vw';
                debugOverlay.style.maxWidth = '420px';
                debugOverlay.style.display = 'flex';
            });
        }

        // Click to restore when minimized
        debugOverlay.addEventListener('click', (ev) => {
            if (debugOverlay.classList.contains('minimized')) {
                debugOverlay.classList.remove('minimized');
                if (dbgToggleSize) dbgToggleSize.textContent = '🔽';
            }
        });
    }

    /**
     * Override console methods to capture logs
     */
    overrideConsoleMethods() {
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };

        // Override console.log
        console.log = (...args) => {
            this.log(args.map(arg => this.stringify(arg)).join(' '), this.levels.INFO);
            originalConsole.log.apply(console, args);
        };

        // Override console.warn
        console.warn = (...args) => {
            this.log(args.map(arg => this.stringify(arg)).join(' '), this.levels.WARN, new Error().stack);
            originalConsole.warn.apply(console, args);
        };

        // Override console.error
        console.error = (...args) => {
            this.log(args.map(arg => this.stringify(arg)).join(' '), this.levels.ERROR, new Error().stack);
            originalConsole.error.apply(console, args);
        };

        // Override console.info
        console.info = (...args) => {
            this.log(args.map(arg => this.stringify(arg)).join(' '), this.levels.INFO);
            originalConsole.info.apply(console, args);
        };
    }

    /**
     * Setup global error handlers
     */
    setupErrorHandlers() {
        // Window error handler
        window.addEventListener('error', (ev) => {
            this.log(
                `${ev.message || 'Unknown error'} (${ev.filename || 'unknown'}:${ev.lineno || 'unknown'})`,
                this.levels.ERROR,
                ev.error?.stack
            );
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (ev) => {
            this.log(
                `UnhandledRejection: ${ev.reason?.message || String(ev.reason || 'Unknown reason')}`,
                this.levels.ERROR,
                ev.reason?.stack
            );
        });

        // OpenCV loading errors
        window.addEventListener('error', (e) => {
            if (e.filename && e.filename.includes('opencv.js')) {
                this.log('فشل تحميل OpenCV', this.levels.ERROR);
            }
        });
    }

    /**
     * Add a log entry
     */
    log(message, level = this.levels.INFO, stack = null) {
        const timestamp = new Date();
        const entry = {
            timestamp,
            level,
            message: String(message).substring(0, 500),
            stack: stack ? String(stack).substring(0, 1000) : null
        };

        this.logs.unshift(entry);
        this.updateDebugDisplay(entry);

        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
            this.cleanupOldLogs();
        }

        this.updateSummary();
    }

    /**
     * Update debug display with new log entry
     */
    updateDebugDisplay(entry) {
        const debugList = document.getElementById('debugList');
        if (!debugList) return;

        const div = document.createElement('div');
        div.className = `dbg-item ${this.getLogLevelClass(entry.level)}`;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'dbg-time';
        timeSpan.textContent = `[${this.formatTime(entry.timestamp)}] ${entry.level.toUpperCase()}`;
        
        const msgDiv = document.createElement('div');
        msgDiv.textContent = entry.message;
        
        div.appendChild(timeSpan);
        div.appendChild(msgDiv);
        
        if (entry.stack && entry.level !== this.levels.INFO) {
            const metaDiv = document.createElement('div');
            metaDiv.className = 'dbg-meta';
            metaDiv.textContent = String(entry.stack).split('\n').slice(0, 2).join(' | ');
            div.appendChild(metaDiv);
        }

        debugList.prepend(div);

        // Auto-scroll if not minimized
        const debugOverlay = document.getElementById('debugOverlay');
        if (!debugOverlay.classList.contains('minimized')) {
            debugList.scrollTop = 0;
        }
    }

    /**
     * Get CSS class for log level
     */
    getLogLevelClass(level) {
        switch (level) {
            case this.levels.ERROR: return 'dbg-error';
            case this.levels.WARN: return 'dbg-warn';
            case this.levels.INFO: return 'dbg-info';
            default: return '';
        }
    }

    /**
     * Format timestamp for display
     */
    formatTime(date) {
        try {
            return date.toISOString().slice(11, 23);
        } catch {
            return '--:--:--';
        }
    }

    /**
     * Update debug summary
     */
    updateSummary() {
        const debugSummary = document.getElementById('debugSummary');
        if (debugSummary) {
            debugSummary.textContent = this.logs.length + ' سجلات';
        }
    }

    /**
     * Cleanup old log entries from display
     */
    cleanupOldLogs() {
        const debugList = document.getElementById('debugList');
        if (!debugList) return;

        const items = debugList.querySelectorAll('.dbg-item');
        if (items.length > this.maxLogs) {
            for (let i = items.length - 1; i >= this.maxLogs; i--) {
                items[i].remove();
            }
        }
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        const debugList = document.getElementById('debugList');
        if (debugList) {
            debugList.innerHTML = '';
        }
        this.updateSummary();
        this.log('تم مسح سجلات التصحيح', this.levels.INFO);
    }

    /**
     * Copy logs to clipboard
     */
    async copyLogs() {
        try {
            const text = this.logs.map(log => 
                `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}\n${log.stack || ''}`
            ).join('\n\n');
            
            await navigator.clipboard.writeText(text);
            this.log('تم نسخ السجل إلى الحافظة', this.levels.INFO);
        } catch (error) {
            this.log('فشل نسخ السجل: ' + error.message, this.levels.ERROR);
        }
    }

    /**
     * Stringify any value for logging
     */
    stringify(value) {
        try {
            if (value === null) return 'null';
            if (value === undefined) return 'undefined';
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return String(value);
        } catch {
            return '[Circular or Unserializable]';
        }
    }

    /**
     * Log performance metrics
     */
    logPerformance(name, startTime) {
        const duration = Date.now() - startTime;
        this.log(`${name} - ${duration}ms`, this.levels.INFO);
        return duration;
    }

    /**
     * Log memory usage
     */
    logMemoryUsage() {
        if (memoryManager) {
            const usage = memoryManager.getMemoryUsage();
            this.log(`الذاكرة: ${usage.trackedMats} مصفوفة, ${usage.activeMats} نشطة`, this.levels.INFO);
        }
    }

    /**
     * Log task manager status
     */
    logTaskManagerStatus() {
        if (taskManager) {
            const status = taskManager.getQueueStatus();
            this.log(`المهام: ${status.pending} معلقة, ${status.running} قيد التشغيل`, this.levels.INFO);
        }
    }

    /**
     * Log application state
     */
    logAppState() {
        const state = {
            cvReady: APP_STATE.cvReady,
            hasImage: !!APP_STATE.previewCanvas,
            hasContour: !!APP_STATE.contour,
            currentMachine: APP_STATE.currentMachine,
            currentColormap: APP_STATE.currentColormap,
            processing: APP_STATE.isProcessing
        };
        
        this.log(`حالة التطبيق: ${JSON.stringify(state)}`, this.levels.INFO);
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitor() {
        setInterval(() => {
            this.logMemoryUsage();
            this.logTaskManagerStatus();
        }, 30000); // Every 30 seconds
    }

    /**
     * Export logs as file
     */
    exportLogs() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cncai-debug-${timestamp}.log`;
        const content = this.logs.map(log => 
            `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');
        
        if (downloadTextAsFile(content, filename)) {
            this.log(`تم تصدير السجلات إلى ${filename}`, this.levels.INFO);
        } else {
            this.log('فشل تصدير السجلات', this.levels.ERROR);
        }
    }

    /**
     * Get debug statistics
     */
    getStats() {
        const levels = {};
        this.logs.forEach(log => {
            levels[log.level] = (levels[log.level] || 0) + 1;
        });

        return {
            totalLogs: this.logs.length,
            levels,
            firstLog: this.logs[this.logs.length - 1]?.timestamp,
            lastLog: this.logs[0]?.timestamp
        };
    }
}

// Create global instance
const debugSystem = new DebugSystem();

// Convenience functions
function debugLog(message, level = 'info') {
    debugSystem.log(message, level);
}

function debugError(message, stack = null) {
    debugSystem.log(message, 'error', stack);
}

function debugWarn(message, stack = null) {
    debugSystem.log(message, 'warn', stack);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DebugSystem, debugSystem, debugLog, debugError, debugWarn };
}
