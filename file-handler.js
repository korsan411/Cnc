/**
 * File handling utilities for CNC AI application
 */
class FileHandler {
    constructor() {
        this.supportedFormats = CONFIG.supportedFormats;
        this.currentFile = null;
    }

    /**
     * Initialize file input handlers
     */
    init() {
        this.initImageFileInput();
        this.init3DFileInput();
        this.initFileFormatButtons();
        this.initDragAndDrop();
    }

    /**
     * Initialize image file input
     */
    initImageFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', async (e) => {
            await this.handleImageFile(e.target.files[0]);
        });
    }

    /**
     * Initialize 3D file input
     */
    init3DFileInput() {
        const fileInput = document.getElementById('threedFileInput');
        if (!fileInput) return;

        fileInput.addEventListener('change', async (e) => {
            await this.handle3DFile(e.target.files[0]);
        });
    }

    /**
     * Initialize file format buttons
     */
    initFileFormatButtons() {
        const buttons = document.querySelectorAll('#fileFormatButtons button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                this.handleFormatButtonClick(format);
            });
        });
    }

    /**
     * Initialize drag and drop
     */
    initDragAndDrop() {
        const containers = [
            document.getElementById('original'),
            document.getElementById('threed'),
            document.getElementById('vector2d')
        ];

        containers.forEach(container => {
            if (!container) return;

            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                container.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            });

            container.addEventListener('dragleave', (e) => {
                e.preventDefault();
                container.style.backgroundColor = '';
            });

            container.addEventListener('drop', async (e) => {
                e.preventDefault();
                container.style.backgroundColor = '';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    await this.handleDroppedFile(files[0], container.id);
                }
            });
        });
    }

    /**
     * Handle image file upload
     */
    async handleImageFile(file) {
        if (!file) return;

        // Validate file
        const validation = InputValidator.validateFile(file, this.supportedFormats.images);
        if (!validation.isValid) {
            validation.errors.forEach(error => showToast(error));
            return;
        }

        await taskManager.addTask(async () => {
            try {
                APP_STATE.isProcessing = true;
                memoryManager.cleanupMats();
                
                // Load image
                const img = await this.loadImage(file);
                
                // Setup canvas
                const canvas = document.getElementById('canvasOriginal');
                if (!canvas) throw new Error('عنصر canvas غير موجود');

                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('لا يمكن الحصول على سياق الرسم');

                // Set canvas dimensions
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Validate and resize if needed
                InputValidator.validateImageSize(canvas);

                APP_STATE.previewCanvas = canvas;
                showElement('canvasOriginal', 'originalPlaceholder');

                // Process with OpenCV if ready
                if (APP_STATE.cvReady) {
                    const machineType = document.getElementById('machineCategory').value;
                    if (machineType === 'laser') {
                        await detectLaserContours();
                    } else if (machineType === 'router') {
                        await detectContours();
                    }
                } else {
                    showToast('في انتظار OpenCV...');
                    await this.waitForOpenCV();
                    
                    const machineType = document.getElementById('machineCategory').value;
                    if (machineType === 'laser') {
                        await detectLaserContours();
                    } else if (machineType === 'router') {
                        await detectContours();
                    }
                }

                this.currentFile = file;
                showToast(`تم تحميل الصورة: ${file.name}`);

            } catch (error) {
                console.error('خطأ في تحميل الصورة:', error);
                throw new Error('فشل في تحميل الصورة: ' + error.message);
            } finally {
                APP_STATE.isProcessing = false;
            }
        }, 'تحميل الصورة');
    }

    /**
     * Handle 3D file upload
     */
    async handle3DFile(file) {
        if (!file) return;

        const validation = InputValidator.validateFile(file, this.supportedFormats.models3d);
        if (!validation.isValid) {
            validation.errors.forEach(error => showToast(error));
            return;
        }

        await taskManager.addTask(async () => {
            try {
                const extension = file.name.toLowerCase().split('.').pop();
                
                if (extension === 'stl' || extension === 'obj') {
                    await load3DModel(file);
                } else {
                    showToast('نوع الملف غير مدعوم للمعاينة ثلاثية الأبعاد');
                }
            } catch (error) {
                console.error('خطأ في تحميل الملف ثلاثي الأبعاد:', error);
                throw new Error('فشل في تحميل الملف ثلاثي الأبعاد: ' + error.message);
            }
        }, `تحميل ملف ${file.name}`);
    }

    /**
     * Handle file format button clicks
     */
    handleFormatButtonClick(format) {
        // Remove active class from all buttons
        document.querySelectorAll('#fileFormatButtons button').forEach(b => {
            b.classList.remove('active');
        });

        // Add active class to clicked button
        event.target.closest('button').classList.add('active');

        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';

        // Set accept attribute based on format
        switch(format) {
            case 'stl':
                fileInput.accept = '.stl';
                break;
            case 'svg':
                fileInput.accept = '.svg';
                break;
            case 'dxf':
                fileInput.accept = '.dxf';
                break;
        }

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            await this.handleFileFormatUpload(file, format);
            document.body.removeChild(fileInput);
        });

        document.body.appendChild(fileInput);
        fileInput.click();
    }

    /**
     * Handle file format uploads
     */
    async handleFileFormatUpload(file, format) {
        await taskManager.addTask(async () => {
            try {
                let message = '';
                
                switch(format) {
                    case 'stl':
                        message = 'تم تحميل ملف STL بنجاح. يمكنك معاينته في قسم 3D Models.';
                        await load3DModel(file);
                        break;
                    case 'svg':
                        message = 'تم تحميل ملف SVG بنجاح. يمكن تحويله إلى G-code.';
                        await loadSVGModel(file);
                        break;
                    case 'dxf':
                        message = 'تم تحميل ملف DXF بنجاح. يمكن تحويله إلى G-code.';
                        await loadDXFModel(file);
                        break;
                }
                
                showToast(`✅ ${message}`);
            } catch (error) {
                console.error(`خطأ في تحميل ملف ${format.toUpperCase()}:`, error);
                throw new Error(`فشل في تحميل ملف ${format.toUpperCase()}: ${error.message}`);
            }
        }, `تحميل ملف ${format.toUpperCase()}`);
    }

    /**
     * Handle dropped files
     */
    async handleDroppedFile(file, containerId) {
        const fileName = file.name.toLowerCase();
        
        try {
            if (fileName.match(/\.(jpg|jpeg|png|gif|bmp)$/)) {
                // Image file
                await this.handleImageFile(file);
            } else if (fileName.match(/\.(stl|obj)$/)) {
                // 3D model file
                await this.handle3DFile(file);
            } else if (fileName.match(/\.(svg)$/)) {
                // SVG file
                await loadSVGModel(file);
            } else if (fileName.match(/\.(dxf)$/)) {
                // DXF file
                await loadDXFModel(file);
            } else {
                showToast('نوع الملف غير مدعوم');
            }
        } catch (error) {
            console.error('خطأ في معالجة الملف المسقط:', error);
            showToast('فشل في معالجة الملف');
        }
    }

    /**
     * Load image from file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('فشل في تحميل الصورة'));
            };
            
            img.src = url;
        });
    }

    /**
     * Wait for OpenCV to be ready
     */
    async waitForOpenCV() {
        return new Promise((resolve) => {
            const check = () => {
                if (APP_STATE.cvReady) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    /**
     * Export G-code to file
     */
    exportGCode(gcode, filename = 'output.gcode') {
        try {
            if (!gcode) {
                showToast("لا يوجد G-code لتحميله");
                return false;
            }

            const now = new Date();
            const dateStr = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const machineType = document.getElementById('machineCategory').value;
            const safeFilename = InputValidator.sanitizeFilename(
                `${machineType}_output_${dateStr}.gcode`
            );

            if (downloadTextAsFile(gcode, safeFilename)) {
                showToast(`تم تحميل الملف: ${safeFilename}`);
                return true;
            } else {
                showToast('فشل في تحميل الملف');
                return false;
            }
        } catch (error) {
            console.error('خطأ في تصدير G-code:', error);
            showToast('فشل في تصدير الملف');
            return false;
        }
    }

    /**
     * Generate screenshot of canvas
     */
    captureCanvasScreenshot(canvasId, filename = 'screenshot.png') {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                throw new Error(`الكانفاس غير موجود: ${canvasId}`);
            }

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                showToast(`تم حفظ الصورة: ${filename}`);
            }, 'image/png');
        } catch (error) {
            console.error('خطأ في التقاط الصورة:', error);
            showToast('فشل في حفظ الصورة');
        }
    }

    /**
     * Get file information
     */
    getFileInfo(file) {
        return {
            name: file.name,
            size: this.formatFileSize(file.size),
            type: file.type,
            lastModified: new Date(file.lastModified).toLocaleString()
        };
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Check if file is supported
     */
    isFileSupported(file) {
        const fileName = file.name.toLowerCase();
        const allSupported = [
            ...this.supportedFormats.images,
            ...this.supportedFormats.models3d.map(ext => ext.substring(1)),
            ...this.supportedFormats.vectors.map(ext => ext.substring(1))
        ];

        return allSupported.some(ext => fileName.endsWith(ext));
    }
}

// Create global instance
const fileHandler = new FileHandler();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FileHandler, fileHandler };
}
