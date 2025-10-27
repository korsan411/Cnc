/**
 * UI Manager for dynamic element creation and management
 */
class UIManager {
    constructor() {
        this.initialized = false;
        this.tabContents = {};
    }

    /**
     * Initialize all UI components
     */
    init() {
        if (this.initialized) return;

        this.createTabContents();
        this.createMachineSettings();
        this.createFileFormatButtons();
        this.createColormapButtons();
        this.createAdvancedMachineSettings();
        
        this.initialized = true;
        console.log('تم تهيئة واجهة المستخدم');
    }

    /**
     * Create tab content areas
     */
    createTabContents() {
        const leftPanel = document.querySelector('.panel');
        if (!leftPanel) return;

        const tabContents = {
            'original': {
                title: '🖼️ الأصلية',
                content: `
                    <div class="canvas-placeholder" id="originalPlaceholder">الصورة الأصلية ستظهر هنا</div>
                    <canvas id="canvasOriginal" style="display:none;"></canvas>
                `
            },
            'heatmap': {
                title: '🔥 Heatmap',
                content: `
                    <div class="canvas-placeholder" id="heatmapPlaceholder">Heatmap ستظهر هنا</div>
                    <canvas id="canvasHeatmap" style="display:none;"></canvas>
                `
            },
            'contour': {
                title: '📐 Contours',
                content: `
                    <div class="canvas-placeholder" id="contourPlaceholder">Contours ستظهر هنا</div>
                    <canvas id="canvasContour" style="display:none;"></canvas>
                    <div class="small-meta">تبديل وضع كشف الحواف أو تحريك حساسية الحواف يحدث إعادة معالجة تلقائية</div>
                `
            },
            'topview': {
                title: '🔝 Top View',
                content: `
                    <div id="topViewContainer">
                        <canvas id="topView"></canvas>
                        <div id="topLegend" title="عمق النقش — الألوان فقط"></div>
                    </div>
                    <div class="small-meta">معاينة من الأعلى للعمق المتوقع بعد تنفيذ G-code (الألوان تتبع اختيار Colormap)</div>
                `
            },
            'threed': {
                title: '🧊 3D Models',
                content: `
                    <div class="canvas-placeholder" id="threedPlaceholder">الموديل ثلاثي الأبعاد سيظهر هنا</div>
                    <div id="threeDContainer" style="display:none;">
                        <canvas id="canvas3D"></canvas>
                    </div>
                `
            },
            'simulation': {
                title: '🎬 المحاكاة',
                content: `
                    <div id="threeContainer">
                        <div class="canvas-placeholder" id="simulationPlaceholder">المحاكاة ستظهر هنا بعد توليد G-code</div>
                    </div>
                `
            },
            'vector2d': {
                title: '📐 2D Vector Preview',
                content: `
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        <div class="canvas-placeholder" id="vectorPlaceholder">اسحب أو ارفع ملف SVG أو DXF هنا للمعاينة</div>
                        <canvas id="vectorCanvas" style="display:none;width:100%;height:420px;background:transparent;"></canvas>
                        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
                            <button id="vectorZoomIn" class="secondary">🔍+</button>
                            <button id="vectorZoomOut" class="secondary">🔍−</button>
                            <button id="vectorFit" class="secondary">🎯 ملء الشاشة</button>
                        </div>
                    </div>
                `
            },
            'ai-analysis': {
                title: '🧠 تحليل الصورة',
                content: `
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
                `
            }
        };

        // Create tab buttons and contents
        Object.entries(tabContents).forEach(([tabId, { title, content }]) => {
            this.tabContents[tabId] = content;
            
            // Add to left panel
            const contentDiv = document.createElement('div');
            contentDiv.id = tabId;
            contentDiv.className = 'tab-content';
            contentDiv.innerHTML = content;
            leftPanel.appendChild(contentDiv);
        });

        console.log('تم إنشاء محتويات التبويبات');
    }

