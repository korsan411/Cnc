// Edge Detector for CNC AI
class EdgeDetector {
    constructor() {
        this.currentEdges = null;
        this.currentContours = null;
    }

    /**
     * Detect contours for router
     */
    async detectContours() {
        try {
            console.log('🔍 Detecting contours for router...');
            
            // Check prerequisites
            if (!this.checkPrerequisites()) {
                return;
            }

            showProgress('جاري كشف الحواف...');

            const result = await openCVHandler.safeCVOperation(async () => {
                let src = null, gray = null, blurred = null, edges = null, hierarchy = null, contours = null, kernel = null;

                try {
                    // Load image
                    src = await openCVHandler.loadImage(APP_STATE.previewCanvas);
                    
                    // Convert to grayscale
                    gray = await openCVHandler.convertToGrayscale(src);
                    
                    // Apply Gaussian blur
                    blurred = new cv.Mat();
                    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
                    memoryManager.track(blurred, 'blurred');

                    // Get edge detection parameters
                    const mode = document.getElementById('edgeMode').value || 'auto';
                    const sens = parseFloat(document.getElementById('edgeSensitivity').value) || 0.33;

                    // Calculate thresholds based on sensitivity
                    const median = cv.mean(blurred)[0];
                    const lowerThreshold = Math.max(0, (1.0 - sens) * median);
                    const upperThreshold = Math.min(255, (1.0 + sens) * median);

                    console.log(`Edge detection - Mode: ${mode}, Sensitivity: ${sens}, Thresholds: ${lowerThreshold}-${upperThreshold}`);

                    // Apply edge detection based on mode
                    edges = new cv.Mat();
                    memoryManager.track(edges, 'edges');

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

                    // Improve edges with morphology
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
                    const minArea = (gray.rows * gray.cols) * 0.01; // 1% of image area
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

                    if (validContours.length === 0) {
                        throw new Error('لم يتم العثور على حواف واضحة في الصورة');
                    }

                    // Sort by area and store
                    validContours.sort((a, b) => b.area - a.area);
                    
                    // Clean up previous contours
                    this.cleanupPreviousContours();
                    
                    // Store new contours
                    APP_STATE.contour = validContours[0].contour;
                    APP_STATE.additionalContours = validContours.slice(1);
                    
                    // Store grayscale image for heatmap
                    if (APP_STATE.grayMat) {
                        memoryManager.safeDelete(APP_STATE.grayMat);
                    }
                    APP_STATE.grayMat = gray.clone();
                    memoryManager.track(APP_STATE.grayMat, 'grayMat');

                    console.log(`✅ Found ${validContours.length} contours`);
                    showToast(`تم كشف ${validContours.length} كونتور`);

                    // Render results
                    this.renderResults();

                    return {
                        contours: validContours,
                        edges: edges
                    };

                } finally {
                    // Cleanup temporary mats (except gray which is stored)
                    [src, blurred, edges, hierarchy, contours, kernel].forEach(mat => {
                        if (mat !== gray) { // Don't delete gray as it's stored
                            memoryManager.safeDelete(mat);
                        }
                    });
                }
            }, 'كشف الحواف');

            return result;

        } catch (error) {
            console.error('❌ Failed to detect contours:', error);
            showToast('فشل كشف الحواف: ' + error.message, 4000);
            throw error;
        } finally {
            hideProgress();
        }
    }

