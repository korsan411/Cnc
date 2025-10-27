// UI Manager for creating and managing interface elements
class UIManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Create machine settings panels
     */
    createMachineSettings() {
        try {
            const rightPanel = document.querySelector('.panel:nth-child(2)');
            if (!rightPanel) {
                console.error('Right panel not found');
                return;
            }

            // Remove existing machine settings if any
            const existingSettings = rightPanel.querySelector('.machine-settings-container');
            if (existingSettings) {
                existingSettings.remove();
            }

            const machineSettingsHTML = `
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

                <!-- Estimated Time -->
                <div id="estTime" style="margin-top:12px;color:#9bb0c8;text-align:center;padding:8px;background:#0f172a;border-radius:6px"></div>

                <!-- G-code Output -->
                <label for="gcodeOut" style="margin-top:12px">📄 مخرجات G-code</label>
                <textarea id="gcodeOut" readonly placeholder="سيظهر G-code هنا بعد التوليد..." style="height:180px;background:#021024;color:#cfeaf2;border-radius:8px;padding:10px;"></textarea>
            `;

            // Create container and insert after the h3
            const h3 = rightPanel.querySelector('h3');
            if (h3) {
                const container = document.createElement('div');
                container.className = 'machine-settings-container';
                container.innerHTML = machineSettingsHTML;
                h3.parentNode.insertBefore(container, h3.nextSibling);
            } else {
                rightPanel.insertAdjacentHTML('beforeend', machineSettingsHTML);
            }

            console.log('✅ تم إنشاء إعدادات الماكينة');
            this.initialized = true;

        } catch (error) {
            console.error('❌ فشل إنشاء إعدادات الماكينة:', error);
            throw error;
        }
    }

    /**
     * Create CNC Router settings
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

            <div class="inner-grid">
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
     * Create Laser Engraver settings
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

            <div class="inner-grid">
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
     * Create 3D Printer settings
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

            <div class="inner-grid">
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

        fileFormatSection.innerHTML = `
            <button data-format="stl" title="تحميل ملف STL (ثلاثي الأبعاد)">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>STL</div>
                    <div style="font-size:0.8rem;color:#9bb0c8">نموذج ثلاثي الأبعاد</div>
                </div>
            </button>
            <button data-format="svg" title="تحميل ملف SVG (رسوم متجهة)">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>SVG</div>
                    <div style="font-size:0.8rem;color:#9bb0c8">رسوم متجهة</div>
                </div>
            </button>
            <button data-format="dxf" title="تحميل ملف DXF (رسم CAD)">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>DXF</div>
                    <div style="font-size:0.8rem;color:#9bb0c8">رسم CAD</div>
                </div>
            </button>
        `;
    }

    /**
     * Create colormap buttons
     */
    createColormapButtons() {
        const colormapButtons = document.querySelector('.colormap-buttons');
        if (!colormapButtons) return;

        colormapButtons.innerHTML = `
            <button data-map="jet" class="active" title="Jet - الأزرق إلى الأحمر">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>Jet</div>
                    <div style="width:100%;height:4px;background:linear-gradient(90deg,#0000ff,#00ffff,#ffff00,#ff0000);border-radius:2px"></div>
                </div>
            </button>
            <button data-map="hot" title="Hot - الأسود إلى الأحمر إلى الأصفر">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>Hot</div>
                    <div style="width:100%;height:4px;background:linear-gradient(90deg,#000000,#ff0000,#ffff00,#ffffff);border-radius:2px"></div>
                </div>
            </button>
            <button data-map="cool" title="Cool - السماوي إلى الأرجواني">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>Cool</div>
                    <div style="width:100%;height:4px;background:linear-gradient(90deg,#00ffff,#ff00ff);border-radius:2px"></div>
                </div>
            </button>
            <button data-map="gray" title="Gray - التدرج الرمادي">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <div>Gray</div>
                    <div style="width:100%;height:4px;background:linear-gradient(90deg,#000000,#ffffff);border-radius:2px"></div>
                </div>
            </button>
        `;
    }

    /**
     * Initialize tab behavior
     */
    initTabBehavior() {
        try {
            document.querySelectorAll('.tab-buttons button').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active from all buttons
                    document.querySelectorAll('.tab-buttons button').forEach(b => {
                        b.classList.remove('active');
                    });
                    
                    // Hide all tab contents
                    document.querySelectorAll('.tab-content').forEach(tc => {
                        tc.classList.remove('active');
                    });
                    
                    // Activate current tab
                    btn.classList.add('active');
                    const tabId = btn.dataset.tab;
                    const tabContent = document.getElementById(tabId);
                    
                    if (tabContent) {
                        tabContent.classList.add('active');
                    }

                    // Special handling for simulation tab
                    if (tabId === 'simulation' && document.getElementById('gcodeOut')?.value) {
                        if (typeof initSimulation === 'function') {
                            initSimulation();
                        }
                    }
                });
            });
            
            console.log('✅ تم تهيئة سلوك التبويبات');
        } catch (error) {
            console.error('❌ فشل تهيئة سلوك التبويبات:', error);
        }
    }
}

// Create global instance
const uiManager = new UIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, uiManager };
}
