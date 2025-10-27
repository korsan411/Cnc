// Main application initialization
class CNCApp {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.log('Application already initialized');
            return;
        }

        console.log('🚀 بدء تهيئة تطبيق CNC AI...');
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
        console.log('🔧 Initializing modules...');
        
        // 1. Initialize utilities first
        console.log('1. Initializing utilities...');
        if (typeof initUtils === 'function') {
            initUtils();
        } else {
            console.error('❌ initUtils is not defined!');
        }
        
        // 2. Initialize UI
        console.log('2. Initializing UI...');
        this.initUI();
        
        // 3. Initialize OpenCV (don't wait for it)
        console.log('3. Initializing OpenCV...');
        this.initOpenCVAsync();
        
        // 4. Initialize other modules
        console.log('4. Initializing other modules...');
        this.initEventListeners();
        
        // 5. Test dimension display
        console.log('5. Testing dimension display...');
        setTimeout(() => {
            if (typeof updateDimensionDisplay === 'function') {
                console.log('🔄 Testing dimension display function...');
                updateDimensionDisplay();
            } else {
                console.error('❌ updateDimensionDisplay is not defined!');
            }
        }, 2000);
    }

    /**
     * Initialize UI components
     */
    initUI() {
        try {
            console.log('🎨 Initializing UI components...');
            
            // Create tab contents
            this.createTabContents();
            
            // Create machine settings using UIManager
            if (typeof uiManager !== 'undefined') {
                uiManager.createMachineSettings();
            } else {
                console.error('❌ UIManager not available');
            }
            
            // Create file format buttons
            if (typeof uiManager !== 'undefined') {
                uiManager.createFileFormatButtons();
                uiManager.createColormapButtons();
            }
            
            // Test dimension display
            setTimeout(() => {
                if (typeof updateDimensionDisplay === 'function') {
                    console.log('🔄 Calling updateDimensionDisplay from UI init...');
                    updateDimensionDisplay();
                }
            }, 1000);
            
            console.log('✅ تم تهيئة واجهة المستخدم');
        } catch (error) {
            console.error('❌ فشل تهيئة واجهة المستخدم:', error);
        }
    }

    /**
     * Initialize OpenCV asynchronously
     */
    initOpenCVAsync() {
        if (typeof openCVHandler !== 'undefined') {
            openCVHandler.initOpenCV().then(success => {
                if (success) {
                    console.log('✅ OpenCV loaded successfully');
                } else {
                    console.error('❌ OpenCV failed to load');
                }
            });
        } else {
            console.error('❌ openCVHandler not defined');
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        try {
            console.log('🎧 Initializing event listeners...');
            
            if (typeof uiManager !== 'undefined' && typeof uiManager.initTabBehavior === 'function') {
                uiManager.initTabBehavior();
            }
            
            if (typeof uiManager !== 'undefined' && typeof uiManager.initControlElements === 'function') {
                uiManager.initControlElements();
            }
            
            console.log('✅ تم تهيئة مستمعي الأحداث');
        } catch (error) {
            console.error('❌ فشل تهيئة مستمعي الأحداث:', error);
        }
    }

    /**
     * Create tab contents dynamically
     */
    createTabContents() {
        try {
            const leftPanel = document.querySelector('.panel');
            if (!leftPanel) {
                console.error('❌ Left panel not found');
                return;
            }

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
                `
            };

            // Add tab contents to left panel
            Object.values(tabContents).forEach(content => {
                leftPanel.insertAdjacentHTML('beforeend', content);
            });

            console.log('✅ تم إنشاء محتويات التبويبات');
        } catch (error) {
            console.error('❌ فشل إنشاء محتويات التبويبات:', error);
        }
    }

    // Stub methods for other initializations
    init3DViewer() {
        console.log('✅ 3D Viewer initialized (stub)');
    }

    initDebugSystem() {
        console.log('✅ Debug System initialized (stub)');
    }

    initAdvancedMachine() {
        console.log('✅ Advanced Machine initialized (stub)');
    }
}

// Create global app instance
const cncApp = new CNCApp();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - Starting app...');
    cncApp.init();
});

// Test if functions are available globally
console.log('🔍 Global functions check:');
console.log('- updateDimensionDisplay:', typeof updateDimensionDisplay);
console.log('- showToast:', typeof showToast);
console.log('- initUtils:', typeof initUtils);