    /**
     * Detect contours for laser
     */
    async detectLaserContours() {
        try {
            console.log('🔍 Detecting contours for laser...');
            
            // Check prerequisites
            if (!this.checkPrerequisites()) {
                return;
            }

            showProgress('جاري كشف حواف الليزر...');

            const result = await openCVHandler.safeCVOperation(async () => {
                let src = null, gray = null, edges = null, hierarchy = null, contours = null;

                try {
                    // Load image
                    src = await openCVHandler.loadImage(APP_STATE.previewCanvas);
                    
                    // Convert to grayscale
                    gray = await openCVHandler.convertToGrayscale(src);
                    
                    // Get laser parameters
                    const mode = document.getElementById('laserEdgeMode').value || 'adaptive';
                    const detailLevel = parseInt(document.getElementById('laserDetail').value) || 5;

                    console.log(`Laser edge detection - Mode: ${mode}, Detail: ${detailLevel}`);

                    // Apply edge detection based on laser mode
                    edges = new cv.Mat();
                    memoryManager.track(edges, 'edges');

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
                        // Canny mode
                        const blurred = new cv.Mat();
                        cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0);
                        cv.Canny(blurred, edges, 50, 150);
                        memoryManager.safeDelete(blurred);
                    }

                    // Apply detail enhancement
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
                    const minArea = (gray.rows * gray.cols) * 0.002;
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

                    if (validContours.length === 0) {
                        throw new Error('لم يتم العثور على حواف مناسبة للليزر');
                    }

                    // Sort by area and store
                    validContours.sort((a, b) => b.area - a.area);
                    
                    // Clean up previous contours
                    this.cleanupPreviousContours();
                    
                    // Store new contours
                    APP_STATE.contour = validContours[0].contour;
                    APP_STATE.additionalContours = validContours.slice(1);
                    
                    // Store grayscale image for heatmap
                    if (APP_STATE.grayMat) {
                        memoryManager.safeDelete(APP_STATE.grayMat);
                    }
                    APP_STATE.grayMat = gray.clone();
                    memoryManager.track(APP_STATE.grayMat, 'grayMat');

                    console.log(`✅ Found ${validContours.length} laser contours`);
                    showToast(`تم كشف ${validContours.length} كونتور للليزر`);

                    // Render results
                    this.renderResults();

                    return {
                        contours: validContours,
                        edges: edges
                    };

                } finally {
                    // Cleanup temporary mats (except gray which is stored)
                    [src, edges, hierarchy, contours].forEach(mat => {
                        if (mat !== gray) { // Don't delete gray as it's stored
                            memoryManager.safeDelete(mat);
                        }
                    });
                }
            }, 'كشف حواف الليزر');

