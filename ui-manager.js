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

            <label for="
