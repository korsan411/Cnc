// OpenCV Handler with improved loading and error handling
class OpenCVHandler {
    constructor() {
        this.isReady = false;
        this.loading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Initialize OpenCV with proper error handling
     */
    async initOpenCV() {
        if (this.isReady) {
            console.log('OpenCV is already ready');
            return true;
        }

        if (this.loading) {
            console.log('OpenCV is already loading...');
            await this.waitForOpenCV();
            return this.isReady;
        }

        this.loading = true;
        this.updateCVState('جاري تحميل OpenCV...');

        try {
            // Check if OpenCV is already loaded
            if (typeof cv !== 'undefined' && cv.getBuildInformation) {
                console.log('OpenCV already loaded');
                this.isReady = true;
                this.loading = false;
                this.updateCVState('✅ OpenCV جاهز');
                return true;
            }

            // Wait for OpenCV script to load
            await this.loadOpenCVScript();
            
            // Wait for OpenCV to initialize
            await this.waitForOpenCVInit();
            
            this.isReady = true;
            this.loading = false;
            this.updateCVState('✅ OpenCV جاهز');
            showToast('تم تحميل OpenCV بنجاح', 1400);
            
            console.log('OpenCV loaded successfully');
            return true;

        } catch (error) {
            console.error('Failed to load OpenCV:', error);
            this.loading = false;
            this.handleOpenCVError(error);
            return false;
        }
    }

    /**
     * Load OpenCV script dynamically
     */
    async loadOpenCVScript() {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector('script[src*="opencv.js"]')) {
                console.log('OpenCV script already exists');
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CONFIG.opencvUrl;
            script.async = true;
            
            script.onload = () => {
                console.log('OpenCV script loaded successfully');
                resolve();
            };
            
            script.onerror = (error) => {
                console.error('Failed to load OpenCV script:', error);
                reject(new Error('فشل تحميل ملف OpenCV'));
            };
            
            // Add to document
            document.head.appendChild(script);
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('انتهى وقت تحميل OpenCV'));
                }
            }, 30000);
        });
    }

    /**
     * Wait for OpenCV to initialize
     */
    async waitForOpenCVInit() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timeout = 30000; // 30 seconds
            
            const checkInterval = setInterval(() => {
                try {
                    // Multiple checks for OpenCV readiness
                    if (typeof cv !== 'undefined' && 
                        (cv.getBuildInformation || cv.imread || cv.Mat)) {
                        
                        // Additional test to ensure it's working
                        const testMat = new cv.Mat();
                        if (testMat && typeof testMat.delete === 'function') {
                            testMat.delete();
                            clearInterval(checkInterval);
                            resolve();
                            return;
                        }
                    }
                    
                    // Timeout check
                    if (Date.now() - startTime > timeout) {
                        clearInterval(checkInterval);
                        reject(new Error('انتهى وقت تهيئة OpenCV'));
                    }
                } catch (error) {
                    // Continue waiting if error occurs during test
                    console.warn('OpenCV test failed, continuing to wait...');
                }
            }, 100);
        });
    }

    /**
     * Wait for OpenCV if it's loading
     */
    async waitForOpenCV() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.isReady || !this.loading) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * Handle OpenCV loading errors
     */
    handleOpenCVError(error) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying OpenCV load (${this.retryCount}/${this.maxRetries})...`);
            this.updateCVState(`إعادة تحميل OpenCV (${this.retryCount}/${this.maxRetries})...`);
            
            setTimeout(() => {
                this.initOpenCV();
            }, 2000 * this.retryCount);
        } else {
            console.error('Max retries exceeded for OpenCV load');
            this.updateCVState('❌ فشل تحميل OpenCV');
            showToast('فشل تحميل OpenCV. تأكد من الاتصال بالإنترنت', 5000);
        }
    }

    /**
     * Update OpenCV status display
     */
    updateCVState(message) {
        try {
            const cvState = document.getElementById('cvState');
            if (cvState) {
                if (message.includes('جاهز') || message.includes('✅')) {
                    cvState.innerHTML = '✅ OpenCV جاهز';
                } else if (message.includes('فشل') || message.includes('❌')) {
                    cvState.innerHTML = '❌ فشل تحميل OpenCV';
                } else {
                    cvState.innerHTML = `
                        <span class="loading" style="display:inline-block;width:16px;height:16px;border:3px solid #f3f3f3;border-top:3px solid #06b6d4;border-radius:50%;animation:spin 1s linear infinite;margin-right:8px;"></span>
                        ${message}
                    `;
                }
            }
        } catch (error) {
            console.warn('Failed to update CV state:', error);
        }
    }

    /**
     * Check if OpenCV is ready
     */
    isOpenCVReady() {
        return this.isReady;
    }

    /**
     * Safe OpenCV operation with error handling
     */
    async safeCVOperation(operation, operationName = 'OpenCV operation') {
        if (!this.isReady) {
            await this.initOpenCV();
        }

        if (!this.isReady) {
            throw new Error('OpenCV غير جاهز');
        }

        try {
            return await operation();
        } catch (error) {
            console.error(`OpenCV operation failed (${operationName}):`, error);
            throw new Error(`فشل في ${operationName}: ${error.message}`);
        }
    }

    /**
     * Test OpenCV functionality
     */
    testOpenCV() {
        if (!this.isReady) {
            return false;
        }

        try {
            // Simple test to verify OpenCV is working
            const mat = new cv.Mat();
            if (mat && typeof mat.delete === 'function') {
                mat.delete();
                return true;
            }
            return false;
        } catch (error) {
            console.error('OpenCV test failed:', error);
            return false;
        }
    }

    /**
     * Load image using OpenCV
     */
    loadImage(canvas) {
        return this.safeCVOperation(() => {
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('Canvas غير صالح');
            }

            const src = cv.imread(canvas);
            if (src.empty()) {
                src.delete();
                throw new Error('فشل تحميل الصورة في OpenCV');
            }

            return src;
        }, 'تحميل الصورة');
    }

    /**
     * Convert image to grayscale
     */
    convertToGrayscale(src) {
        return this.safeCVOperation(() => {
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            return gray;
        }, 'تحويل إلى تدرج رمادي');
    }
}

// Create global instance
const openCVHandler = new OpenCVHandler();

// Global OpenCV ready check
function waitForOpenCV() {
    return openCVHandler.initOpenCV();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpenCVHandler, openCVHandler, waitForOpenCV };
}
