// OpenCV Handler - FIXED VERSION
console.log('🔧 Loading opencv-handler.js...');

class OpenCVHandler {
    constructor() {
        this.isReady = false;
        this.loading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    async initOpenCV() {
        if (this.isReady) return true;
        if (this.loading) {
            await this.waitForOpenCV();
            return this.isReady;
        }

        this.loading = true;
        this.updateCVState('جاري تحميل OpenCV...');

        try {
            if (this.isOpenCVLoaded()) {
                this.markAsReady();
                return true;
            }

            await this.loadOpenCVScript();
            await this.waitForOpenCVInit();
            this.markAsReady();
            return true;

        } catch (error) {
            this.handleOpenCVError(error);
            return false;
        }
    }

    isOpenCVLoaded() {
        try {
            return typeof cv !== 'undefined' && cv.Mat && typeof cv.Mat === 'function';
        } catch {
            return false;
        }
    }

    async loadOpenCVScript() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="opencv.js"]')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = CONFIG.opencvUrl;
            script.async = true;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('فشل تحميل OpenCV'));
            
            document.head.appendChild(script);
            
            setTimeout(() => reject(new Error('انتهى وقت التحميل')), 30000);
        });
    }

    async waitForOpenCVInit() {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const maxTime = 30000;

            const check = () => {
                if (this.isOpenCVLoaded()) {
                    try {
                        const testMat = new cv.Mat();
                        testMat.delete();
                        resolve();
                    } catch {
                        setTimeout(check, 100);
                    }
                } else if (Date.now() - startTime > maxTime) {
                    reject(new Error('انتهى وقت التهيئة'));
                } else {
                    setTimeout(check, 100);
                }
            };

            check();
        });
    }

    async waitForOpenCV() {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (this.isReady || !this.loading) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }

    markAsReady() {
        this.isReady = true;
        this.loading = false;
        this.updateCVState('✅ OpenCV جاهز');
        showToast('تم تحميل OpenCV بنجاح');
    }

    handleOpenCVError(error) {
        this.loading = false;
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            const delay = 2000 * this.retryCount;
            this.updateCVState(`إعادة تحميل (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.initOpenCV(), delay);
        } else {
            this.updateCVState('❌ فشل تحميل OpenCV');
            showToast('فشل تحميل OpenCV. تحقق من الاتصال بالإنترنت');
        }
    }

    updateCVState(message) {
        try {
            const cvState = document.getElementById('cvState');
            if (!cvState) return;

            if (message.includes('جاهز')) {
                cvState.innerHTML = '✅ OpenCV جاهز';
            } else if (message.includes('فشل')) {
                cvState.innerHTML = '❌ فشل تحميل OpenCV';
            } else {
                cvState.innerHTML = `
                    <span class="loading"></span>
                    ${message}
                `;
            }
        } catch (error) {
            console.warn('CV state update error:', error);
        }
    }

    async safeCVOperation(operation, operationName = 'عملية') {
        if (!this.isReady) await this.initOpenCV();
        if (!this.isReady) throw new Error('OpenCV غير جاهز');
        
        try {
            return await operation();
        } catch (error) {
            console.error(`OpenCV error (${operationName}):`, error);
            throw error;
        }
    }
}

// Create global instance safely
if (typeof window.openCVHandler === 'undefined') {
    window.openCVHandler = new OpenCVHandler();
}

// Initialize after a delay
setTimeout(() => {
    openCVHandler.initOpenCV();
}, 2000);

console.log('✅ opencv-handler.js loaded successfully');
