// Memory Manager for OpenCV Mat cleanup
class MemoryManager {
    constructor() {
        this.mats = new Set();
        this.maxMats = 15;
        this.cleanupInterval = null;
    }

    /**
     * Track a matrix for automatic cleanup
     */
    track(mat, name = 'mat') {
        try {
            if (mat && !this.isMatDeleted(mat)) {
                this.mats.add({ mat, name, timestamp: Date.now() });
                
                // Cleanup if we exceed the limit
                if (this.mats.size > this.maxMats) {
                    this.cleanupOldest();
                }
            }
        } catch (error) {
            console.warn('Failed to track matrix:', error);
        }
    }

    /**
     * Check if matrix is already deleted
     */
    isMatDeleted(mat) {
        try {
            return !mat || typeof mat.delete !== 'function';
        } catch {
            return true;
        }
    }

    /**
     * Safely delete a matrix
     */
    safeDelete(mat, name = 'mat') {
        try {
            if (mat && typeof mat.delete === 'function') {
                if (!mat.isDeleted) {
                    mat.delete();
                    mat.isDeleted = true;
                    console.log(`🧹 تم حذف ${name} بأمان`);
                }
            }
        } catch (error) {
            console.warn(`⚠️ فشل في حذف المصفوفة (${name}):`, error);
        }
    }

    /**
     * Cleanup oldest matrices
     */
    cleanupOldest() {
        try {
            if (this.mats.size === 0) return;

            // Convert to array and sort by timestamp
            const matsArray = Array.from(this.mats);
            matsArray.sort((a, b) => a.timestamp - b.timestamp);

            // Remove oldest 20%
            const removeCount = Math.max(1, Math.floor(this.mats.size * 0.2));
            
            for (let i = 0; i < removeCount; i++) {
                const oldest = matsArray[i];
                if (oldest) {
                    this.safeDelete(oldest.mat, oldest.name);
                    this.mats.delete(oldest);
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup oldest matrices:', error);
        }
    }

    /**
     * Cleanup all tracked matrices
     */
    cleanupAll() {
        try {
            console.log(`🧹 تنظيف ${this.mats.size} مصفوفة...`);
            
            this.mats.forEach(item => {
                this.safeDelete(item.mat, item.name);
            });
            
            this.mats.clear();
            console.log('✅ تم تنظيف جميع المصفوفات');
        } catch (error) {
            console.warn('Failed to cleanup all matrices:', error);
        }
    }

    /**
     * Cleanup specific matrices used in image processing
     */
    cleanupImageProcessing() {
        try {
            // Clean grayMat
            if (APP_STATE.grayMat && !this.isMatDeleted(APP_STATE.grayMat)) {
                this.safeDelete(APP_STATE.grayMat, 'grayMat');
                APP_STATE.grayMat = null;
            }
            
            // Clean contour
            if (APP_STATE.contour && !this.isMatDeleted(APP_STATE.contour)) {
                this.safeDelete(APP_STATE.contour, 'contour');
                APP_STATE.contour = null;
            }
            
            // Clean additional contours
            APP_STATE.additionalContours.forEach(item => {
                if (item && item.contour && !this.isMatDeleted(item.contour)) {
                    this.safeDelete(item.contour, 'additionalContour');
                }
            });
            APP_STATE.additionalContours = [];
        } catch (error) {
            console.warn('Failed to cleanup image processing matrices:', error);
        }
    }

    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        return {
            totalTracked: this.mats.size,
            maxAllowed: this.maxMats
        };
    }

    /**
     * Start automatic cleanup interval
     */
    startAutoCleanup(intervalMs = 30000) {
        this.stopAutoCleanup();
        
        this.cleanupInterval = setInterval(() => {
            if (this.mats.size > this.maxMats * 0.8) {
                this.cleanupOldest();
            }
        }, intervalMs);
    }

    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// Create global instance
const memoryManager = new MemoryManager();

// Start auto cleanup
memoryManager.startAutoCleanup();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MemoryManager, memoryManager };
}