    /**
     * Create machine settings panels
     */
    createMachineSettings() {
        const rightPanel = document.querySelector('.panel');
        if (!rightPanel) return;

        const settingsHTML = `
            <!-- Machine Category Selection -->
            <label for="machineCategory">نوع الماكينة الرئيسي</label>
            <select id="machineCategory">
                <option value="router">CNC Router (نحت خشب)</option>
                <option value="laser">Laser Engraver (نقش ليزر)</option>
                <option value="threed">3D Printer (طباعة ثلاثية الأبعاد)</option>
            </select>

            <!-- CNC Router Settings -->
            <div id="routerSettings" class="machine-settings">
                ${this.createRouterSettings()}
            </div>

            <!-- Laser Engraver Settings -->
            <div id="laserSettings" class="machine-settings" style="display:none;">
                ${this.createLaserSettings()}
            </div>

            <!-- 3D Printer Settings -->
            <div id="threedSettings" class="machine-settings" style="display:none;">
                ${this.create3DSettings()}
            </div>

            <div id="estTime" style="margin-top:12px;color:#9bb0c8;text-align:center;padding:8px;background:#0f172a;border-radius:6px"></div>

            <label for="gcodeOut" style="margin-top:12px">📄 مخرجات G-code</label>
            <textarea id="gcodeOut" readonly placeholder="سيظهر G-code هنا بعد التوليد..." style="height:180px;background:#021024;color:#cfeaf2;border-radius:8px;padding:10px;"></textarea>
        `;

        // Find the position after the advanced machine settings
        const advMachineCard = document.getElementById('adv-machine-card');
        if (advMachineCard) {
            advMachineCard.insertAdjacentHTML('afterend', settingsHTML);
        } else {
            rightPanel.innerHTML += settingsHTML;
        }
    }

