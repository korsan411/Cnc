/**
 * Edge detection utilities for CNC AI application
 */
class EdgeDetector {
    constructor() {
        this.edgeSensitivityTimer = null;
    }

    /**
     * Initialize edge detection event listeners
     */
    init() {
        this.initEdgeSensitivity();
        this.initEdgeMode();
        this.initLaserEdgeMode();
    }

    /**
     * Initialize edge sensitivity controls
     */
    initEdgeSensitivity() {
        const edgeSensitivity = document.getElementById('edgeSensitivity');
        if (!edgeSensitivity) return;

        edgeSensitivity.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value).toFixed(2);
            const display = document.getElementById('edgeValue');
            if (display) {
                display.textContent = value;
            }
            
            if (!APP_STATE.previewCanvas || APP_STATE.isProcessing) return;
            
            const isLaser = document.getElementById('machineCategory').value === 'laser';
            if (!isLaser && APP_STATE.cvReady && APP_STATE.previewCanvas.width > 0) {
                clearTimeout(this.edgeSensitivityTimer);
                this.edgeSensitivityTimer = setTimeout(() => {
                    taskManager.addTask(detectContours, 'تحديث حساسية الحواف');
                }, 300);
            }
        });
    }

    /**
     * Initialize edge mode controls
     */
    initEdgeMode() {
        const edgeMode = document.getElementById('edgeMode');
        if (!edgeMode) return;

        edgeMode.addEventListener('change', () => {
            if (!APP_STATE.previewCanvas || APP_STATE.isProcessing) return;
            
            const isLaser = document.getElementById('machineCategory').value === 'laser';
            if (!isLaser && APP_STATE.cvReady && APP_STATE.previewCanvas.width > 0) {
                taskManager.addTask(detectContours, 'تحديث كشف الحواف');
            }
        });
    }

    /**
     * Initialize laser edge mode controls
     */
    initLaserEdgeMode() {
        const laserEdgeMode = document.getElementById('laserEdgeMode');
        if (!laserEdgeMode) return;

        // Laser edge mode descriptions
        const laserModeDescriptions = {
            canny: 'Canny - كشف حواف تقليدي مناسب للصور العامة',
            adaptive: 'Adaptive Threshold - ممتاز للصور ذات الإضاءة غير المتجانسة',
            morphological: 'Morphological - للحواف الدقيقة والناعمة والتفاصيل الصغيرة',
            gradient: 'Gradient-Based - للتدرجات اللونية والصور ذات التباين العالي'
        };

        laserEdgeMode.addEventListener('change', (e) => {
            const desc = document.getElementById('laserModeDesc');
            if (desc) {
                desc.textContent = laserModeDescriptions[e.target.value] || '';
            }
            
            if (!APP_STATE.previewCanvas || APP_STATE.isProcessing) return;
            
            const isLaser = document.getElementById('machineCategory').value === 'laser';
            if (isLaser && APP_STATE.cvReady && APP_STATE.previewCanvas && APP_STATE.previewCanvas.width > 0) {
                taskManager.addTask(detectLaserContours, 'تحديث كشف حواف الليزر');
            }
        });
    }

    /**
     * Detect contours for router (standard edge detection)
     */
    async detectContours() {
        if (!APP_STATE.cvReady) {
            throw new Error('OpenCV غير جاهز بعد');
        }
        
        InputValidator.validateImageReady();
        
        let src = null, gray = null, blurred = null, edges = null, hierarchy = null, contours = null, kernel = null;
        
        try {
            src = opencvHandler.imreadSafe(APP_STATE.previewCanvas, 'src');
            
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            memoryManager.track(gray, 'gray');
            
            blurred = new cv.Mat();
            cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
            memoryManager.track(blurred, 'blurred');

            // Get edge detection parameters
            const mode = document.getElementById('edgeMode').value || 'auto';
            const sens = parseFloat(document.getElementById('edgeSensitivity').value) || 0.33;

            const median = cv.mean(blurred)[0];
            const lowerThreshold = Math.max(0, (1.0 - sens) * median);
            const upperThreshold = Math.min(255, (1.0 + sens) * median);

            edges = new cv.Mat();
            memoryManager.track(edges, 'edges');
            
            // Apply selected edge detection method
            if (mode === 'sobel') {
                const gradX = new cv.Mat(), gradY = new cv.Mat();
                cv.Sobel(blurred, gradX, cv.CV_16S, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
                cv.Sobel(blurred, gradY, cv.CV_16S, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);
                cv.convertScaleAbs(gradX, gradX);
                cv.convertScaleAbs(gradY, gradY);
                cv.addWeighted(gradX, 0.5, gradY, 0.5, 0, edges);
                memoryManager.safeDelete(gradX);
                memoryManager.safeDelete(gradY);
            } else if (mode === 'laplace') {
                cv.Laplacian(blurred, edges, cv.CV_16S, 3, 1, 0, cv.BORDER_DEFAULT);
                cv.convertScaleAbs(edges, edges);
            } else {
                cv.Canny(blurred, edges, lowerThreshold, upperThreshold);
            }

            // Improve edges
            kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
            cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
            memoryManager.track(kernel, 'kernel');

            // Find contours
            contours = new cv.MatVector();
            hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            memoryManager.track(contours, 'contours');
            memoryManager.track(hierarchy, 'hierarchy');

            // Filter contours by area
            const minArea = (gray.cols * gray.rows) * 0.01;
            const validContours = [];
            for (let i = 0; i < contours.size(); i++) {
                const cnt = contours.get(i);
                const area = cv.contourArea(cnt);
                if (area > minArea) {
                    validContours.push({ contour: cnt, area });
                } else {
                    memoryManager.safeDelete(cnt);
                }
            }

            if (validContours.length > 0) {
                validContours.sort((a, b) => b.area - a.area);
                APP_STATE.contour = validContours[0].contour;
                APP_STATE.additionalContours = validContours.slice(1).map(v => ({ 
                    contour: v.contour, 
                    area: v.area 
                }));
                showToast(`تم كشف ${validContours.length} كونتور`);
            } else {
                throw new Error('لم يتم العثور على حواف واضحة في الصورة');
            }

            // Store grayscale image for later use
            if (APP_STATE.grayMat) { 
                memoryManager.safeDelete(APP_STATE.grayMat);
            }
            APP_STATE.grayMat = gray.clone();
            memoryManager.track(APP_STATE.grayMat, 'grayMat');

            // Render visualizations
            renderHeatmap();
            renderContour(gray, APP_STATE.contour);

        } catch (err) {
            console.error('خطأ في كشف الحواف:', err);
            throw new Error('فشل في تحليل الصورة: ' + err.message);
        } finally {
            // Cleanup temporary matrices
            [src, blurred, edges, hierarchy, contours, kernel].forEach(mat => {
                if (mat !== APP_STATE.grayMat) {
                    memoryManager.safeDelete(mat);
                }
            });
        }
    }

    /**
     * Detect contours for laser engraving
     */
    async detectLaserContours() {
        if (!APP_STATE.cvReady) {
            throw new Error('OpenCV غير جاهز بعد');
        }
        
        InputValidator.validateImageReady();
        
        let src = null, gray = null, edges = null, hierarchy = null, contours = null;
        
        try {
            src = opencvHandler.imreadSafe(APP_STATE.previewCanvas, 'src');
            
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            memoryManager.track(gray, 'gray');
            
            const mode = document.getElementById('laserEdgeMode').value || 'adaptive';
            const detailLevel = parseInt(document.getElementById('laserDetail').value) || 5;
            
            edges = new cv.Mat();
            memoryManager.track(edges, 'edges');
            
            // Apply selected laser edge detection method
            if (mode === 'adaptive') {
                const adaptive = new cv.Mat();
                const blockSize = Math.max(3, 2 * Math.floor(detailLevel) + 1);
                cv.adaptiveThreshold(gray, adaptive, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, 2);
                memoryManager.track(adaptive, 'adaptive');
                
                const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
                cv.morphologyEx(adaptive, edges, cv.MORPH_CLOSE, kernel);
                memoryManager.track(kernel, 'kernel');
                
                memoryManager.safeDelete(adaptive);
                memoryManager.safeDelete(kernel);
                
            } else if (mode === 'morphological') {
                const blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
                memoryManager.track(blurred, 'blurred');
                
                const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3));
                const dilated = new cv.Mat();
                const eroded = new cv.Mat();
                
                cv.dilate(blurred, dilated, kernel);
                cv.erode(blurred, eroded, kernel);
                cv.subtract(dilated, eroded, edges);
                
                cv.normalize(edges, edges, 0, 255, cv.NORM_MINMAX);
                
                memoryManager.safeDelete(blurred);
                memoryManager.safeDelete(kernel);
                memoryManager.safeDelete(dilated);
                memoryManager.safeDelete(eroded);
                
            } else if (mode === 'gradient') {
                const blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
                memoryManager.track(blurred, 'blurred');
                
                const gradX = new cv.Mat();
                const gradY = new cv.Mat();
                const absGradX = new cv.Mat();
                const absGradY = new cv.Mat();
                
                cv.Sobel(blurred, gradX, cv.CV_16S, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT);
                cv.Sobel(blurred, gradY, cv.CV_16S, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT);
                
                cv.convertScaleAbs(gradX, absGradX);
                cv.convertScaleAbs(gradY, absGradY);
                cv.addWeighted(absGradX, 0.5, absGradY, 0.5, 0, edges);
                
                const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(2, 2));
                cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
                memoryManager.track(kernel, 'kernel');
                
                memoryManager.safeDelete(blurred);
                memoryManager.safeDelete(gradX);
                memoryManager.safeDelete(gradY);
                memoryManager.safeDelete(absGradX);
                memoryManager.safeDelete(absGradY);
                memoryManager.safeDelete(kernel);
                
            } else {
                const blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
                cv.Canny(blurred, edges, 50, 150);
                memoryManager.safeDelete(blurred);
            }

            // Apply detail level adjustments
            if (detailLevel > 5) {
                const kernelSize = Math.min(3, Math.floor(detailLevel / 3));
                const kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(kernelSize, kernelSize));
                cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
                memoryManager.safeDelete(kernel);
            }

            // Find contours
            contours = new cv.MatVector();
            hierarchy = new cv.Mat();
            cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
            memoryManager.track(contours, 'contours');
            memoryManager.track(hierarchy, 'hierarchy');

            // Filter contours by area
            const minArea = (gray.cols * gray.rows) * 0.002;
            const validContours = [];
            
            for (let i = 0; i < contours.size(); i++) {
                const cnt = contours.get(i);
                const area = cv.contourArea(cnt);
                if (area > minArea) {
                    validContours.push({ contour: cnt, area });
                } else {
                    memoryManager.safeDelete(cnt);
                }
            }

            if (validContours.length > 0) {
                validContours.sort((a, b) => b.area - a.area);
                APP_STATE.contour = validContours[0].contour;
                APP_STATE.additionalContours = validContours.slice(1).map(v => ({ 
                    contour: v.contour, 
                    area: v.area 
                }));
                showToast(`تم كشف ${validContours.length} كونتور للليزر`);
            } else {
                throw new Error('لم يتم العثور على حواف مناسبة للليزر');
            }

            // Store grayscale image for later use
            if (APP_STATE.grayMat) { 
                memoryManager.safeDelete(APP_STATE.grayMat);
            }
            APP_STATE.grayMat = gray.clone();
            memoryManager.track(APP_STATE.grayMat, 'grayMat');

            // Render visualizations
            renderHeatmap();
            renderContour(gray, APP_STATE.contour);

        } catch (err) {
            console.error('خطأ في كشف حواف الليزر:', err);
            throw new Error('فشل في تحليل الصورة للليزر: ' + err.message);
        } finally {
            // Cleanup temporary matrices
            [src, gray, edges, hierarchy, contours].forEach(mat => {
                if (mat !== APP_STATE.grayMat) {
                    memoryManager.safeDelete(mat);
                }
            });
        }
    }

    /**
     * Get edge detection statistics
     */
    getEdgeStats(edges) {
        try {
            const stats = cv.meanStdDev(edges);
            return {
                mean: stats.mean.data64F ? stats.mean.data64F[0] : stats.mean.data[0],
                stddev: stats.stddev.data64F ? stats.stddev.data64F[0] : stats.stddev.data[0],
                nonZero: cv.countNonZero(edges)
            };
        } catch (error) {
            console.error('خطأ في حساب إحصائيات الحواف:', error);
            return { mean: 0, stddev: 0, nonZero: 0 };
        }
    }
}

// Create global instance
const edgeDetector = new EdgeDetector();

// Global functions for backward compatibility
async function detectContours() {
    return edgeDetector.detectContours();
}

async function detectLaserContours() {
    return edgeDetector.detectLaserContours();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        EdgeDetector, 
        edgeDetector,
        detectContours,
        detectLaserContours
    };
}
