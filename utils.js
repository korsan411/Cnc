// Utility functions for CNC AI - FIXED VERSION
console.log('🔧 Loading utils.js...');

// Safe function definition helper
function defineGlobal(name, fn) {
    if (typeof window[name] === 'undefined') {
        window[name] = fn;
    }
}

// Define all utility functions safely
defineGlobal('showToast', function(msg, ms = 3000) {
    try {
        const t = document.getElementById('toast');
        if (!t) {
            console.warn('Toast element not found');
            return;
        }
        
        t.textContent = String(msg).substring(0, 200);
        t.style.display = 'block';
        clearTimeout(t._t);
        t._t = setTimeout(() => t.style.display = 'none', ms);
        console.log('Toast:', msg);
    } catch (e) {
        console.error('Toast error:', e);
    }
});

defineGlobal('cmToMm', function(cm) {
    return (parseFloat(cm) || 0) * 10;
});

defineGlobal('mmToCm', function(mm) {
    return (parseFloat(mm) || 0) / 10;
});

defineGlobal('clamp', function(v, a = 0, b = 1) {
    return Math.max(a, Math.min(b, v));
});

defineGlobal('showProgress', function(message = 'جاري المعالجة...') {
    const text = document.getElementById('progressText');
    const overlay = document.getElementById('progressOverlay');
    if (text) text.textContent = message;
    if (overlay) overlay.style.display = 'flex';
});

defineGlobal('hideProgress', function() {
    const overlay = document.getElementById('progressOverlay');
    if (overlay) overlay.style.display = 'none';
});

defineGlobal('showElement', function(elementId, hidePlaceholderId) {
    const element = document.getElementById(elementId);
    const placeholder = document.getElementById(hidePlaceholderId);
    if (element) element.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
});

defineGlobal('hideElement', function(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
});

// Fixed dimension display with better error handling
defineGlobal('updateDimensionDisplay', function() {
    try {
        const updates = [
            { cmId: 'workWidth', mmId: 'widthMm' },
            { cmId: 'workHeight', mmId: 'heightMm' },
            { cmId: 'laserWorkWidth', mmId: 'laserWidthMm' },
            { cmId: 'laserWorkHeight', mmId: 'laserHeightMm' },
            { cmId: 'threedWorkWidth', mmId: 'threedWidthMm' },
            { cmId: 'threedWorkHeight', mmId: 'threedHeightMm' }
        ];

        updates.forEach(({ cmId, mmId }) => {
            const cmInput = document.getElementById(cmId);
            const mmDisplay = document.getElementById(mmId);
            if (cmInput && mmDisplay) {
                const cmValue = parseFloat(cmInput.value) || 0;
                mmDisplay.textContent = cmToMm(cmValue).toFixed(1) + ' مم';
            }
        });

        // Handle 3D depth separately
        const depthInput = document.getElementById('threedWorkDepth');
        const depthDisplay = document.getElementById('threedDepthMm');
        if (depthInput && depthDisplay) {
            depthDisplay.textContent = (parseFloat(depthInput.value) || 0).toFixed(1) + ' مم';
        }

    } catch (error) {
        console.error('Dimension update error:', error);
    }
});

defineGlobal('initDimensionListeners', function() {
    try {
        const inputs = ['workWidth', 'workHeight', 'laserWorkWidth', 'laserWorkHeight', 
                       'threedWorkWidth', 'threedWorkHeight', 'threedWorkDepth'];
        
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    setTimeout(updateDimensionDisplay, 100);
                });
            }
        });

        const machineSelect = document.getElementById('machineCategory');
        if (machineSelect) {
            machineSelect.addEventListener('change', updateDimensionDisplay);
        }

    } catch (error) {
        console.error('Dimension listeners error:', error);
    }
});

defineGlobal('initUtils', function() {
    console.log('🛠️ Initializing utilities...');
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDimensionListeners);
    } else {
        setTimeout(initDimensionListeners, 100);
    }
    setTimeout(updateDimensionDisplay, 500);
});

console.log('✅ utils.js loaded successfully');
