/**
 * Main Application Entry Point
 * Coordinates all modules and handles application lifecycle
 */
class CNCApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
    }

    /**
     * Initialize the complete application
     */
    async init() {
        if (this.isInitialized) return;

        console.log('🚀 بدء تشغيل تطبيق CNC AI...');
        showProgress('جاري تهيئة التطبيق...');

        try {
            // Initialize modules in order
            await this.initializeModules();
            
            // Setup event listeners and UI
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            
            // Start background services
            this.startBackgroundServices();
            
            this.isInitialized = true;
            
            hideProgress();
            showToast('تم تحميل تطبيق CNC AI بنجاح!', 2000);
            console.log('✅ تم تهيئة تطبيق CNC AI بنجاح');
            
        } catch (error) {
            console.error('❌ فشل تهيئة التطبيق:', error);
            showToast('فشل تحميل التطبيق: ' + error.message, 5000);
            hideProgress();
        }
    }

    /**
     * Initialize all application modules
     */
    async initializeModules() {
        // 1. Initialize Debug System First
        this.modules.debug = debugSystem;
        this.modules.debug.init();
        console.log('✅ تم تهيئة نظام التصحيح');

        // 2. Initialize UI Manager
        this.modules.ui = uiManager;
        this.modules.ui.init();
        console.log('✅ تم تهيئة مدير الواجهة');

        // 3. Initialize Task Manager
        this.modules.tasks = taskManager;
        console.log('✅ تم تهيئة مدير المهام');

        // 4. Initialize Memory Manager
        this.modules.memory = memoryManager;
        console.log('✅ تم تهيئة مدير الذاكرة');

        // 5. Initialize Advanced Machine Settings
        this.modules.advancedMachine = advancedMachineManager;
        this.modules.advancedMachine.init();
        console.log('✅ تم تهيئة الإعدادات المتقدمة');

        // 6. Initialize G-code Library
        this.modules.gcode = gcodeLibrary;
        console.log('✅ تم تهيئة مكتبة G-code');

        // 7. Initialize OpenCV Handler (async)
        this.modules.opencv = opencvHandler;
        await this.initializeOpenCV();
        console.log('✅ تم تهيئة OpenCV');

        // 8. Initialize remaining managers
        this.initializeRemainingManagers();
        
        // Log initialization complete
        this.modules.debug.log('اكتملت تهيئة جميع الوحدات', 'info');
    }

    /**
     * Initialize OpenCV with retry logic
     */
    async initializeOpenCV() {
        try {
            await opencvHandler.init();
            APP_STATE.cvReady = true;
        } catch (error) {
            console.warn('فشل تحميل OpenCV، سيتم المحاولة مرة أخرى:', error);
            // OpenCV might load later, we'll retry when needed
        }
    }

    /**
     * Initialize remaining manager classes
     */
    initializeRemainingManagers() {
        // These will be initialized on-demand or when their respective features are used
        console.log('✅ تم تحميل جميع المديرين');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));

        // Before unload handler for cleanup
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

        // Global error handler
        window.addEventListener('error', this.handleGlobalError.bind(this));

        // Initialize specific event handlers
        this.initFileInput();
        this.initTabs();
        this.initMachineCategory();
        this.initControlElements();
        this.initButtons();
        this.initColormapButtons();

        console.log('✅ تم إعداد مستمعي الأحداث');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update 3D viewers and canvases
        this.updateViewports();
        
        // Debounced dimension update
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            updateDimensionDisplay();
        }, 250);
    }

    /**
     * Update viewport sizes for 3D viewers
     */
    updateViewports() {
        // Update simulation viewer
        const simContainer = document.getElementById('threeContainer');
        if (window.simulation && window.simulation.renderer && simContainer) {
            const camera = window.simulation.camera;
            const renderer = window.simulation.renderer;
            if (camera && renderer) {
                camera.aspect = simContainer.clientWidth / simContainer.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(simContainer.clientWidth, simContainer.clientHeight);
            }
        }

        // Update 3D model viewer
        const modelContainer = document.getElementById('threeDContainer');
        if (window.threeDViewer && modelContainer) {
            window.threeDViewer.onWindowResize();
        }

        // Update vector preview
        const vectorCanvas = document.getElementById('vectorCanvas');
        if (vectorCanvas && window.vectorPreview) {
            window.vectorPreview.resizeCanvas();
        }
    }

    /**
     * Handle application cleanup before unload
     */
    handleBeforeUnload() {
        console.log('🧹 تنظيف التطبيق قبل الإغلاق...');
        
        // Cleanup memory
        if (this.modules.memory) {
            this.modules.memory.cleanupAll();
        }

        // Stop any running tasks
        if (this.modules.tasks) {
            this.modules.tasks.clear();
        }

        // Cleanup simulations
        if (window.simulation) {
            window.simulation.cleanup();
        }

        // Cleanup 3D viewers
        if (window.threeDViewer) {
            window.threeDViewer.cleanup();
        }

        console.log('✅ تم التنظيف بنجاح');
    }

    /**
     * Handle global errors
     */
    handleGlobalError(event) {
        const error = event.error || new Error(event.message);
        this.modules.debug.log(`خطأ عام: ${error.message}`, 'error', error.stack);
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when no input is focused
            if (this.isInputFocused()) return;

            if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 'g': // Generate G-code
                        event.preventDefault();
                        this.handleGenerateShortcut();
                        break;
                        
                    case 'r': // Quick generate
                        event.preventDefault();
                        this.handleQuickGenerateShortcut();
                        break;
                        
                    case 'd': // Download
                        event.preventDefault();
                        this.handleDownloadShortcut();
                        break;
                        
                    case '`': // Toggle debug
                        event.preventDefault();
                        this.toggleDebugOverlay();
                        break;

                    case 's': // Save
                        event.preventDefault();
                        this.handleSaveShortcut();
                        break;
                }
            }
        });

        console.log('✅ تم إعداد اختصارات لوحة المفاتيح');
    }

    /**
     * Check if any input element is focused
     */
    isInputFocused() {
        const active = document.activeElement;
        return active && (
            active.tagName === 'INPUT' || 
            active.tagName === 'TEXTAREA' || 
            active.tagName === 'SELECT' ||
            active.isContentEditable
        );
    }

    /**
     * Handle generate G-code shortcut
     */
    handleGenerateShortcut() {
        const machineType = document.getElementById('machineCategory')?.value || 'router';
        
        switch (machineType) {
            case 'laser':
                document.getElementById('btnLaserEngrave')?.click();
                break;
            case 'threed':
                document.getElementById('btnSliceModel')?.click();
                break;
            default:
                document.getElementById('btnGen')?.click();
        }
        
        showToast(`تم تشغيل توليد G-code للـ${machineType} (Ctrl+G)`);
    }

    /**
     * Handle quick generate shortcut
     */
    handleQuickGenerateShortcut() {
        const machineType = document.getElementById('machineCategory')?.value || 'router';
        
        if (machineType === 'laser') {
            document.getElementById('btnLaserQuick')?.click();
        } else {
            document.getElementById('btnQuick')?.click();
        }
        
        showToast(`تشغيل الوضع السريع (Ctrl+R)`);
    }

    /**
     * Handle download shortcut
     */
    handleDownloadShortcut() {
        document.getElementById('btnDownload')?.click();
        showToast(`تحميل G-code (Ctrl+D)`);
    }

    /**
     * Handle save shortcut
     */
    handleSaveShortcut() {
        // Save advanced settings
        if (this.modules.advancedMachine) {
            this.modules.advancedMachine.saveSettings();
            showToast('تم حفظ الإعدادات (Ctrl+S)');
        }
    }

    /**
     * Toggle debug overlay
     */
    toggleDebugOverlay() {
        const debugOverlay = document.getElementById('debugOverlay');
        if (debugOverlay) {
            const isMinimized = debugOverlay.classList.contains('minimized');
            if (isMinimized) {
                debugOverlay.classList.remove('minimized');
            } else {
                debugOverlay.classList.add('minimized');
            }
            showToast(`تم ${isMinimized ? 'فتح' : 'إغلاق'} نافذة التصحيح (Ctrl+\\``);
        }
    }

    /**
     * Start background services
     */
    startBackgroundServices() {
        // Start performance monitoring
        if (this.modules.debug) {
            this.modules.debug.startPerformanceMonitor();
        }

        // Start memory monitoring
        this.startMemoryMonitoring();

        // Start task monitoring
        this.startTaskMonitoring();

        console.log('✅ بدء الخدمات الخلفية');
    }

    /**
     * Start memory usage monitoring
     */
    startMemoryMonitoring() {
        setInterval(() => {
            if (this.modules.memory && this.modules.debug) {
                const usage = this.modules.memory.getMemoryUsage();
                if (usage.trackedMats > 10) {
                    this.modules.debug.logMemoryUsage();
                }
            }
        }, 60000); // Every minute
    }

    /**
     * Start task queue monitoring
     */
    startTaskMonitoring() {
        setInterval(() => {
            if (this.modules.tasks && this.modules.debug) {
                const status = this.modules.tasks.getQueueStatus();
                if (status.pending > 5) {
                    this.modules.debug.logTaskManagerStatus();
                }
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Initialize file input handling
     */
    initFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', async (e) => {
            await this.handleFileInput(e);
        });

        // Prevent double loading
        fileInput.addEventListener('click', function(e) {
            this.value = '';
        });
    }

    /**
     * Handle file input change
     */
    async handleFileInput(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const validation = InputValidator.validateFile(file, CONFIG.supportedFormats.images);
        if (!validation.isValid) {
            showToast(validation.errors[0]);
            return;
        }

        await taskManager.addTask(async () => {
            await this.loadAndProcessImage(file);
        }, 'تحميل الصورة');
    }

    /**
     * Load and process image file
     */
    async loadAndProcessImage(file) {
        try {
            APP_STATE.isProcessing = true;
            memoryManager.cleanupMats();

            // Load image
            const img = new Image();
            const imgUrl = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
                img.src = imgUrl;
            });

            // Setup canvas
            const canvas = document.getElementById('canvasOriginal');
            if (!canvas) throw new Error('عنصر canvas غير موجود');

            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Validate and resize if needed
            InputValidator.validateImageSize(canvas);

            APP_STATE.previewCanvas = canvas;
            showElement('canvasOriginal', 'originalPlaceholder');

            // Free memory
            URL.revokeObjectURL(imgUrl);

            // Process image based on current machine type
            if (APP_STATE.cvReady) {
                const machineType = document.getElementById('machineCategory').value;
                if (machineType === 'laser') {
                    await detectLaserContours();
                } else if (machineType === 'router') {
                    await detectContours();
                }
            }

        } catch (error) {
            console.error('خطأ في تحميل الصورة:', error);
            throw new Error('فشل في تحميل الصورة: ' + error.message);
        } finally {
            APP_STATE.isProcessing = false;
        }
    }

    /**
     * Initialize tab system
     */
    initTabs() {
        document.querySelectorAll('.tab-buttons button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
    }

    /**
     * Switch to specific tab
     */
    switchTab(tabId) {
        // Update buttons
        document.querySelectorAll('.tab-buttons button').forEach(b => {
            b.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(tc => {
            tc.classList.remove('active');
        });

        // Activate selected tab
        const activeBtn = document.querySelector(`.tab-buttons button[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(tabId);
        
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.add('active');

        // Tab-specific initialization
        this.handleTabActivation(tabId);
    }

    /**
     * Handle tab-specific initialization
     */
    handleTabActivation(tabId) {
        switch (tabId) {
            case 'simulation':
                if (document.getElementById('gcodeOut').value) {
                    initSimulation();
                }
                break;
            case 'threed':
                // Initialize 3D viewer if needed
                if (window.initThreeDViewer) {
                    setTimeout(() => {
                        window.initThreeDViewer();
                        if (window.threeDViewer) {
                            window.threeDViewer.onWindowResize();
                        }
                    }, 100);
                }
                break;
            case 'vector2d':
                // Initialize vector preview if needed
                if (window.vectorPreview) {
                    window.vectorPreview.resizeCanvas();
                }
                break;
        }
    }

    /**
     * Initialize machine category switching
     */
    initMachineCategory() {
        const machineCategory = document.getElementById('machineCategory');
        if (!machineCategory) return;

        machineCategory.addEventListener('change', (e) => {
            this.handleMachineCategoryChange(e.target.value);
        });

        // Set initial state
        this.handleMachineCategoryChange(machineCategory.value);
    }

    /**
     * Handle machine category change
     */
    handleMachineCategoryChange(machineType) {
        APP_STATE.currentMachine = machineType;
        
        // Update UI visibility
        uiManager.updateButtonVisibility(machineType);
        
        // Update settings panels
        document.getElementById('routerSettings').style.display = 
            (machineType === 'router') ? 'block' : 'none';
        document.getElementById('laserSettings').style.display = 
            (machineType === 'laser') ? 'block' : 'none';
        document.getElementById('threedSettings').style.display = 
            (machineType === 'threed') ? 'block' : 'none';

        // Reload default settings
        const defaults = CONFIG.defaultSettings[machineType];
        if (defaults) {
            this.applyDefaultSettings(machineType, defaults);
        }

        // Reprocess image if loaded
        if (APP_STATE.previewCanvas && APP_STATE.cvReady && !APP_STATE.isProcessing) {
            taskManager.addTask(async () => {
                if (machineType === 'laser') {
                    await detectLaserContours();
                } else if (machineType === 'router') {
                    await detectContours();
                }
            }, `تبديل إلى ${machineType}`);
        }

        showToast(`تم التبديل إلى وضع ${machineType}`);
    }

    /**
     * Apply default settings for machine type
     */
    applyDefaultSettings(machineType, defaults) {
        switch (machineType) {
            case 'router':
                document.getElementById('feedRate').value = defaults.feed;
                document.getElementById('safeZ').value = defaults.safeZ;
                document.getElementById('maxDepth').value = defaults.maxDepth;
                document.getElementById('stepOver').value = defaults.stepOver;
                break;
            case 'laser':
                document.getElementById('laserSpeed').value = defaults.feed;
                break;
            case 'threed':
                document.getElementById('threedLayerHeight').value = defaults.layerHeight;
                document.getElementById('threedFillDensity').value = defaults.fillDensity;
                document.getElementById('threedPrintSpeed').value = defaults.printSpeed;
                break;
        }
        
        updateDimensionDisplay();
    }

    /**
     * Initialize control elements (sliders, etc.)
     */
    initControlElements() {
        this.initSliders();
        this.initEdgeDetection();
        this.initLaserControls();
    }

    /**
     * Initialize slider controls
     */
    initSliders() {
        // Edge sensitivity
        const edgeSensitivity = document.getElementById('edgeSensitivity');
        if (edgeSensitivity) {
            edgeSensitivity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value).toFixed(2);
                document.getElementById('edgeValue').textContent = value;
                
                // Debounced reprocessing
                clearTimeout(this.edgeSensitivityTimeout);
                this.edgeSensitivityTimeout = setTimeout(() => {
                    if (APP_STATE.previewCanvas && !APP_STATE.isProcessing) {
                        const isLaser = document.getElementById('machineCategory').value === 'laser';
                        if (!isLaser) {
                            taskManager.addTask(detectContours, 'تحديث حساسية الحواف');
                        }
                    }
                }, 300);
            });
        }

        // Laser power
        const laserPower = document.getElementById('laserPower');
        if (laserPower) {
            laserPower.addEventListener('input', (e) => {
                const value = e.target.value;
                const display = document.getElementById('laserPowerValue');
                if (display) {
                    display.textContent = value + '%';
                    display.style.color = `hsl(${value * 1.2}, 100%, 60%)`;
                }
            });
        }

        // Laser detail
        const laserDetail = document.getElementById('laserDetail');
        if (laserDetail) {
            laserDetail.addEventListener('input', (e) => {
                const display = document.getElementById('laserDetailValue');
                if (display) {
                    display.textContent = e.target.value;
                }
            });
        }
    }

    /**
     * Initialize edge detection controls
     */
    initEdgeDetection() {
        const edgeMode = document.getElementById('edgeMode');
        if (edgeMode) {
            edgeMode.addEventListener('change', () => {
                if (APP_STATE.previewCanvas && !APP_STATE.isProcessing) {
                    const isLaser = document.getElementById('machineCategory').value === 'laser';
                    if (!isLaser) {
                        taskManager.addTask(detectContours, 'تحديث كشف الحواف');
                    }
                }
            });
        }
    }

    /**
     * Initialize laser-specific controls
     */
    initLaserControls() {
        const laserEdgeMode = document.getElementById('laserEdgeMode');
        if (laserEdgeMode) {
            const descriptions = {
                canny: 'Canny - كشف حواف تقليدي مناسب للصور العامة',
                adaptive: 'Adaptive Threshold - ممتاز للصور ذات الإضاءة غير المتجانسة',
                morphological: 'Morphological - للحواف الدقيقة والناعمة والتفاصيل الصغيرة',
                gradient: 'Gradient-Based - للتدرجات اللونية والصور ذات التباين العالي'
            };

            laserEdgeMode.addEventListener('change', (e) => {
                const desc = document.getElementById('laserModeDesc');
                if (desc) {
                    desc.textContent = descriptions[e.target.value] || '';
                }
                
                if (APP_STATE.previewCanvas && !APP_STATE.isProcessing) {
                    const isLaser = document.getElementById('machineCategory').value === 'laser';
                    if (isLaser) {
                        taskManager.addTask(detectLaserContours, 'تحديث كشف حواف الليزر');
                    }
                }
            });
        }

        // Laser redetect button
        const btnRedetectLaser = document.getElementById('btnRedetectLaser');
        if (btnRedetectLaser) {
            btnRedetectLaser.addEventListener('click', () => {
                if (!APP_STATE.previewCanvas) {
                    showToast('لا توجد صورة محملة');
                    return;
                }
                if (APP_STATE.cvReady && !APP_STATE.isProcessing) {
                    taskManager.addTask(detectLaserContours, 'إعادة كشف حواف الليزر');
                }
            });
        }
    }

    /**
     * Initialize all action buttons
     */
    initButtons() {
        this.initRouterButtons();
        this.initLaserButtons();
        this.init3DButtons();
        this.initUtilityButtons();
    }

    /**
     * Initialize router buttons
     */
    initRouterButtons() {
        // Generate Raster G-code
        const btnGen = document.getElementById('btnGen');
        if (btnGen) {
            btnGen.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generateRasterGcode(false);
                    this.handleGCodeGeneration(gcode, 'Raster');
                    return gcode;
                }, 'توليد G-code (Raster)');
            });
        }

        // Quick Generate
        const btnQuick = document.getElementById('btnQuick');
        if (btnQuick) {
            btnQuick.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generateRasterGcode(true);
                    this.handleGCodeGeneration(gcode, 'سريع');
                    return gcode;
                }, 'توليد G-code سريع');
            });
        }

        // Generate Contour G-code
        const btnContour = document.getElementById('btnContour');
        if (btnContour) {
            btnContour.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generateContourGcode();
                    this.handleGCodeGeneration(gcode, 'Contour');
                    return gcode;
                }, 'توليد G-code (Contour)');
            });
        }

        // Center Origin
        const btnCenterOrigin = document.getElementById('btnCenterOrigin');
        if (btnCenterOrigin) {
            btnCenterOrigin.addEventListener('click', () => {
                const workWidth = parseFloat(document.getElementById('workWidth').value) || 0;
                const workHeight = parseFloat(document.getElementById('workHeight').value) || 0;
                document.getElementById('originX').value = (workWidth / 2).toFixed(1);
                document.getElementById('originY').value = (workHeight / 2).toFixed(1);
                showToast("تم توسيط نقطة الأصل");
            });
        }
    }

    /**
     * Initialize laser buttons
     */
    initLaserButtons() {
        // Laser Engrave
        const btnLaserEngrave = document.getElementById('btnLaserEngrave');
        if (btnLaserEngrave) {
            btnLaserEngrave.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generateLaserEngraveGcode();
                    this.handleGCodeGeneration(gcode, 'نقش ليزر');
                    return gcode;
                }, 'توليد كود الليزر (نقش)');
            });
        }

        // Laser Quick
        const btnLaserQuick = document.getElementById('btnLaserQuick');
        if (btnLaserQuick) {
            btnLaserQuick.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generateLaserQuickGcode();
                    this.handleGCodeGeneration(gcode, 'ليزر سريع');
                    return gcode;
                }, 'توليد كود الليزر السريع');
            });
        }

        // Laser Cut
        const btnLaserCut = document.getElementById('btnLaserCut');
        if (btnLaserCut) {
            btnLaserCut.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generateLaserCutGcode();
                    this.handleGCodeGeneration(gcode, 'قص ليزر');
                    return gcode;
                }, 'توليد كود الليزر (قص)');
            });
        }

        // Laser Center Origin
        const btnLaserCenterOrigin = document.getElementById('btnLaserCenterOrigin');
        if (btnLaserCenterOrigin) {
            btnLaserCenterOrigin.addEventListener('click', () => {
                const workWidth = parseFloat(document.getElementById('laserWorkWidth').value) || 0;
                const workHeight = parseFloat(document.getElementById('laserWorkHeight').value) || 0;
                document.getElementById('laserOriginX').value = (workWidth / 2).toFixed(1);
                document.getElementById('laserOriginY').value = (workHeight / 2).toFixed(1);
                showToast("تم توسيط نقطة الأصل للليزر");
            });
        }
    }

    /**
     * Initialize 3D buttons
     */
    init3DButtons() {
        // Slice 3D Model
        const btnSliceModel = document.getElementById('btnSliceModel');
        if (btnSliceModel) {
            btnSliceModel.addEventListener('click', () => {
                taskManager.addTask(() => {
                    const gcode = generate3DGcode();
                    this.handleGCodeGeneration(gcode, '3D');
                    return gcode;
                }, 'توليد G-code ثلاثي الأبعاد');
            });
        }

        // Preview Layers
        const btnPreviewLayers = document.getElementById('btnPreviewLayers');
        if (btnPreviewLayers) {
            btnPreviewLayers.addEventListener('click', () => {
                showToast("ميزة معاينة الطبقات قيد التطوير", 3000);
            });
        }

        // 3D Center Origin
        const btnThreedCenterOrigin = document.getElementById('btnThreedCenterOrigin');
        if (btnThreedCenterOrigin) {
            btnThreedCenterOrigin.addEventListener('click', () => {
                const workWidth = parseFloat(document.getElementById('threedWorkWidth').value) || 0;
                const workHeight = parseFloat(document.getElementById('threedWorkHeight').value) || 0;
                document.getElementById('threedOriginX').value = (workWidth / 2).toFixed(1);
                document.getElementById('threedOriginY').value = (workHeight / 2).toFixed(1);
                showToast("تم توسيط نقطة الأصل للطابعة ثلاثية الأبعاد");
            });
        }
    }

    /**
     * Initialize utility buttons
     */
    initUtilityButtons() {
        // Download G-code
        const btnDownload = document.getElementById('btnDownload');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => {
                this.downloadGCode();
            });
        }

        // Laser Download
        const btnLaserDownload = document.getElementById('btnLaserDownload');
        if (btnLaserDownload) {
            btnLaserDownload.addEventListener('click', () => {
                this.downloadGCode();
            });
        }

        // 3D Download
        const btnDownload3D = document.getElementById('btnDownload3D');
        if (btnDownload3D) {
            btnDownload3D.addEventListener('click', () => {
                this.downloadGCode();
            });
        }
    }

    /**
     * Handle G-code generation result
     */
    handleGCodeGeneration(gcode, type) {
        if (!gcode) return;

        // Apply advanced machine settings
        const processedGcode = applyAdvancedMachineSettings(gcode);
        
        // Update UI
        document.getElementById('gcodeOut').value = processedGcode;
        APP_STATE.lastGeneratedGcode = processedGcode;

        // Update visualizations
        renderTopViewFromGcode(processedGcode);
        
        // Switch to simulation tab
        this.switchTab('simulation');

        showToast(`تم توليد G-code (${type}) بنجاح`);
    }

    /**
     * Download generated G-code
     */
    downloadGCode() {
        const text = document.getElementById('gcodeOut').value;
        if (!text) { 
            showToast("لا يوجد G-code لتحميله"); 
            return; 
        }

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const machineType = document.getElementById('machineCategory').value;
        const filename = `${machineType}_output_${dateStr}.gcode`;
        
        if (downloadTextAsFile(text, filename)) {
            showToast(`تم تحميل الملف: ${filename}`);
        } else {
            showToast('فشل في تحميل الملف');
        }
    }

    /**
     * Initialize colormap buttons
     */
    initColormapButtons() {
        document.querySelectorAll('#colormapButtons button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeColormap(btn.dataset.map);
            });
        });
    }

    /**
     * Change current colormap
     */
    changeColormap(colormap) {
        // Update buttons
        document.querySelectorAll('#colormapButtons button').forEach(b => {
            b.classList.remove('active');
        });
        document.querySelector(`#colormapButtons button[data-map="${colormap}"]`).classList.add('active');

        APP_STATE.currentColormap = colormap;

        // Update visualizations
        if (document.getElementById('heatmap').classList.contains('active')) {
            renderHeatmap();
        }

        if (APP_STATE.lastGeneratedGcode) {
            renderTopViewFromGcode(APP_STATE.lastGeneratedGcode);
        }

        if (document.getElementById('contour').classList.contains('active') && 
            APP_STATE.grayMat && APP_STATE.contour) {
            renderContour(APP_STATE.grayMat, APP_STATE.contour);
        }

        showToast('تم تغيير نموذج الألوان إلى ' + colormap);
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            cvReady: APP_STATE.cvReady,
            hasImage: !!APP_STATE.previewCanvas,
            currentMachine: APP_STATE.currentMachine,
            currentColormap: APP_STATE.currentColormap,
            processing: APP_STATE.isProcessing,
            tasks: taskManager.getQueueStatus(),
            memory: memoryManager.getMemoryUsage()
        };
    }

    /**
     * Reset application state
     */
    reset() {
        // Clear current state
        memoryManager.cleanupAll();
        taskManager.clear();
        
        // Reset UI
        document.getElementById('gcodeOut').value = '';
        APP_STATE.lastGeneratedGcode = '';
        
        // Hide canvases
        document.querySelectorAll('canvas').forEach(canvas => {
            canvas.style.display = 'none';
        });
        document.querySelectorAll('.canvas-placeholder').forEach(placeholder => {
            placeholder.style.display = 'flex';
        });

        showToast('تم إعادة تعيين التطبيق');
    }
}

// Create global application instance
const cncApp = new CNCApp();

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cncApp.init();
    });
} else {
    cncApp.init();
}

// Global access for debugging
window.CNCApp = cncApp;

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CNCApp, cncApp };
}
