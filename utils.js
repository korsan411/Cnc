// Utility functions for CNC AI

// Make sure functions are defined in global scope
window.showToast = function(msg, ms = 3000) {
    try {
        const t = document.getElementById('toast');
        if (!t) {
            console.warn('Toast element not found');
            return;
        }
        
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
};

window.cmToMm = function(cm) { 
    const result = parseFloat(cm) * 10;
    return isNaN(result) ? 0 : result;
};

window.mmToCm = function(mm) { 
    const result = parseFloat(mm) / 10;
    return isNaN(result) ? 0 : result;
};

window.showProgress = function(message = 'جاري المعالجة...') {
    try {
        const progressText = document.getElementById('progressText');
        const progressOverlay = document.getElementById('progressOverlay');
        
        if (progressText) progressText.textContent = message;
        if (progressOverlay) progressOverlay.style.display = 'flex';
    } catch (error) {
        console.warn('فشل في عرض التقدم:', error);
    }
};

window.hideProgress = function() {
    try {
        const progressOverlay = document.getElementById('progressOverlay');
        if (progressOverlay) progressOverlay.style.display = 'none';
    } catch (error) {
        console.warn('فشل في إخفاء التقدم:', error);
    }
};

window.clamp = function(v, a = 0, b = 1) { 
    return Math.max(a, Math.min(b, v)); 
};

window.showElement = function(elementId, hidePlaceholderId) {
    try {
        const element = document.getElementById(elementId);
        const placeholder = document.getElementById(hidePlaceholderId);
        
        if (element) element.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    } catch (error) {
        console.error('فشل في إظهار العنصر:', error);
    }
};

window.hideElement = function(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (element) element.style.display = 'none';
    } catch (error) {
        console.error('فشل في إخفاء العنصر:', error);
    }
};

// FIXED: updateDimensionDisplay function
window.updateDimensionDisplay = function() {
    try {
        console.log('🔄 Updating dimension displays...');
        
        // Helper function to update a single dimension
        const updateDimension = (cmInputId, mmDisplayId, type = 'router') => {
            const cmInput = document.getElementById(cmInputId);
            const mmDisplay = document.getElementById(mmDisplayId);
            
            if (cmInput && mmDisplay) {
                const cmValue = parseFloat(cmInput.value) || 0;
                const mmValue = cmToMm(cmValue);
                mmDisplay.textContent = mmValue.toFixed(1) + ' مم';
                console.log(`${type} ${cmInputId}: ${cmValue}cm → ${mmValue}mm`);
            } else {
                console.log(`⚠️ Elements not found: ${cmInputId} or ${mmDisplayId}`);
            }
        };

        // Update router dimensions
        updateDimension('workWidth', 'widthMm', 'Router');
        updateDimension('workHeight', 'heightMm', 'Router');

        // Update laser dimensions
        updateDimension('laserWorkWidth', 'laserWidthMm', 'Laser');
        updateDimension('laserWorkHeight', 'laserHeightMm', 'Laser');

        // Update 3D dimensions
        updateDimension('threedWorkWidth', 'threedWidthMm', '3D');
        updateDimension('threedWorkHeight', 'threedHeightMm', '3D');
        
        // Update 3D depth separately (it's already in mm)
        const threedDepthInput = document.getElementById('threedWorkDepth');
        const threedDepthDisplay = document.getElementById('threedDepthMm');
        if (threedDepthInput && threedDepthDisplay) {
            const depthValue = parseFloat(threedDepthInput.value) || 0;
            threedDepthDisplay.textContent = depthValue.toFixed(1) + ' مم';
            console.log(`3D Depth: ${depthValue}mm`);
        }

        console.log('✅ تم تحديث جميع عروض الأبعاد');
        
    } catch (error) {
        console.error('❌ فشل في تحديث عرض الأبعاد:', error);
    }
};

// Initialize dimension listeners
window.initDimensionListeners = function() {
    try {
        console.log('🔧 Initializing dimension listeners...');
        
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
                    console.log(`📝 Input changed: ${id}`);
                    clearTimeout(updateTimeout);
                    updateTimeout = setTimeout(updateDimensionDisplay, 100);
                });
                console.log(`✅ Added listener for: ${id}`);
            } else {
                console.log(`⚠️ Element not found: ${id}`);
            }
        });

        // Also update when machine category changes
        const machineCategory = document.getElementById('machineCategory');
        if (machineCategory) {
            machineCategory.addEventListener('change', () => {
                console.log('🔄 Machine category changed, updating dimensions...');
                updateDimensionDisplay();
            });
        }

        console.log('✅ تم تهيئة مستمعي الأبعاد');
    } catch (error) {
        console.error('❌ فشل تهيئة مستمعي الأبعاد:', error);
    }
};

// Initialize all utilities
window.initUtils = function() {
    try {
        console.log('🚀 Initializing utilities...');
        
        // Initialize dimension listeners
        initDimensionListeners();
        
        // Initial dimension update after a short delay
        setTimeout(() => {
            console.log('🕒 Performing initial dimension update...');
            updateDimensionDisplay();
        }, 1000);
        
        console.log('✅ تم تهيئة الأدوات المساعدة');
    } catch (error) {
        console.error('❌ فشل تهيئة الأدوات المساعدة:', error);
    }
};

// Other utility functions
window.downloadTextAsFile = function(text, filename) {
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
};

window.formatTime = function(minutes) {
    if (minutes < 1) {
        return Math.round(minutes * 60) + ' ثانية';
    } else if (minutes < 60) {
        return minutes.toFixed(1) + ' دقيقة';
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return hours + ' ساعة ' + mins + ' دقيقة';
    }
};

window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

window.isInViewport = function(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
};

window.generateId = function() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
};

window.getElement = function(id, required = false) {
    const element = document.getElementById(id);
    if (!element && required) {
        console.warn(`⚠️ Required element not found: ${id}`);
    }
    return element;
};

// Log that utils.js has loaded
console.log('✅ utils.js loaded successfully');
