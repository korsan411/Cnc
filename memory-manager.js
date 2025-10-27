/**
 * Memory Manager for OpenCV Mat objects
 * Prevents memory leaks and manages OpenCV resources
 */
class MemoryManager {
    constructor() {
        this.mats = new Set();
        this.maxMats = 15;
        this.totalAllocated = 0;
        this.totalFreed = 0;
    }

    /**
     * Track a Mat object for automatic cleanup
     */
    track(mat, name = 'unnamed') {
        try {
            if (mat && !this.isMatDeleted(mat)) {
                this.mats.add({ mat, name, created: Date.now() });
                this.totalAllocated++;
                
                // Cleanup if we exceed the limit
                if (this.mats.size > this.maxMats) {
                    this.cleanupOldest();
                }
            }
        } catch (error) {
            console.warn('فشل في تتبع المصفوفة:', error);
        }
    }

    /**
     * Check if a Mat is already deleted
     */
    isMatDeleted(mat) {
        try {
            return !mat || typeof mat.delete !== 'function' || mat.isDeleted;
        } catch {
            return true;
        }
    }

    /**
     * Safely delete a Mat object
     */
    safeDelete(mat, name = 'mat') {
        try {
            if (mat && typeof mat.delete === 'function') {
                if (!mat.isDeleted) {
                    mat.delete();
                    mat.isDeleted = true;
                    this.totalFreed++;
                    console.log(`🧹 تم حذف ${name} بأمان`);
                }
            }
        } catch (error) {
            console.warn(`⚠️ فشل في حذف المصفوفة (${name}):`, error);
        }
    }

    /**
     * Cleanup oldest Mat object
     */
    cleanupOldest() {
        try {
            if (this.mats.size > 0) {
                const oldest = Array.from(this.mats).reduce((oldest, current) => {
                    return current.created < oldest.created ? current : oldest;
                });
                
                this.safeDelete(oldest.mat, oldest.name);
                this.mats.delete(oldest);
            }
        } catch (error) {
            console.warn('فشل في تنظيف أقدم مصفوفة:', error);
        }
    }

    /**
     * Cleanup all tracked Mat objects
     */
    cleanupAll() {
        try {
            this.mats.forEach(({ mat, name }) => {
                this.safeDelete(mat, name);
            });
            this.mats.clear();
        } catch (error) {
            console.warn('فشل في التنظيف الكامل:', error);
        }
    }

    /**
     * Cleanup specific Mats used in image processing
     */
    cleanupMats() {
        try {
            if (APP_STATE.grayMat && !this.isMatDeleted(APP_STATE.grayMat)) { 
                this.safeDelete(APP_STATE.grayMat, 'grayMat');
                APP_STATE.grayMat = null; 
            }
        } catch (error) { 
            console.warn('فشل في تنظيف grayMat:', error); 
        }
        
        try {
            if (APP_STATE.contour && !this.isMatDeleted(APP_STATE.contour)) {
                this.safeDelete(APP_STATE.contour, 'contour');
                APP_STATE.contour = null;
            }
        } catch (error) { 
            console.warn('فشل في تنظيف contour:', error); 
        }
        
        try {
            APP_STATE.additionalContours.forEach(item => {
                if (item && item.contour && !this.isMatDeleted(item.contour)) {
                    this.safeDelete(item.contour, 'additionalContour');
                }
            });
            APP_STATE.additionalContours = [];
        } catch (error) { 
            console.warn('فشل في تنظيف additionalContours:', error); 
        }
    }

    /**
     * Get memory usage statistics
     */
    getMemoryUsage() {
        return {
            trackedMats: this.mats.size,
            totalAllocated: this.totalAllocated,
            totalFreed: this.totalFreed,
            activeMats: this.totalAllocated - this.totalFreed
        };
    }

    /**
     * Log memory usage
     */
    logMemoryUsage() {
        const usage = this.getMemoryUsage();
        console.log(`🧠 استخدام الذاكرة: ${usage.trackedMats} مصفوفة نشطة, ${usage.activeMats} إجمالي النشطة`);
    }

    /**
     * Force garbage collection (where supported)
     */
    forceGarbageCollection() {
        try {
            if (global.gc) {
                global.gc();
            } else if (window.gc) {
                window.gc();
            }
        } catch (e) {
            // GC not available
        }
    }
}

// Create global instance
const memoryManager = new MemoryManager();

// Safe delete helper function
function safeDelete(mat) {
    memoryManager.safeDelete(mat);
}

// Patch cv.Mat.prototype.delete for automatic tracking
(function() {
    try {
        if (typeof cv !== 'undefined' && cv && cv.Mat && cv.Mat.prototype && !cv.Mat.prototype.__safePatched) {
            const originalDelete = cv.Mat.prototype.delete;
            cv.Mat.prototype.delete = function() {
                try {
                    if (!this.isDeleted) {
                        originalDelete.call(this);
                        this.isDeleted = true;
                    }
                } catch (error) {
                    console.warn('فشل في حذف المصفوفة:', error);
                }
            };
            cv.Mat.prototype.__safePatched = true;
        }
    } catch (error) {
