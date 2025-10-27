// instant-check.js - ضع هذا الملف في نفس المجلد
console.log('🔍 بدء الفحص الفوري لتطبيق CNC AI...');

// فحص سريع للملفات الأساسية
const essentialFiles = [
    'config.js', 'utils.js', 'memory-manager.js', 'task-manager.js', 
    'ui-manager.js', 'main.js'
];

let loadedFiles = 0;
let failedFiles = 0;

essentialFiles.forEach(file => {
    const script = document.createElement('script');
    script.src = file;
    script.onload = () => {
        loadedFiles++;
        console.log(`✅ ${file} - محمل بنجاح`);
        updateLoadingStatus();
    };
    script.onerror = () => {
        failedFiles++;
        console.error(`❌ ${file} - فشل التحميل`);
        updateLoadingStatus();
    };
    document.head.appendChild(script);
});

function updateLoadingStatus() {
    const total = essentialFiles.length;
    const status = `📊 ${loadedFiles}/${total} ملف محمل - ${failedFiles} فشل`;
    
    console.log(status);
    
    // تحديث واجهة المستخدم إذا أمكن
    const statusElement = document.getElementById('loadingStatus') || document.getElementById('cvState');
    if (statusElement) {
        statusElement.innerHTML = status;
    }
    
    if (loadedFiles + failedFiles === total) {
        if (failedFiles === 0) {
            console.log('🎉 جميع الملفات محملة بنجاح!');
        } else {
            console.error(`❌ ${failedFiles} ملف فشل في التحميل`);
        }
    }
}

// فحص المتغيرات العالمية بعد التحميل
setTimeout(() => {
    console.log('=== فحص المتغيرات العالمية ===');
    console.log('CONFIG:', typeof CONFIG !== 'undefined' ? '✅ محمل' : '❌ غير محمل');
    console.log('APP_STATE:', typeof APP_STATE !== 'undefined' ? '✅ محمل' : '❌ غير محمل');
    console.log('memoryManager:', typeof memoryManager !== 'undefined' ? '✅ محمل' : '❌ غير محمل');
    console.log('taskManager:', typeof taskManager !== 'undefined' ? '✅ محمل' : '❌ غير محمل');
    console.log('uiManager:', typeof uiManager !== 'undefined' ? '✅ محمل' : '❌ غير محمل');
    console.log('cncApp:', typeof cncApp !== 'undefined' ? '✅ محمل' : '❌ غير محمل');
}, 3000);