    /**
     * Create router settings HTML
     */
    createRouterSettings() {
        return `
            <h4 class="router-specific">🔄 إعدادات CNC Router</h4>
            
            <label for="workWidth">عرض العمل (سم)</label>
            <input id="workWidth" type="number" value="30" step="0.1" min="1" max="200"/>
            <div class="small-meta" id="widthMm">300.0 مم</div>

            <label for="workHeight">ارتفاع العمل (سم)</label>
            <input id="workHeight" type="number" value="20" step="0.1" min="1" max="200"/>
            <div class="small-meta" id="heightMm">200.0 مم</div>

            <label for="workDepth">عمق العمل (مم)</label>
            <input id="workDepth" type="number" value="3.0" step="0.1" min="0.1" max="50"/>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                    <label for="originX">نقطة الأصل X (سم)</label>
                    <input id="originX" type="number" value="0" step="0.1"/>
                </div>
                <div>
                    <label for="originY">نقطة الأصل Y (سم)</label>
                    <input id="originY" type="number" value="0" step="0.1"/>
                </div>
            </div>
            <div style="margin-top:6px"><button id="btnCenterOrigin" class="secondary">🎯 توسيط نقطة الأصل</button></div>

            <hr style="border-color:#122433;margin:12px 0"/>

            <label for="feedRate">سرعة التغذية (مم/دقيقة)</label>
            <input id="feedRate" type="number" value="800" min="10" max="5000"/>
            <label for="safeZ">ارتفاع الأمان (مم)</label>
            <input id="safeZ" type="number" value="5" step="0.1" min="0" max="100"/>

            <label for="scanDir">اتجاه المسارات (Raster)</label>
            <select id="scanDir">
                <option value="x">أفقي (X)</option>
                <option value="y">رأسي (Y)</option>
            </select>

            <label for="stepOver">خطوة المسح (مم)</label>
            <input id="stepOver" type="number" value="5" step="0.1" min="0.1" max="50"/>
            <label for="maxDepth">أقصى عمق (مم)</label>
            <input id="maxDepth" type="number" value="3.0" step="0.1" min="0.1" max="50"/>

            <!-- Fixed Z + Invert Z -->
            <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
                <label style="font-weight:normal;"><input id="fixedZ" type="checkbox" /> استخدام Z ثابت</label>
                <input id="fixedZValue" type="number" value="-1.0" step="0.1" style="width:120px" />
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
                <label style="font-weight:normal;"><input id="invertZ" type="checkbox" /> عكس Z</label>
                <div style="flex:1"></div>
                <label style="font-weight:normal;color:#9bb0c8">لون الخشب:</label>
                <select id="woodColor" style="width:140px">
                    <option value="#deb887">خشب فاتح</option>
                    <option value="#a0522d" selected>خشب متوسط</option>
                    <option value="#d2b48c">بيج</option>
                    <option value="#8b5a2b">ماهوجني</option>
                </select>
            </div>

            <div class="button-group">
                <div class="button-row">
                    <button id="btnGen" class="primary">⚡ توليد G-code (Raster)</button>
                    <button id="btnQuick" class="secondary">🧪 اختبار سريع</button>
                </div>

                <div style="margin-top:8px">
                    <label for="contourMode">نطاق الحواف (Contour)</label>
                    <select id="contourMode">
                        <option value="outer">الخارجية فقط</option>
                        <option value="all">كل الحواف</option>
                    </select>
                    <div style="height:8px"></div>
                    <div class="button-row">
                        <button id="btnContour" class="secondary">🌀 توليد G-code (Contour)</button>
                        <button id="btnDownload" class="secondary">💾 تحميل G-code</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create laser settings HTML
     */
    createLaserSettings() {
        return `
            <h4 class="laser-specific">⚡ إعدادات Laser Engraver</h4>
            
            <label for="laserWorkWidth">عرض العمل (سم)</label>
            <input id="laserWorkWidth" type="number" value="30" step="0.1" min="1" max="200"/>
            <div class="small-meta" id="laserWidthMm">300.0 مم</div>

            <label for="laserWorkHeight">ارتفاع العمل (سم)</label>
            <input id="laserWorkHeight" type="number" value="20" step="0.1" min="1" max="200"/>
            <div class="small-meta" id="laserHeightMm">200.0 مم</div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                    <label for="laserOriginX">نقطة الأصل X (سم)</label>
                    <input id="laserOriginX" type="number" value="0" step="0.1"/>
                </div>
                <div>
                    <label for="laserOriginY">نقطة الأصل Y (سم)</label>
                    <input id="laserOriginY" type="number" value="0" step="0.1"/>
                </div>
            </div>
            <div style="margin-top:6px"><button id="btnLaserCenterOrigin" class="secondary">🎯 توسيط نقطة الأصل</button></div>

            <!-- Laser Edge Detection Settings -->
            <div class="laser-edge-settings">
                <label for="laserEdgeMode">نمط كشف الحواف للليزر</label>
                <select id="laserEdgeMode">
                    <option value="canny">Canny (عادي)</option>
                    <option value="adaptive">Adaptive Threshold (للنقش)</option>
                    <option value="morphological">Morphological (للتفاصيل الدقيقة)</option>
                    <option value="gradient">Gradient-Based (للتدرجات)</option>
                </select>
                <div class="laser-mode-description" id="laserModeDesc">
                    Adaptive Threshold - ممتاز للصور ذات الإضاءة غير المتجانسة
                </div>

                <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                    <label style="margin:0;color:#9bb0c8">دقة الليزر:</label>
                    <input id="laserDetail" type="range" min="1" max="10" value="5" step="1" style="flex:1">
                    <div id="laserDetailValue" style="min-width:44px;text-align:center;color:#ff4444">5</div>
                </div>
            </div>

            <div style="margin-top: 8px;">
                <button id="btnRedetectLaser" class="secondary">🔄 إعادة كشف حواف الليزر</button>
            </div>

            <hr style="border-color:#ff4444;margin:12px 0"/>

            <!-- Laser Power -->
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
                <label style="margin:0;color:#9bb0c8">قوة الليزر:</label>
                <input id="laserPower" type="range" min="0" max="100" value="80" step="1" style="flex:1">
                <div id="laserPowerValue" style="min-width:44px;text-align:center;color:#ff4444">80%</div>
            </div>

            <label for="laserMode">وضع الليزر</label>
            <select id="laserMode">
                <option value="engrave">نقش (Grayscale)</option>
                <option value="cut">قص (Contour)</option>
                <option value="combine">نقش + قص</option>
            </select>

            <label for="laserSpeed">سرعة الليزر (مم/دقيقة)</label>
            <input id="laserSpeed" type="number" value="2000" min="100" max="10000"/>

            <label for="laserPasses">عدد المرات</label>
            <input id="laserPasses" type="number" value="1" min="1" max="10"/>

            <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
                <label style="font-weight:normal;">
                    <input id="laserDynamic" type="checkbox" checked /> 
                    قوة ديناميكية (حسب الظلام)
                </label>
            </div>

            <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
                <label style="font-weight:normal;">
                    <input id="laserAirAssist" type="checkbox" /> 
                    Air Assist
                </label>
            </div>

            <!-- Laser Buttons -->
            <div class="button-group">
                <div class="button-row">
                    <button id="btnLaserEngrave" class="primary" style="background:#ff4444;">⚡ توليد كود ليزر (نقش)</button>
                    <button id="btnLaserQuick" class="secondary">🧪 نقش سريع</button>
                </div>
                <div class="button-row">
                    <button id="btnLaserCut" class="secondary">✂️ توليد كود ليزر (قص)</button>
                    <button id="btnLaserDownload" class="secondary">💾 تحميل كود الليزر</button>
                </div>
            </div>
        `;
    }

    /**
     * Create 3D printer settings HTML
     */
    create3DSettings() {
        return `
            <h4 class="threed-specific">🧊 إعدادات النماذج ثلاثية الأبعاد</h4>
            
            <label for="threedFileInput">تحميل ملف 3D (STL, OBJ, etc.)</label>
            <input id="threedFileInput" type="file" accept=".stl,.obj,.3ds,.dae,.ply" style="margin-bottom:12px"/>
            
            <label for="threedWorkWidth">عرض العمل (سم)</label>
            <input id="threedWorkWidth" type="number" value="30" step="0.1" min="1" max="200"/>
            <div class="small-meta" id="threedWidthMm">300.0 مم</div>

            <label for="threedWorkHeight">ارتفاع العمل (سم)</label>
            <input id="threedWorkHeight" type="number" value="20" step="0.1" min="1" max="200"/>
            <div class="small-meta" id="threedHeightMm">200.0 مم</div>

            <label for="threedWorkDepth">عمق العمل (مم)</label>
            <input id="threedWorkDepth" type="number" value="10" step="0.1" min="0.1" max="100"/>
            <div class="small-meta" id="threedDepthMm">10.0 مم</div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                    <label for="threedOriginX">نقطة الأصل X (سم)</label>
                    <input id="threedOriginX" type="number" value="0" step="0.1"/>
                </div>
                <div>
                    <label for="threedOriginY">نقطة الأصل Y (سم)</label>
                    <input id="threedOriginY" type="number" value="0" step="0.1"/>
                </div>
            </div>
            <div style="margin-top:6px"><button id="btnThreedCenterOrigin" class="secondary">🎯 توسيط نقطة الأصل</button></div>

            <hr style="border-color:#10b981;margin:12px 0"/>

            <label for="threedLayerHeight">ارتفاع الطبقة (مم)</label>
            <input id="threedLayerHeight" type="number" value="0.2" step="0.05" min="0.05" max="1.0"/>

            <label for="threedFillDensity">كثافة الحشو (%)</label>
            <input id="threedFillDensity" type="number" value="20" step="5" min="0" max="100"/>

            <label for="threedPrintSpeed">سرعة الطباعة (مم/ث)</label>
            <input id="threedPrintSpeed" type="number" value="50" step="5" min="10" max="200"/>

            <label for="threedInfillPattern">نمط الحشو</label>
            <select id="threedInfillPattern">
                <option value="rectilinear">Rectilinear</option>
                <option value="grid">Grid</option>
                <option value="triangles">Triangles</option>
                <option value="honeycomb">Honeycomb</option>
            </select>

            <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
                <label style="font-weight:normal;">
                    <input id="threedSupport" type="checkbox" /> 
                    دعم (Support)
                </label>
                <div style="flex:1"></div>
                <label style="font-weight:normal;">
                    <input id="threedRaft" type="checkbox" /> 
                    رافدة (Raft)
                </label>
            </div>

            <!-- 3D Buttons -->
            <div class="button-group">
                <div class="button-row">
                    <button id="btnSliceModel" class="primary" style="background:#10b981;">⚡ توليد G-code (3D)</button>
                    <button id="btnPreviewLayers" class="secondary">👁️ معاينة الطبقات</button>
                </div>
                <button id="btnDownload3D" class="secondary">💾 تحميل G-code 3D</button>
            </div>
        `;
    }

    /**
     * Create file format buttons
     */
    createFileFormatButtons() {
        const fileFormatSection = document.querySelector('.file-format-buttons');
        if (!fileFormatSection) return;

        const formats = [
            { format: 'stl', label: 'STL', description: 'نموذج ثلاثي الأبعاد' },
            { format: 'svg', label: 'SVG', description: 'رسوم متجهة' },
            { format: 'dxf', label: 'DXF', description: 'رسم CAD' }
        ];

        fileFormatSection.innerHTML = formats.map(({ format, label, description }) => `
            <button data-format="${format}" title="تحميل ملف ${label}">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>${label}</div>
                    <div style="font-size:0.8rem;color:#9bb0c8">${description}</div>
                </div>
            </button>
        `).join('');
    }

    /**
     * Create colormap buttons
     */
    createColormapButtons() {
        const colormapButtons = document.querySelector('.colormap-buttons');
        if (!colormapButtons) return;

        const colormaps = [
            { map: 'jet', label: 'Jet', gradient: 'linear-gradient(90deg,#0000ff,#00ffff,#ffff00,#ff0000)' },
            { map: 'hot', label: 'Hot', gradient: 'linear-gradient(90deg,#000000,#ff0000,#ffff00,#ffffff)' },
            { map: 'cool', label: 'Cool', gradient: 'linear-gradient(90deg,#00ffff,#ff00ff)' },
            { map: 'gray', label: 'Gray', gradient: 'linear-gradient(90deg,#000000,#ffffff)' }
        ];

        colormapButtons.innerHTML = colormaps.map(({ map, label, gradient }, index) => `
            <button data-map="${map}" class="${index === 0 ? 'active' : ''}" title="${label} - ${map === 'jet' ? 'الأزرق إلى الأحمر' : map === 'hot' ? 'الأسود إلى الأحمر إلى الأصفر' : map === 'cool' ? 'السماوي إلى الأرجواني' : 'التدرج الرمادي'}">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>${label}</div>
                    <div style="width:100%;height:4px;background:${gradient};border-radius:2px"></div>
                </div>
            </button>
        `).join('');
    }

    /**
     * Create advanced machine settings
     */
    createAdvancedMachineSettings() {
        const advMachineCard = document.getElementById('adv-machine-body');
        if (!advMachineCard) return;

        advMachineCard.innerHTML = `
            <div class="adv-row">
                <label>Origin X</label><input id="adv_origin_x" class="adv-input" type="number" step="0.01" value="0">
                <label>Origin Y</label><input id="adv_origin_y" class="adv-input" type="number" step="0.01" value="0">
                <label>Origin Z</label><input id="adv_origin_z" class="adv-input" type="number" step="0.01" value="0">
            </div>
            <div class="adv-row">
                <label>Calib X</label><input id="adv_cal_x" class="adv-slider" type="range" min="-1" max="1" step="0.01" value="0">
                <span id="adv_cal_x_val" style="min-width:36px;text-align:center;color:#a8e9ff">0</span>
                <label>Calib Y</label><input id="adv_cal_y" class="adv-slider" type="range" min="-1" max="1" step="0.01" value="0">
                <span id="adv_cal_y_val" style="min-width:36px;text-align:center;color:#a8e9ff">0</span>
            </div>
            <div class="adv-row">
                <label>Reverse X</label><input id="adv_rev_x" type="checkbox">
                <label>Reverse Y</label><input id="adv_rev_y" type="checkbox">
            </div>
            <div class="adv-row">
                <label>Execution</label>
                <select id="adv_exec" class="adv-input">
                    <option value="raster">Raster</option>
                    <option value="contour">Contour</option>
                </select>
                <label>Delay (ms)</label><input id="adv_delay" class="adv-input" type="number" min="0" value="0" step="10">
            </div>
            <div class="adv-actions">
                <button id="adv_reset" class="dbg-btn">إرجاع الإعدادات الافتراضية</button>
                <div style="flex:1"></div>
                <button id="adv_save" class="dbg-btn">حفظ</button>
            </div>
        `;
    }

    /**
     * Update button visibility based on machine type
     */
    updateButtonVisibility(machineType) {
        const isLaser = machineType === 'laser';
        const is3D = machineType === 'threed';
        
        const elements = {
            router: ['btnGen', 'btnContour', 'btnQuick', 'btnCenterOrigin', 'btnDownload'],
            laser: ['btnLaserEngrave', 'btnLaserQuick', 'btnLaserCut', 'btnLaserDownload', 'btnRedetectLaser', 'btnLaserCenterOrigin'],
            threed: ['btnSliceModel', 'btnPreviewLayers', 'btnDownload3D', 'btnThreedCenterOrigin']
        };

        // Hide all elements first
        Object.values(elements).flat().forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = 'none';
        });

        // Show appropriate elements
        let toShow = [];
        if (isLaser) {
            toShow = elements.laser;
        } else if (is3D) {
            toShow = elements.threed;
        } else {
            toShow = elements.router;
        }
        
        toShow.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) elem.style.display = 'block';
        });
    }

    /**
     * Show loading state for a button
     */
    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '⏳ جاري المعالجة...';
        } else {
            button.disabled = false;
            // Reset button text based on ID
            const buttonTexts = {
                'btnGen': '⚡ توليد G-code (Raster)',
                'btnLaserEngrave': '⚡ توليد كود ليزر (نقش)',
                'btnSliceModel': '⚡ توليد G-code (3D)'
            };
            button.innerHTML = buttonTexts[buttonId] || button.textContent;
        }
    }
}

// Create global instance
const uiManager = new UIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, uiManager };
}
