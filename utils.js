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
 * Update dimension displays
 */
function updateDimensionDisplay() {
    try {
        // Update router dimensions
        const widthCm = parseFloat(document.getElementById('workWidth')?.value) || 0;
        const heightCm = parseFloat(document.getElementById('workHeight')?.value) || 0;
        
        const widthMmElem = document.getElementById('widthMm');
        const heightMmElem = document.getElementById('heightMm');
        
        if (widthMmElem) widthMmElem.textContent = cmToMm(widthCm).toFixed(1) + ' مم';
        if (heightMmElem) heightMmElem.textContent = cmToMm(heightCm).toFixed(1) + ' مم';
        
        // Update laser dimensions
        const laserWidthCm = parseFloat(document.getElementById('laserWorkWidth')?.value) || 0;
        const laserHeightCm = parseFloat(document.getElementById('laserWorkHeight')?.value) || 0;
        
        const laserWidthMmElem = document.getElementById('laserWidthMm');
        const laserHeightMmElem = document.getElementById('laserHeightMm');
        
        if (laserWidthMmElem) laserWidthMmElem.textContent = cmToMm(laserWidthCm).toFixed(1) + ' مم';
        if (laserHeightMmElem) laserHeightMmElem.textContent = cmToMm(laserHeightCm).toFixed(1) + ' مم';
        
        // Update 3D dimensions
        const threedWidthCm = parseFloat(document.getElementById('threedWorkWidth')?.value) || 0;
        const threedHeightCm = parseFloat(document.getElementById('threedWorkHeight')?.value) || 0;
        const threedDepth = parseFloat(document.getElementById('threedWorkDepth')?.value) || 0;
        
        const threedWidthMmElem = document.getElementById('threedWidthMm');
        const threedHeightMmElem = document.getElementById('threedHeightMm');
        const threedDepthMmElem = document.getElementById('threedDepthMm');
        
        if (threedWidthMmElem) threedWidthMmElem.textContent = cmToMm(threedWidthCm).toFixed(1) + ' مم';
        if (threedHeightMmElem) threedHeightMmElem.textContent = cmToMm(threedHeightCm).toFixed(1) + ' مم';
        if (threedDepthMmElem) threedDepthMmElem.textContent = threedDepth.toFixed(1) + ' مم';
    } catch (error) {
        console.error('فشل في تحديث عرض الأبعاد:', error);
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
        downloadTextAsFile,
        formatTime,
        debounce,
        isInViewport,
        generateId
    };
}
