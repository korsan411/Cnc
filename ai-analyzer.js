/**
 * AI-powered image analysis for CNC AI application
 */
class AIAnalyzer {
    constructor() {
        this.analysisResults = null;
        this.isAnalyzing = false;
    }

    /**
     * Initialize AI analyzer
     */
    init() {
        this.createAITab();
        this.setupEventListeners();
    }

    /**
     * Create AI analysis tab content
     */
    createAITab() {
        // Check if tab already exists
        if (document.getElementById('ai-analysis')) {
            return;
        }

        const tabBar = document.querySelector('.tab-buttons');
        const leftPanel = document.querySelector('.panel');

        if (!tabBar || !leftPanel) {
            console.warn('AI tab creation: Required elements not found');
            return;
        }

        try {
            // Create tab button
            const tabButton = document.createElement('button');
            tabButton.setAttribute('data-tab', 'ai-analysis');
            tabButton.textContent = '🧠 تحليل الصورة';
            tabBar.appendChild(tabButton);

            // Create tab content
            const tabContent = document.createElement('div');
            tabContent.id = 'ai-analysis';
            tabContent.className = 'tab-content';
            tabContent.innerHTML = this.getAITabHTML();
            leftPanel.appendChild(tabContent);

            console.log('AI analysis tab created successfully');

        } catch (error) {
            console.error('Failed to create AI tab:', error);
        }
    }

    /**
     * Get AI tab HTML content
     */
    getAITabHTML() {
        return `
            <h2>🧠 تحليل الصورة المتقدم</h2>
            <p>تحليل شامل للسطوع، التباين، الحدة، الملمس، كثافة الحواف وتوصيات الماكينة.</p>
            
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:16px 0;">
                <button id="runAiAnalysis" class="action-btn">بدء التحليل</button>
                <button id="aiApplyToMachine" class="action-btn" style="display:none">تطبيق التوصيات</button>
                <button id="aiCopyResult" class="action-btn" style="display:none">نسخ النتائج</button>
                <span id="aiStatus" style="margin-inline-start:8px;color:#9fb6c3"></span>
            </div>

            <div id="aiResults" style="display:none;">
                <div id="aiTableWrap" style="margin-top:12px;">
                    <table id="aiResultTable" style="width:100%;border-collapse:collapse;text-align:right">
                        <thead>
                            <tr style="text-align:right">
                                <th style="padding:12px;border-bottom:2px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)">المؤشر</th>
                                <th style="padding:12px;border-bottom:2px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)">القيمة</th>
                                <th style="padding:12px;border-bottom:2px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)">التقييم</th>
                            </tr>
                        </thead>
                        <tbody id="aiResultBody"></tbody>
                    </table>
                </div>

                <div id="aiRecommendations" style="margin-top:20px;padding:16px;background:rgba(14,23,33,0.6);border-radius:8px;border-left:4px solid #06b6d4;">
                    <h4 style="margin-top:0;color:#cfeaf2;">🎯 التوصيات</h4>
                    <div id="aiRecContent"></div>
                </div>

                <img id="aiPreviewImage" class="preview-img" style="display:none;margin-top:16px;max-width:100%;border-radius:8px;" alt="صورة مصغرة للتحليل"/>
            </div>

            <div id="aiNoImage" style="text-align:center;padding:40px 20px;color:#9bb0c8;display:none;">
                <div style="font-size:48px;margin-bottom:16px;">🖼️</div>
                <h3 style="color:#cfeaf2;margin-bottom:8px;">لا توجد صورة محملة</h3>
                <p>قم بتحميل صورة أولاً لاستخدام التحليل المتقدم</p>
                <button onclick="document.getElementById('fileInput').click()" class="action-btn" style="margin-top:16px;">
                    📁 تحميل صورة
                </button>
            </div>
        `;
    }

