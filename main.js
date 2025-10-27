// Main application initialization with improved OpenCV handling
class CNCApp {
    constructor() {
        this.initialized = false;
        this.modules = {};
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.log('Application already initialized');
            return;
        }

        console.log('بدء تهيئة تطبيق CNC AI...');
        showProgress('جاري تهيئة التطبيق...');

        try {
            // Initialize modules in sequence
            await this.initModules();
            
            this.initialized = true;
            console.log('✅ تم تهيئة التطبيق بنجاح');
            showToast('تم تحميل التطبيق بنجاح', 1200);
            
        } catch (error) {
            console.error('❌ فشل تهيئة التطبيق:', error);
            showToast('فشل تحميل التطبيق: ' + error.message, 5000);
        } finally {
            hideProgress();
        }
    }

    /**
     * Initialize all modules
     */
    async initModules() {
        // 1. Initialize UI first
        this.initUI();
        
        // 2. Initialize OpenCV (don't wait for it)
        this.initOpenCVAsync();
        
        // 3. Initialize other modules
        this.initEventListeners();
        this.init3DViewer();
        this.initDebugSystem();
        this.initAdvancedMachine();
        
        // 4. Wait for OpenCV (if needed later)
        await this.waitForOpenCVIfNeeded();
    }
/**
 * Initialize UI components
 */
initUI() {
    try {
        // Create tab contents
        this.createTabContents();
        
        // Create machine settings using UIManager
        uiManager.createMachineSettings();
        
        // Create file format buttons
        uiManager.createFileFormatButtons();
        
        // Create colormap buttons
        uiManager.createColormapButtons();
        
        // Update displays
        updateDimensionDisplay();
        
        console.log('✅ تم تهيئة واجهة المستخدم');
    } catch (error) {
        console.error('❌ فشل تهيئة واجهة المستخدم:', error);
        throw error;
    }
}

    /**
     * Initialize OpenCV asynchronously
     */
    initOpenCVAsync() {
        // Start OpenCV loading but don't wait for it
        openCVHandler.initOpenCV().then(success => {
            if (success) {
                console.log('✅ OpenCV loaded successfully');
            } else {
                console.error('❌ OpenCV failed to load');
            }
        }).catch(error => {
            console.error('❌ OpenCV loading error:', error);
        });
    }

    /**
     * Wait for OpenCV if needed for current operation
     */
    async waitForOpenCVIfNeeded() {
        // If user tries to process an image, we'll wait for OpenCV then
        // For now, just return
        return;
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        try {
            this.initFileInput();
            this.initTabBehavior();
            this.initMachineCategory();
            this.initControlElements();
            this.initButtons();
            this.initKeyboardShortcuts();
            
            console.log('✅ تم تهيئة مستمعي الأحداث');
        } catch (error) {
            console.error('❌ فشل تهيئة مستمعي الأحداث:', error);
        }
    }

    /**
     * Create tab contents dynamically
     */
    createTabContents() {
        const leftPanel = document.querySelector('.panel');
        if (!leftPanel) return;

        const tabContents = {
            'original': `
                <div class="tab-content active" id="original">
                    <div class="canvas-placeholder" id="originalPlaceholder">الصورة الأصلية ستظهر هنا</div>
                    <canvas id="canvasOriginal" style="display:none;"></canvas>
                </div>
            `,
            'heatmap': `
                <div class="tab-content" id="heatmap">
                    <div class="canvas-placeholder" id="heatmapPlaceholder">Heatmap ستظهر هنا</div>
                    <canvas id="canvasHeatmap" style="display:none;"></canvas>
                </div>
            `,
            'contour': `
                <div class="tab-content" id="contour">
                    <div class="canvas-placeholder" id="contourPlaceholder">Contours ستظهر هنا</div>
                    <canvas id="canvasContour" style="display:none;"></canvas>
                    <div class="small-meta">تبديل وضع كشف الحواف أو تحريك حساسية الحواف يحدث إعادة معالجة تلقائية</div>
                </div>
            `,
            'topview': `
                <div class="tab-content" id="topview">
                    <div id="topViewContainer">
                        <canvas id="topView"></canvas>
                        <div id="topLegend" title="عمق النقش — الألوان فقط"></div>
                    </div>
                    <div class="small-meta">معاينة من الأعلى للعمق المتوقع بعد تنفيذ G-code (الألوان تتبع اختيار Colormap)</div>
                </div>
            `,
            'threed': `
                <div class="tab-content" id="threed">
                    <div class="canvas-placeholder" id="threedPlaceholder">الموديل ثلاثي الأبعاد سيظهر هنا</div>
                    <div id="threeDContainer" style="display:none;">
                        <canvas id="canvas3D"></canvas>
                    </div>
                </div>
            `,
            'simulation': `
                <div class="tab-content" id="simulation">
                    <div id="threeContainer">
                        <div class="canvas-placeholder" id="simulationPlaceholder">المحاكاة ستظهر هنا بعد توليد G-code</div>
                    </div>
                </div>
            `,
            'vector2d': `
                <div class="tab-content" id="vector2d">
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <div class="canvas-placeholder" id="vectorPlaceholder">اسحب أو ارفع ملف SVG أو DXF هنا للمعاينة</div>
                        <canvas id="vectorCanvas" style="display:none;width:100%;height:420px;background:transparent;"></canvas>
                        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
                            <button id="vectorZoomIn" class="secondary">🔍+</button>
                            <button id="vectorZoomOut" class="secondary">🔍−</button>
                            <button id="vectorFit" class="secondary">🎯 ملء الشاشة</button>
                        </div>
                    </div>
                </div>
            `,
            'ai-analysis': `
                <div class="tab-content" id="ai-analysis">
                    <h2>🧠 تحليل الصورة المتقدم</h2>
                    <p>تحليل شامل للسطوع، التباين، الحدة، الملمس، كثافة الحواف وتوصيات الماكينة.</p>
                    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                        <button id="runAiAnalysis" class="action-btn">بدء التحليل</button>
                        <button id="aiApplyToMachine" class="action-btn" style="display:none">تطبيق التوصيات</button>
                        <button id="aiCopyResult" class="action-btn" style="display:none">نسخ النتائج</button>
                        <span id="aiStatus" style="margin-inline-start:8px;color:#9fb6c3"></span>
                    </div>
                    <div id="aiTableWrap" style="margin-top:12px;">
                        <table id="aiResultTable" style="width:100%;border-collapse:collapse;text-align:right">
                            <thead><tr style="text-align:right"><th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.04)">المؤشر</th><th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.04)">القيمة</th><th style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.04)">ملاحظة</th></tr></thead>
                            <tbody></tbody>
                        </table>
                    </div>
                    <img id="aiPreviewImage" class="preview-img" style="display:none;margin-top:12px" alt="صورة مصغرة"/>
                </div>
            `
        };

        // Add tab contents to left panel
        Object.values(tabContents).forEach(content => {
            leftPanel.insertAdjacentHTML('beforeend', content);
        });
    }

    // ... باقي الدوال سأكملها في الرد التالي
}

// Create global app instance
const cncApp = new CNCApp();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    cncApp.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CNCApp, cncApp };
}
