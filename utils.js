// Utility functions
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

function cmToMm(cm) { 
    const result = parseFloat(cm) * 10;
    return isNaN(result) ? 0 : result;
}

function mmToCm(mm) { 
    const result = parseFloat(mm) / 10;
    return isNaN(result) ? 0 : result;
}

function showProgress(message = 'جاري المعالجة...') {
    try {
        document.getElementById('progressText').textContent = message;
        document.getElementById('progressOverlay').style.display = 'flex';
    } catch (error) {
        console.warn('فشل في عرض التقدم:', error);
    }
}

function hideProgress() {
    try {
        document.getElementById('progressOverlay').style.display = 'none';
    } catch (error) {
        console.warn('فشل في إخفاء التقدم:', error);
    }
}

function clamp(v, a = 0, b = 1) { 
    return Math.max(a, Math.min(b, v)); 
}

// باقي الدوال المساعدة...