    /**
     * Setup event listeners for AI analyzer
     */
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'runAiAnalysis') {
                this.runAnalysis();
            } else if (e.target.id === 'aiApplyToMachine') {
                this.applyRecommendations();
            } else if (e.target.id === 'aiCopyResult') {
                this.copyResults();
            }
        });

        // Handle tab switching
        const aiTabBtn = document.querySelector('.tab-buttons button[data-tab="ai-analysis"]');
        if (aiTabBtn) {
            aiTabBtn.addEventListener('click', () => {
                this.onTabActivated();
            });
        }
    }

    /**
     * Called when AI tab is activated
     */
    onTabActivated() {
        if (!APP_STATE.previewCanvas) {
            this.showNoImageMessage();
        } else {
            this.hideNoImageMessage();
        }
    }

    /**
     * Show no image message
     */
    showNoImageMessage() {
        const resultsDiv = document.getElementById('aiResults');
        const noImageDiv = document.getElementById('aiNoImage');
        
        if (resultsDiv) resultsDiv.style.display = 'none';
        if (noImageDiv) noImageDiv.style.display = 'block';
    }

    /**
     * Hide no image message
     */
    hideNoImageMessage() {
        const resultsDiv = document.getElementById('aiResults');
        const noImageDiv = document.getElementById('aiNoImage');
        
        if (resultsDiv) resultsDiv.style.display = 'block';
        if (noImageDiv) noImageDiv.style.display = 'none';
    }

    /**
     * Run advanced image analysis
     */
    async runAnalysis() {
        if (!APP_STATE.previewCanvas) {
            showToast('لا توجد صورة محملة للتحليل');
            return;
        }

        if (this.isAnalyzing) {
            showToast('جاري التحليل بالفعل...');
            return;
        }

        await taskManager.addTask(async () => {
            try {
                this.isAnalyzing = true;
                this.updateStatus('جاري التحليل...');
                
                showProgress('جاري تحليل الصورة المتقدم...');
                
                const results = await this.analyzeImage(APP_STATE.previewCanvas);
                this.analysisResults = results;
                
                this.displayResults(results);
                this.updateStatus('اكتمل التحليل');
                
                showToast('تم تحليل الصورة بنجاح');
                
            } catch (error) {
                console.error('AI analysis error:', error);
                this.updateStatus('فشل التحليل');
                throw new Error('فشل في تحليل الصورة: ' + error.message);
            } finally {
                this.isAnalyzing = false;
                hideProgress();
            }
        }, 'تحليل الصورة المتقدم');
    }

    /**
     * Analyze image using OpenCV
     */
    async analyzeImage(canvas) {
        if (!APP_STATE.cvReady) {
            throw new Error('OpenCV غير جاهز');
        }

        // Wait for OpenCV if needed
        let waited = 0;
        while ((typeof cv === 'undefined' || !cv.Mat) && waited < 8000) {
            await new Promise(resolve => setTimeout(resolve, 200));
            waited += 200;
        }

        if (typeof cv === 'undefined' || !cv.Mat) {
            throw new Error('OpenCV not ready');
        }

        let src = null, gray = null, blurred = null;
        
        try {
            // Resize image for performance if needed
            const maxDim = 1024;
            const w = canvas.width, h = canvas.height;
            let scale = 1;
            
            if (Math.max(w, h) > maxDim) {
                scale = maxDim / Math.max(w, h);
            }
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.max(1, Math.round(w * scale));
            tempCanvas.height = Math.max(1, Math.round(h * scale));
            tempCanvas.getContext('2d').drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

            // Read image
            src = opencvHandler.imreadSafe(tempCanvas, 'ai_analysis_src');
            
            if (!src || src.rows === 0 || src.cols === 0) {
                throw new Error('empty-mat');
            }

            // Convert to grayscale
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            memoryManager.track(gray, 'ai_gray');

            // Calculate basic statistics
            const mean = new cv.Mat();
            const stddev = new cv.Mat();
            cv.meanStdDev(gray, mean, stddev);
            
            const brightness = mean.data64F ? Math.round(mean.data64F[0]) : Math.round(mean.data[0]);
            const contrast = stddev.data64F ? Math.round(stddev.data64F[0]) : Math.round(stddev.data[0]);

            // Calculate sharpness (Laplacian variance)
            let sharpness = 0;
            try {
                const laplacian = new cv.Mat();
                cv.Laplacian(gray, laplacian, cv.CV_64F);
                const meanLap = new cv.Mat();
                const stdLap = new cv.Mat();
                cv.meanStdDev(laplacian, meanLap, stdLap);
                sharpness = stdLap.data64F ? Math.round(stdLap.data64F[0]) : 0;
                memoryManager.safeDelete(laplacian);
                memoryManager.safeDelete(meanLap);
                memoryManager.safeDelete(stdLap);
            } catch (e) {
                console.warn('Sharpness calculation failed:', e);
            }

            // Calculate texture (local variance)
            let texture = 0;
            try {
                const blurred = new cv.Mat();
                cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0);
                const diff = new cv.Mat();
                cv.absdiff(gray, blurred, diff);
                const textureMean = cv.mean(diff);
                texture = textureMean && textureMean.length ? Math.round(textureMean[0]) : 0;
                memoryManager.safeDelete(blurred);
                memoryManager.safeDelete(diff);
            } catch (e) {
                console.warn('Texture calculation failed:', e);
            }

            // Calculate edge density
            let edgeDensity = 0;
            try {
                const edges = new cv.Mat();
                cv.Canny(gray, edges, 80, 160);
                const edgeCount = cv.countNonZero(edges);
                edgeDensity = Math.round((edgeCount / (edges.rows * edges.cols)) * 100);
                memoryManager.safeDelete(edges);
            } catch (e) {
                console.warn('Edge density calculation failed:', e);
            }

            // Determine material type based on analysis
            const material = this.determineMaterial(brightness, contrast, sharpness, texture);
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(material, brightness, contrast, sharpness, edgeDensity);

            return {
                brightness,
                contrast,
                sharpness,
                texture,
                edgeDensity,
                material,
                recommendations,
                timestamp: Date.now(),
                imageStats: {
                    width: gray.cols,
                    height: gray.rows,
                    aspectRatio: (gray.cols / gray.rows).toFixed(2)
                }
            };

        } finally {
            memoryManager.safeDelete(src);
            memoryManager.safeDelete(gray);
            memoryManager.safeDelete(blurred);
        }
    }

    /**
     * Determine material type based on image characteristics
     */
    determineMaterial(brightness, contrast, sharpness, texture) {
        if (contrast < 40 && texture < 30) {
            return 'خشب لين';
        } else if (contrast > 70 && sharpness > 80) {
            return 'معدن';
        } else if (brightness > 180 && contrast < 50) {
            return 'بلاستيك فاتح';
        } else if (brightness < 80 && contrast > 60) {
            return 'خشب صلب';
        } else {
            return 'بلاستيك/خشب صلب';
        }
    }

    /**
     * Generate machine recommendations based on analysis
     */
    generateRecommendations(material, brightness, contrast, sharpness, edgeDensity) {
        const recommendations = {
            material: material,
            speed: 1200,
            depth: 0.8,
            sensitivity: 0.5,
            stepOver: 5,
            notes: []
        };

        // Adjust based on material
        switch (material) {
            case 'خشب لين':
                recommendations.speed = 2000;
                recommendations.depth = 1.5;
                recommendations.sensitivity = 0.7;
                recommendations.stepOver = 6;
                recommendations.notes.push('الخشب اللين يتطلب سرعة أعلى وعمق أكبر');
                break;
                
            case 'معدن':
                recommendations.speed = 700;
                recommendations.depth = 0.4;
                recommendations.sensitivity = 0.2;
                recommendations.stepOver = 3;
                recommendations.notes.push('المعادن تتطلب سرعة منخفضة وعمق أقل');
                break;
                
            case 'بلاستيك فاتح':
                recommendations.speed = 1500;
                recommendations.depth = 1.0;
                recommendations.sensitivity = 0.6;
                recommendations.notes.push('البلاستيك الفاتح حساس للحرارة - استخدم تبريداً مناسباً');
                break;
                
            case 'خشب صلب':
                recommendations.speed = 1000;
                recommendations.depth = 1.2;
                recommendations.sensitivity = 0.5;
                recommendations.notes.push('الخشب الصلب متين ويتحمل النحت المتوسط');
                break;
        }

        // Adjust based on contrast and sharpness
        if (contrast > 60) {
            recommendations.sensitivity = Math.min(recommendations.sensitivity + 0.1, 0.9);
            recommendations.notes.push('التباين العالي يسمح بحساسية أعلى للحواف');
        }

        if (sharpness < 30) {
            recommendations.speed = Math.max(recommendations.speed - 200, 500);
            recommendations.notes.push('الحدة المنخفضة تتطلب سرعة أقل لتحسين الجودة');
        }

        if (edgeDensity > 50) {
            recommendations.stepOver = Math.max(recommendations.stepOver - 1, 2);
            recommendations.notes.push('كثافة الحواف العالية تتطلب خطوة مسح أصغر');
        }

        return recommendations;
    }

    /**
     * Display analysis results
     */
    displayResults(results) {
        if (!results) return;

        // Show action buttons
        const applyBtn = document.getElementById('aiApplyToMachine');
        const copyBtn = document.getElementById('aiCopyResult');
        if (applyBtn) applyBtn.style.display = 'inline-block';
        if (copyBtn) copyBtn.style.display = 'inline-block';

        // Update results table
        this.updateResultsTable(results);

        // Update recommendations
        this.updateRecommendations(results.recommendations);

        // Show preview image
        this.showPreviewImage();
    }

    /**
     * Update results table
     */
    updateResultsTable(results) {
        const tbody = document.getElementById('aiResultBody');
        if (!tbody) return;

        const rows = [
            { label: 'السطوع (Brightness)', value: results.brightness, assessment: this.assessBrightness(results.brightness) },
            { label: 'التباين (Contrast)', value: results.contrast, assessment: this.assessContrast(results.contrast) },
            { label: 'الحدة (Sharpness)', value: results.sharpness, assessment: this.assessSharpness(results.sharpness) },
            { label: 'الملمس (Texture)', value: results.texture, assessment: this.assessTexture(results.texture) },
            { label: 'كثافة الحواف', value: results.edgeDensity + '%', assessment: this.assessEdgeDensity(results.edgeDensity) },
            { label: 'نوع المادة', value: results.material, assessment: 'محدد آلياً' },
            { label: 'أبعاد الصورة', value: `${results.imageStats.width} × ${results.imageStats.height}`, assessment: `نسبة ${results.imageStats.aspectRatio}` }
        ];

        tbody.innerHTML = rows.map(row => `
            <tr>
                <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05)">${row.label}</td>
                <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05)">${row.value}</td>
                <td style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);color:#cfeaf2">${row.assessment}</td>
            </tr>
        `).join('');
    }

    /**
     * Assessment helpers
     */
    assessBrightness(value) {
        if (value < 50) return '🔅 مظلم';
        if (value < 100) return '🔅 معتدل';
        if (value < 180) return '🔅 جيد';
        return '🔅 ساطع جداً';
    }

    assessContrast(value) {
        if (value < 30) return '⚫ منخفض';
        if (value < 60) return '⚫ متوسط';
        if (value < 80) return '⚫ جيد';
        return '⚫ عالي';
    }

    assessSharpness(value) {
        if (value < 20) return '🔍 ناعم';
        if (value < 50) return '🔍 معتدل';
        if (value < 80) return '🔍 حاد';
        return '🔍 حاد جداً';
    }

    assessTexture(value) {
        if (value < 20) return '🌀 أملس';
        if (value < 40) return '🌀 متوسط';
        return '🌀 خشن';
    }

    assessEdgeDensity(value) {
        if (value < 20) return '📐 منخفضة';
        if (value < 40) return '📐 متوسطة';
        if (value < 60) return '📐 عالية';
        return '📐 عالية جداً';
    }

    /**
     * Update recommendations display
     */
    updateRecommendations(recommendations) {
        const recContent = document.getElementById('aiRecContent');
        if (!recContent) return;

        recContent.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:16px;">
                <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;">
                    <div style="font-size:0.9rem;color:#9bb0c8;">السرعة</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#06b6d4;">${recommendations.speed} مم/د</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;">
                    <div style="font-size:0.9rem;color:#9bb0c8;">العمق</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#10b981;">${recommendations.depth} مم</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;">
                    <div style="font-size:0.9rem;color:#9bb0c8;">حساسية الحواف</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#f59e0b;">${recommendations.sensitivity}</div>
                </div>
                <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:6px;">
                    <div style="font-size:0.9rem;color:#9bb0c8;">خطوة المسح</div>
                    <div style="font-size:1.2rem;font-weight:bold;color:#ef4444;">${recommendations.stepOver} مم</div>
                </div>
            </div>
            
            ${recommendations.notes.length > 0 ? `
                <div style="margin-top:12px;">
                    <strong>ملاحظات:</strong>
                    <ul style="margin:8px 0;padding-right:20px;">
                        ${recommendations.notes.map(note => `<li style="margin-bottom:4px;">${note}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    /**
     * Show preview image
     */
    showPreviewImage() {
        const previewImg = document.getElementById('aiPreviewImage');
        if (!previewImg || !APP_STATE.previewCanvas) return;

        // Create a smaller preview
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 300;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(APP_STATE.previewCanvas, 0, 0, 400, 300);
        
        previewImg.src = tempCanvas.toDataURL();
        previewImg.style.display = 'block';
    }

    /**
     * Apply recommendations to machine settings
     */
    applyRecommendations() {
        if (!this.analysisResults || !this.analysisResults.recommendations) {
            showToast('لا توجد توصيات لتطبيقها');
            return;
        }

        const rec = this.analysisResults.recommendations;
        
        try {
            // Apply to router settings
            const feedRate = document.getElementById('feedRate');
            const maxDepth = document.getElementById('maxDepth');
            const stepOver = document.getElementById('stepOver');
            const edgeSensitivity = document.getElementById('edgeSensitivity');

            if (feedRate) {
                feedRate.value = rec.speed;
                feedRate.dispatchEvent(new Event('change'));
            }
            
            if (maxDepth) {
                maxDepth.value = rec.depth;
                maxDepth.dispatchEvent(new Event('change'));
            }
            
            if (stepOver) {
                stepOver.value = rec.stepOver;
                stepOver.dispatchEvent(new Event('change'));
            }
            
            if (edgeSensitivity) {
                edgeSensitivity.value = rec.sensitivity;
                edgeSensitivity.dispatchEvent(new Event('input'));
            }

            showToast('تم تطبيق التوصيات على إعدادات الماكينة');
            
        } catch (error) {
            console.error('Failed to apply recommendations:', error);
            showToast('فشل في تطبيق بعض التوصيات');
        }
    }

    /**
     * Copy results to clipboard
     */
    async copyResults() {
        if (!this.analysisResults) {
            showToast('لا توجد نتائج للنسخ');
            return;
        }

        try {
            const text = this.formatResultsForCopy();
            await navigator.clipboard.writeText(text);
            showToast('تم نسخ النتائج إلى الحافظة');
        } catch (error) {
            console.error('Failed to copy results:', error);
            showToast('فشل في نسخ النتائج');
        }
    }

    /**
     * Format results for copy/paste
     */
    formatResultsForCopy() {
        const r = this.analysisResults;
        const rec = r.recommendations;
        
        return `تحليل الصورة المتقدم - CNC AI
────────────────────────
السطوع: ${r.brightness} (${this.assessBrightness(r.brightness)})
التباين: ${r.contrast} (${this.assessContrast(r.contrast)})
الحدة: ${r.sharpness} (${this.assessSharpness(r.sharpness)})
الملمس: ${r.texture} (${this.assessTexture(r.texture)})
كثافة الحواف: ${r.edgeDensity}% (${this.assessEdgeDensity(r.edgeDensity)})
نوع المادة: ${r.material}

🎯 التوصيات:
• السرعة: ${rec.speed} مم/دقيقة
• العمق: ${rec.depth} مم
• حساسية الحواف: ${rec.sensitivity}
• خطوة المسح: ${rec.stepOver} مم

${rec.notes.length > 0 ? 'ملاحظات:\n' + rec.notes.map(note => '• ' + note).join('\n') : ''}

تم التحليل في: ${new Date(r.timestamp).toLocaleString('ar-SA')}`;
    }

    /**
     * Update status display
     */
    updateStatus(status) {
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * Get analysis history
     */
    getAnalysisHistory() {
        // In a real implementation, this would store/retrieve from localStorage
        return this.analysisResults ? [this.analysisResults] : [];
    }

    /**
     * Export analysis report
     */
    exportReport() {
        if (!this.analysisResults) {
            showToast('لا توجد نتائج لتصديرها');
            return;
        }

        const report = this.formatResultsForCopy();
        const filename = `cnc_ai_analysis_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.txt`;
        
        if (downloadTextAsFile(report, filename)) {
            showToast(`تم تصدير التقرير: ${filename}`);
        }
    }
}

// Create global instance
const aiAnalyzer = new AIAnalyzer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIAnalyzer, aiAnalyzer };
}
