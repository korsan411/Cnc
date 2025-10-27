// Utility functions for CNC AI

/**
 * Display toast notification
 */
function showToast(msg, ms = 3000) {
    try {
        const t = document.getElementById('toast');
        if (!t) return;
        
        t.textContent = String(msg).substring(0, 200);
        t.style.display = 'block';
        clearTimeout(t._t);
        t._t = setTimeout(() => {
            if (t) t.style.display = 'none';
        }, ms);
        
        console.log('Toast: ' + msg);
    } catch (e) {
        console.error('فشل في عرض الإشعار:', e);
    }
}

/**
 * Convert centimeters to millimeters
 */
function cmToMm(cm) { 
    const result = parseFloat(cm) * 10;
    return isNaN(result) ? 0 : result;
}

/**
 * Convert millimeters to centimeters
 */
function mmToCm(mm) { 
    const result = parseFloat(mm) / 10;
    return isNaN(result) ? 0 : result;
}

/**
 * Show progress overlay
 */
function showProgress(message = 'جاري المعالجة...') {
    try {
        document.getElementById('progressText').textContent = message;
        document.getElementById('progressOverlay').style.display = 'flex';
    } catch (error) {
        console.warn('فشل في عرض التقدم:', error);
    }
}

/**
 * Hide progress overlay
 */
function hideProgress() {
    try {
        document.getElementById('progressOverlay').style.display = 'none';
    } catch (error) {
        console.warn('فشل في إخفاء التقدم:', error);
    }
}

/**
 * Clamp value between min and max
 */
function clamp(v, a = 0, b = 1) { 
    return Math.max(a, Math.min(b, v)); 
}

/**
 * Show/hide element with placeholder
 */
function showElement(elementId, hidePlaceholderId) {
    try {
        const element = document.getElementById(elementId);
        const placeholder = document.getElementById(hidePlaceholderId);
        
        if (element) {
            element.style.display = 'block';
        }
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    } catch (error) {
        console.error('فشل في إظهار العنصر:', error);
    }
}

/**
 * Hide element
 */
function hideElement(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    } catch (error) {
        console.error('فشل في إخفاء العنصر:', error);
    }
}

/**
 * Update dimension displays - FIXED VERSION
 */
function updateDimensionDisplay() {
    try {
        console.log('Updating dimension displays...');
        
        // Update router dimensions
        const updateRouterDimensions = () => {
            const workWidth = document.getElementById('workWidth');
            const workHeight = document.getElementById('workHeight');
            const widthMmElem = document.getElementById('widthMm');
            const heightMmElem = document.getElementById('heightMm');
            
            if (workWidth && widthMmElem) {
                const widthCm = parseFloat(workWidth.value) || 0;
                widthMmElem.textContent = cmToMm(widthCm).toFixed(1) + ' مم';
                console.log(`Router Width: ${widthCm}cm -> ${cmToMm(widthCm).toFixed(1)}mm`);
            }
            
            if (workHeight && heightMmElem) {
                const heightCm = parseFloat(workHeight.value) || 0;
                heightMmElem.textContent = cmToMm(heightCm).toFixed(1) + ' مم';
                console.log(`Router Height: ${heightCm}cm -> ${cmToMm(heightCm).toFixed(1)}mm`);
            }
        };

        // Update laser dimensions
        const updateLaserDimensions = () => {
            const laserWorkWidth = document.getElementById('laserWorkWidth');
            const laserWorkHeight = document.getElementById('laserWorkHeight');
            const laserWidthMmElem = document.getElementById('laserWidthMm');
            const laserHeightMmElem = document.getElementById('laserHeightMm');
            
            if (laserWorkWidth && laserWidthMmElem) {
                const widthCm = parseFloat(laserWorkWidth.value) || 0;
                laserWidthMmElem.textContent = cmToMm(widthCm).toFixed(1) + ' مم';
                console.log(`Laser Width: ${widthCm}cm -> ${cmToMm(widthCm).toFixed(1)}mm`);
            }
            
            if (laserWorkHeight && laserHeightMmElem) {
                const heightCm = parseFloat(laserWorkHeight.value) || 0;
                laserHeightMmElem.textContent = cmToMm(heightCm).toFixed(1) + ' مم';
                console.log(`Laser Height: ${heightCm}cm -> ${cmToMm(heightCm).toFixed(1)}mm`);
            }
        };

        // Update 3D dimensions
        const update3DDimensions = () => {
            const threedWorkWidth = document.getElementById('threedWorkWidth');
            const threedWorkHeight = document.getElementById('threedWorkHeight');
            const threedWorkDepth = document.getElementById('threedWorkDepth');
            const threedWidthMmElem = document.getElementById('threedWidthMm');
            const threedHeightMmElem = document.getElementById('threedHeightMm');
            const threedDepthMmElem = document.getElementById('threedDepthMm');
            
            if (threedWorkWidth && threedWidthMmElem) {
                const widthCm = parseFloat(threedWorkWidth.value) || 0;
                threedWidthMmElem.textContent = cmToMm(widthCm).toFixed(1) + ' مم';
                console.log(`3D Width: ${widthCm}cm -> ${cmToMm(widthCm).toFixed(1)}mm`);
            }
            
            if (threedWorkHeight && threedHeightMmElem) {
                const heightCm = parseFloat(threedWorkHeight.value) || 0;
                threedHeightMmElem.textContent = cmToMm(heightCm).toFixed(1) + ' مم';
                console.log(`3D Height: ${heightCm}cm -> ${cmToMm(heightCm).toFixed(1)}mm`);
            }
            
            if (threedWorkDepth && threedDepthMmElem) {
                const depth = parseFloat(threedWorkDepth.value) || 0;
                threedDepthMmElem.textContent = depth.toFixed(1) + ' مم';
                console.log(`3D Depth: ${depth}mm`);
            }
        };

        // Update all dimension types
        updateRouterDimensions();
        updateLaserDimensions();
        update3DDimensions();
        
        console.log('✅ تم تحديث جميع عروض الأبعاد');
        
    } catch (error) {
        console.error('❌ فشل في تحديث عرض الأبعاد:', error);
    }
}

