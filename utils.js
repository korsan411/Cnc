// utils.js - نسخة مبسطة للتأكد من العمل
console.log('🔧 تحميل الأدوات المساعدة...');

try {
    // Utility functions for CNC AI
    function showToast(msg, ms = 3000) {
        try {
            let toast = document.getElementById('toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast';
                toast.style.cssText = `
                    position: fixed;
                    right: 20px;
                    bottom: 20px;
                    background: rgba(0, 0, 0, 0.9);
                    color: #fff;
                    padding: 12px 16px;
                    border-radius: 10px;
                    display: none;
                    z-index: 10000;
                `;
                document.body.appendChild(toast);
            }
            
            toast.textContent = String(msg).substring(0, 200);
            toast.style.display = 'block';
            clearTimeout(toast._t);
            toast._t = setTimeout(() => {
                toast.style.display = 'none';
            }, ms);
            
            console.log('Toast: ' + msg);
        } catch (e) {
            console.log('Toast: ' + msg); // Fallback to console
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
            let overlay = document.getElementById('progressOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'progressOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 30000;
                    flex-direction: column;
                    gap: 20px;
                `;
                
                const spinner = document.createElement('div');
                spinner.style.cssText = `
                    width: 60px;
                    height: 60px;
                    border: 5px solid rgba(243, 243, 243, 0.2);
                    border-top: 5px solid #06b6d4;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                `;
                
                const text = document.createElement('div');
                text.id = 'progressText';
                text.style.cssText = `
                    color: white;
                    font-size: 1.1rem;
                    font-weight: 500;
                `;
                
                overlay.appendChild(spinner);
                overlay.appendChild(text);
                document.body.appendChild(overlay);
                
                // إضافة animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes spin { 
                        0% { transform: rotate(0); } 
                        100% { transform: rotate(360deg); } 
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.getElementById('progressText').textContent = message;
            overlay.style.display = 'flex';
        } catch (error) {
            console.log('Progress: ' + message);
        }
    }

    function hideProgress() {
        try {
            const overlay = document.getElementById('progressOverlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        } catch (error) {
            // ignore
        }
    }

    // جعل الدوال عالمية
    window.showToast = showToast;
    window.cmToMm = cmToMm;
    window.mmToCm = mmToCm;
    window.showProgress = showProgress;
    window.hideProgress = hideProgress;

    console.log('✅ تم تحميل الأدوات المساعدة بنجاح');
    showToast('تم تحميل الأدوات الأساسية!');

} catch (error) {
    console.error('❌ خطأ في تحميل utils.js:', error);
}