            return result;

        } catch (error) {
            console.error('❌ Failed to detect laser contours:', error);
            showToast('فشل كشف حواف الليزر: ' + error.message, 4000);
            throw error;
        } finally {
            hideProgress();
        }
    }

    /**
     * Check prerequisites for edge detection
     */
    checkPrerequisites() {
        // Check if OpenCV is ready
        if (!openCVHandler.isReady) {
            showToast('OpenCV غير جاهز بعد. يرجى الانتظار...');
            return false;
        }

        // Check if image is loaded
        if (!APP_STATE.previewCanvas || APP_STATE.previewCanvas.width === 0) {
            showToast('لا توجد صورة محملة');
            return false;
        }

        return true;
    }

    /**
     * Cleanup previous contours
     */
    cleanupPreviousContours() {
        if (APP_STATE.contour) {
            memoryManager.safeDelete(APP_STATE.contour);
            APP_STATE.contour = null;
        }

        APP_STATE.additionalContours.forEach(item => {
            if (item && item.contour) {
                memoryManager.safeDelete(item.contour);
            }
        });
        APP_STATE.additionalContours = [];
    }

    /**
     * Render detection results
     */
    renderResults() {
        try {
            // Render heatmap
            if (typeof colormapManager !== 'undefined') {
                colormapManager.renderHeatmap();
            } else {
                this.renderHeatmapFallback();
            }

            // Render contours
            this.renderContours();

            // Update UI to show results are available
            this.updateResultsUI();

        } catch (error) {
            console.error('❌ Failed to render results:', error);
        }
    }

    /**
     * Fallback heatmap renderer
     */
    renderHeatmapFallback() {
        try {
            if (!APP_STATE.grayMat || !APP_STATE.previewCanvas) return;
            
            const heatCanvas = document.getElementById('canvasHeatmap');
            if (!heatCanvas) return;
            
            const ctx = heatCanvas.getContext('2d');
            if (!ctx) return;
            
            heatCanvas.width = APP_STATE.grayMat.cols;
            heatCanvas.height = APP_STATE.grayMat.rows;
            
            const imgData = ctx.createImageData(heatCanvas.width, heatCanvas.height);
            const data = APP_STATE.grayMat.data;
            
            for (let i = 0; i < data.length; i++) {
                const value = data[i];
                const t = value / 255.0;
                const col = this.getColormapColor(t, APP_STATE.currentColormap || 'jet');
                const idx = i * 4;
                imgData.data[idx] = col.r;
                imgData.data[idx + 1] = col.g;
                imgData.data[idx + 2] = col.b;
                imgData.data[idx + 3] = 255;
            }
            
            ctx.putImageData(imgData, 0, 0);
            showElement('canvasHeatmap', 'heatmapPlaceholder');

        } catch (error) {
            console.error('❌ Failed to render heatmap fallback:', error);
        }
    }

    /**
     * Render contours on canvas
     */
    renderContours() {
        try {
            if (!APP_STATE.grayMat || !APP_STATE.contour) return;
            
            const contourCanvas = document.getElementById('canvasContour');
            if (!contourCanvas) return;
            
            const ctx = contourCanvas.getContext('2d');
            if (!ctx) return;
            
            contourCanvas.width = APP_STATE.grayMat.cols;
            contourCanvas.height = APP_STATE.grayMat.rows;
            
            // Draw heatmap background
            const heatCanvas = document.getElementById('canvasHeatmap');
            if (heatCanvas) {
                ctx.drawImage(heatCanvas, 0, 0);
            } else {
                ctx.fillStyle = '#222';
                ctx.fillRect(0, 0, contourCanvas.width, contourCanvas.height);
            }
            
            // Draw main contour
            if (APP_STATE.contour) {
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const data = APP_STATE.contour.data32S;
                for (let i = 0; i < data.length; i += 2) {
                    const x = data[i], y = data[i + 1];
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }
            
            // Draw additional contours
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1;
            APP_STATE.additionalContours.forEach(ci => {
                try {
                    const cnt = ci.contour;
                    if (!cnt) return;
                    
                    ctx.beginPath();
                    const d = cnt.data32S;
                    for (let i = 0; i < d.length; i += 2) {
                        const x = d[i], y = d[i+1];
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                } catch(e) { 
                    console.warn('خطأ في عرض الكنتور الإضافي:', e); 
                }
            });
            
            showElement('canvasContour', 'contourPlaceholder');

        } catch (error) {
            console.error('❌ Failed to render contours:', error);
        }
    }

    /**
     * Get colormap color (fallback)
     */
    getColormapColor(t, map) {
        t = clamp(t);
        if (map === 'hot') {
            if (t < 0.33) return { r: Math.round(t/0.33*128), g: 0, b: 0 };
            if (t < 0.66) return { r: Math.round(128 + (t-0.33)/0.33*127), g: Math.round((t-0.33)/0.33*128), b: 0 };
            return { r: 255, g: Math.round(128 + (t-0.66)/0.34*127), b: Math.round((t-0.66)/0.34*127) };
        } else if (map === 'cool') {
            return { r: Math.round(255 * t), g: Math.round(255 * (1 - t)), b: 255 };
        } else if (map === 'gray') {
            const v = Math.round(255 * t);
            return { r: v, g: v, b: v };
        } else {
            // jet-like approximation
            const r = Math.round(255 * clamp(1.5 - Math.abs(1.0 - 4.0*(t-0.5)), 0, 1));
            const g = Math.round(255 * clamp(1.5 - Math.abs(0.5 - 4.0*(t-0.25)), 0, 1));
            const b = Math.round(255 * clamp(1.5 - Math.abs(0.5 - 4.0*(t)), 0, 1));
            return { r, g, b };
        }
    }

    /**
     * Update UI to show results are available
     */
    updateResultsUI() {
        // Switch to heatmap tab if not already there
        const currentTab = document.querySelector('.tab-content.active');
        if (currentTab && currentTab.id === 'original') {
            const heatmapTab = document.querySelector('[data-tab="heatmap"]');
            if (heatmapTab) {
                setTimeout(() => {
                    heatmapTab.click();
                }, 500);
            }
        }

        // Update tab indicators
        if (typeof fileHandler !== 'undefined') {
            fileHandler.updateTabIndicators();
        }
    }

    /**
     * Get current contours
     */
    getContours() {
        return {
            main: APP_STATE.contour,
            additional: APP_STATE.additionalContours
        };
    }

    /**
     * Check if contours are available
     */
    hasContours() {
        return APP_STATE.contour !== null && APP_STATE.additionalContours.length > 0;
    }
}

// Create global instance
const edgeDetector = new EdgeDetector();

// Global functions for other modules
window.detectContours = function() {
    return edgeDetector.detectContours();
};

window.detectLaserContours = function() {
    return edgeDetector.detectLaserContours();
};

window.getContours = function() {
    return edgeDetector.getContours();
};

window.hasContours = function() {
    return edgeDetector.hasContours();
};

console.log('✅ Edge Detector module loaded');