/**
 * Initialize dimension listeners
 */
function initDimensionListeners() {
    try {
        console.log('Initializing dimension listeners...');
        
        const dimensionInputs = [
            'workWidth', 'workHeight',
            'laserWorkWidth', 'laserWorkHeight', 
            'threedWorkWidth', 'threedWorkHeight', 'threedWorkDepth'
        ];

        let updateTimeout;

        dimensionInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    clearTimeout(updateTimeout);
                    updateTimeout = setTimeout(updateDimensionDisplay, 200);
                });
                console.log(`✅ Added listener for: ${id}`);
            } else {
                console.log(`⚠️ Element not found: ${id}`);
            }
        });

        // Also update when machine category changes
        const machineCategory = document.getElementById('machineCategory');
        if (machineCategory) {
            machineCategory.addEventListener('change', updateDimensionDisplay);
        }

        console.log('✅ تم تهيئة مستمعي الأبعاد');
    } catch (error) {
        console.error('❌ فشل تهيئة مستمعي الأبعاد:', error);
    }
}

/**
 * Download text as file
 */
function downloadTextAsFile(text, filename) {
    try {
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = filename; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('خطأ في تحميل الملف:', error);
        return false;
    }
}

/**
 * Format time in minutes
 */
function formatTime(minutes) {
    if (minutes < 1) {
        return Math.round(minutes * 60) + ' ثانية';
    } else if (minutes < 60) {
        return minutes.toFixed(1) + ' دقيقة';
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return hours + ' ساعة ' + mins + ' دقيقة';
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Safe element getter with logging
 */
function getElement(id, required = false) {
    const element = document.getElementById(id);
    if (!element && required) {
        console.warn(`⚠️ Required element not found: ${id}`);
    }
    return element;
}

/**
 * Initialize all utility functions
 */
function initUtils() {
    try {
        // Initialize dimension listeners
        initDimensionListeners();
        
        // Initial dimension update
        setTimeout(updateDimensionDisplay, 500);
        
        console.log('✅ تم تهيئة الأدوات المساعدة');
    } catch (error) {
        console.error('❌ فشل تهيئة الأدوات المساعدة:', error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        cmToMm,
        mmToCm,
        showProgress,
        hideProgress,
        clamp,
        showElement,
        hideElement,
        updateDimensionDisplay,
        initDimensionListeners,
        initUtils,
        downloadTextAsFile,
        formatTime,
        debounce,
        isInViewport,
        generateId,
        getElement
    };
}
