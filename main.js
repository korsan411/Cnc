// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('بدء تهيئة تطبيق CNC AI...');
    
    // تهيئة جميع المكونات
    initUI();
    initEventListeners();
    initOpenCV();
    init3DViewer();
    initDebugSystem();
    initAdvancedMachine();
    
    showToast('تم تحميل التطبيق بنجاح', 1200);
});

function initUI() {
    // تهيئة واجهة المستخدم
    createTabButtons();
    createMachineSettings();
    createFileFormatButtons();
    createColormapButtons();
    updateDimensionDisplay();
}

function initEventListeners() {
    // إعداد مستمعي الأحداث
    initFileInput();
    initTabBehavior();
    initMachineCategory();
    initControlElements();
    initButtons();
    initKeyboardShortcuts();
}

// باقي دوال التهيئة...
