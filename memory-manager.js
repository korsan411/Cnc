// Memory Manager for OpenCV - FIXED VERSION
console.log('🔧 Loading memory-manager.js...');

class MemoryManager {
    constructor() {
        this.mats = new Set();
        this.maxMats = 15;
        this.cleanupInterval = null;
        this.startAutoCleanup();
    }

    track(mat, name = 'mat') {
        try {
            if (mat && !this.isMatDeleted(mat)) {
                this.mats.add({ mat, name, timestamp: Date.now() });
                if (this.mats.size > this.maxMats) {
                    this.cleanupOldest();
                }
            }
        } catch (error) {
            console.warn('Track error:', error);
        }
    }

    isMatDeleted(mat) {
        try {
            return !mat || typeof mat.delete !== 'function';
        } catch {
            return true;
        }
    }

    safeDelete(mat, name = 'mat') {
        try {
            if (mat && typeof mat.delete === 'function' && !mat.isDeleted) {
                mat.delete();
                mat.isDeleted = true;
            }
        } catch (error) {
            console.warn('Delete error:', error);
        }
    }

    cleanupOldest() {
        try {
            if (this.mats.size === 0) return;
            const matsArray = Array.from(this.mats);
            matsArray.sort((a, b) => a.timestamp - b.timestamp);
            
            const removeCount = Math.max(1, Math.floor(this.mats.size * 0.2));
            for (let i = 0; i < removeCount; i++) {
                const oldest = matsArray[i];
                if (oldest) {
                    this.safeDelete(oldest.mat, oldest.name);
                    this.mats.delete(oldest);
                }
            }
        } catch (error) {
            console.warn('Cleanup error:', error);
        }
    }

    cleanupAll() {
        try {
            this.mats.forEach(item => this.safeDelete(item.mat, item.name));
            this.mats.clear();
        } catch (error) {
            console.warn('Cleanup all error:', error);
        }
    }

    startAutoCleanup(intervalMs = 30000) {
        this.stopAutoCleanup();
        this.cleanupInterval = setInterval(() => {
            if (this.mats.size > this.maxMats * 0.8) {
                this.cleanupOldest();
            }
        }, intervalMs);
    }

    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Create global instance safely
if (typeof window.memoryManager === 'undefined') {
    window.memoryManager = new MemoryManager();
}

console.log('✅ memory-manager.js loaded successfully');
