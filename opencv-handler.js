/**
 * OpenCV initialization and readiness handler
 */
class OpenCVHandler {
    constructor() {
        this.isReady = false;
        this.loadAttempts = 0;
        this.maxAttempts = 10;
        this.loadCallbacks = [];
    }

    /**
     * Initialize OpenCV and wait for it to be ready
     */
    async init() {
        return new Promise((resolve, reject) => {
            if (this.isReady) {
                resolve();
                return;
            }

            const checkOpenCV = () => {
                this.loadAttempts++;
                
                try {
                    if (typeof cv !== 'undefined' && this.testOpenCV()) {
                        this.isReady = true;
                        APP_STATE.cvReady = true;
                        this.onReady();
                        resolve();
                        return;
                    }
                } catch (error) {
                    console.warn(`محاولة تحميل OpenCV ${this.loadAttempts} فشلت:`, error);
                }

                if (this.loadAttempts >= this.maxAttempts) {
                    reject(new Error('فشل تحميل OpenCV بعد عدة محاولات'));
                    return;
                }

                setTimeout(checkOpenCV, 500);
            };

            // Start checking
            setTimeout(checkOpenCV, 1000);
        });
    }

    /**
     * Test if OpenCV is fully functional
     */
    testOpenCV() {
        try {
            // Test basic OpenCV functionality
            if (!cv.getBuildInformation && !cv.imread && !cv.Mat) {
                return false;
            }

            // Test matrix operations
            const testMat = new cv.Mat();
            if (!testMat || typeof testMat.delete !== 'function') {
                return false;
            }
            
            // Test if we can create and delete a matrix
            testMat.delete();
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Called when OpenCV is ready
     */
    onReady() {
        // Update UI
        const cvState = document.getElementById('cvState');
        if (cvState) {
            cvState.innerHTML = '✅ OpenCV جاهز';
        }
        
        showToast('تم تحميل OpenCV بنجاح', 1400);
        console.log('OpenCV loaded successfully');

        // Execute any pending callbacks
        this.loadCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('خطأ في معالج استدعاء OpenCV:', error);
            }
        });
        
        this.loadCallbacks = [];
    }

    /**
     * Register callback for when OpenCV is ready
     */
    onLoad(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.loadCallbacks.push(callback);
        }
    }

    /**
     * Check if OpenCV is ready
     */
    isOpenCVReady() {
        return this.isReady;
    }

    /**
     * Safe image reading with error handling
     */
    imreadSafe(canvas, name = 'image') {
        try {
            if (!this.isReady) {
                throw new Error('OpenCV غير جاهز');
            }

            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('الكانفاس غير صالح');
            }

            const mat = cv.imread(canvas);
            memoryManager.track(mat, name);

            if (mat.empty()) {
                memoryManager.safeDelete(mat);
                throw new Error('فشل قراءة الصورة');
            }

            return mat;
        } catch (error) {
            console.error(`فشل في قراءة الصورة (${name}):`, error);
            throw error;
        }
    }

    /**
     * Convert canvas to grayscale Mat
     */
    canvasToGray(canvas) {
        try {
            const src = this.imreadSafe(canvas, 'src');
            const gray = new cv.Mat();
            
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            memoryManager.track(gray, 'gray');
            
            memoryManager.safeDelete(src);
            return gray;
        } catch (error) {
            console.error('فشل في تحويل الصورة إلى تدرج الرمادي:', error);
            throw error;
        }
    }

    /**
     * Apply Gaussian blur to Mat
     */
    gaussianBlur(mat, kernelSize = 5) {
        try {
            const blurred = new cv.Mat();
            const size = new cv.Size(kernelSize, kernelSize);
            
            cv.GaussianBlur(mat, blurred, size, 0);
            memoryManager.track(blurred, 'blurred');
            
            return blurred;
        } catch (error) {
            console.error('فشل في تطبيق الضبابية:', error);
            throw error;
        }
    }

    /**
     * Display Mat on canvas
     */
    imshow(canvasId, mat) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`الكانفاس غير موجود: ${canvasId}`);
            }

            canvas.width = mat.cols;
            canvas.height = mat.rows;
            
            cv.imshow(canvasId, mat);
            return true;
        } catch (error) {
            console.error(`فشل في عرض الصورة على ${canvasId}:`, error);
            return false;
        }
    }

    /**
     * Get image statistics
     */
    getImageStats(mat) {
        try {
            const mean = new cv.Mat();
            const stddev = new cv.Mat();
            
            cv.meanStdDev(mat, mean, stddev);
            
            const stats = {
                mean: mean.data64F ? mean.data64F[0] : mean.data[0],
                stddev: stddev.data64F ? stddev.data64F[0] : stddev.data[0],
                min: null,
                max: null
            };
            
            memoryManager.safeDelete(mean);
            memoryManager.safeDelete(stddev);
            
            return stats;
        } catch (error) {
            console.error('فشل في الحصول على إحصائيات الصورة:', error);
            return { mean: 0, stddev: 0, min: 0, max: 0 };
        }
    }
}

// Create global instance
const opencvHandler = new OpenCVHandler();

// Wait for OpenCV to be ready
function waitForCv() {
    return opencvHandler.init();
}

// Add error handler for OpenCV loading
window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('opencv.js')) {
        const cvState = document.getElementById('cvState');
        if (cvState) {
            cvState.innerHTML = '❌ فشل تحميل OpenCV';
        }
        showToast('فشل في تحميل OpenCV. تأكد من الاتصال بالإنترنت', 5000);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpenCVHandler, opencvHandler, waitForCv };
}
