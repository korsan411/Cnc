// File Handler for CNC AI
class FileHandler {
    constructor() {
        this.currentFile = null;
        this.previewCanvas = null;
    }
/**
 * Show/hide clear image button
 */
toggleClearButton(show) {
    const clearBtn = document.getElementById('btnClearImage');
    if (clearBtn) {
        clearBtn.style.display = show ? 'block' : 'none';
    }
}
    /**
     * Initialize file input handling
     */
    initFileInput() {
        try {
            console.log('📁 Initializing file input...');
            
            const fileInput = document.getElementById('fileInput');
            if (!fileInput) {
                console.error('❌ File input element not found');
                return;
            }

            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });

            // Also handle drag and drop
            this.initDragAndDrop();

            console.log('✅ File input initialized');
        } catch (error) {
            console.error('❌ Failed to initialize file input:', error);
        }
    }

    /**
     * Initialize drag and drop
     */
    initDragAndDrop() {
        const leftPanel = document.querySelector('.panel');
        if (!leftPanel) return;

        leftPanel.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            leftPanel.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
        });

        leftPanel.addEventListener('dragleave', (e) => {
            e.preventDefault();
            leftPanel.style.backgroundColor = '';
        });

        leftPanel.addEventListener('drop', (e) => {
            e.preventDefault();
            leftPanel.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect({ target: { files: files } });
            }
        });
    }

    /**
     * Handle file selection
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Reset file input value to allow uploading same file again
        event.target.value = '';

        // Validate file type
        if (!this.validateFileType(file)) {
            showToast('نوع الملف غير مدعوم. الرجاء اختيار صورة (JPEG, PNG, etc.)');
            return;
        }

        // Validate file size
        if (!this.validateFileSize(file)) {
            showToast('حجم الملف كبير جداً. الرجاء اختيار صورة أصغر من 10MB');
            return;
        }

        try {
            showProgress('جاري تحميل الصورة...');
            
            await this.loadImageFile(file);
            
            hideProgress();
            showToast('تم تحميل الصورة بنجاح', 1500);

        } catch (error) {
            hideProgress();
            console.error('❌ Failed to load image:', error);
            showToast('فشل تحميل الصورة: ' + error.message, 4000);
        }
    }

    /**
     * Validate file type
     */
    validateFileType(file) {
        const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        return supportedTypes.includes(file.type);
    }

    /**
     * Validate file size
     */
    validateFileSize(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        return file.size <= maxSize;
    }

    /**
     * Load image file and display it
     */
    async loadImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                try {
                    URL.revokeObjectURL(url); // Clean up memory
                    this.displayImage(img);
                    this.currentFile = file;
                    resolve(img);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('فشل تحميل الصورة'));
            };

            img.src = url;
        });
    }

    /**
     * Display image on canvas
     */
    displayImage(img) {
        try {
            console.log('🖼️ Displaying image:', img.width, 'x', img.height);
            
            // Get or create preview canvas
            this.previewCanvas = document.getElementById('canvasOriginal');
            if (!this.previewCanvas) {
                console.error('❌ Preview canvas not found');
                return;
            }

            const ctx = this.previewCanvas.getContext('2d');
            if (!ctx) {
                console.error('❌ Canvas context not available');
                return;
            }

            // Resize image if too large for performance
            const maxDimension = 2000;
            let { width, height } = img;

            if (width > maxDimension || height > maxDimension) {
                const scale = maxDimension / Math.max(width, height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
                console.log(`🔄 Resized image to: ${width} x ${height}`);
            }

            // Set canvas dimensions
            this.previewCanvas.width = width;
            this.previewCanvas.height = height;

            // Draw image on canvas
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Show canvas and hide placeholder
            this.showImagePreview();

            // Store in global state
            APP_STATE.previewCanvas = this.previewCanvas;

            // Process image for edge detection if OpenCV is ready
            this.processImageForDetection();

            console.log('✅ Image displayed successfully');

        } catch (error) {
            console.error('❌ Failed to display image:', error);
            throw error;
        }
    }
/**
 * Show image preview
 */
showImagePreview() {
    // Show original tab canvas
    showElement('canvasOriginal', 'originalPlaceholder');

    // Show clear button
    this.toggleClearButton(true);

    // Switch to original tab
    this.switchToOriginalTab();

    // Update tab button to indicate image is loaded
    this.updateTabIndicators();
}

    /**
     * Switch to original image tab
     */
    switchToOriginalTab() {
        const originalTab = document.querySelector('[data-tab="original"]');
        if (originalTab) {
            originalTab.click();
        }
    }

    /**
     * Update tab indicators to show which tabs have content
     */
    updateTabIndicators() {
        const tabs = {
            'original': '🖼️',
            'heatmap': '🔥',
            'contour': '📐',
            'topview': '🔝',
            'threed': '🧊',
            'simulation': '🎬'
        };

        // Reset all tabs
        Object.keys(tabs).forEach(tabId => {
            const tab = document.querySelector(`[data-tab="${tabId}"]`);
            if (tab) {
                tab.textContent = tabs[tabId] + ' ' + tab.textContent.replace(/^.[^ ]* /, '');
            }
        });

        // Mark available tabs
        if (this.previewCanvas) {
            const availableTabs = ['original', 'heatmap', 'contour', 'topview'];
            availableTabs.forEach(tabId => {
                const tab = document.querySelector(`[data-tab="${tabId}"]`);
                if (tab) {
                    tab.textContent = '✅ ' + tab.textContent.replace(/^.[^ ]* /, '');
                }
            });
        }
    }
/**
 * Process image for edge detection
 */
async processImageForDetection() {
    if (!APP_STATE.previewCanvas) {
        console.log('⚠️ No preview canvas available for processing');
        return;
    }

    // Wait a bit for UI to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if OpenCV is ready
    if (typeof openCVHandler === 'undefined' || !openCVHandler.isReady) {
        console.log('⏳ OpenCV not ready, skipping image processing');
        showToast('OpenCV جاري التحميل... سيبدأ كشف الحواف تلقائياً عند الجاهزية');
        return;
    }

    try {
        console.log('🔍 Processing image for edge detection...');
        
        // Get current machine type
        const machineType = document.getElementById('machineCategory')?.value || 'router';
        
        // Process based on machine type
        if (machineType === 'laser') {
            if (typeof detectLaserContours === 'function') {
                await detectLaserContours();
            } else {
                console.error('❌ detectLaserContours function not available');
            }
        } else {
            if (typeof detectContours === 'function') {
                await detectContours();
            } else {
                console.error('❌ detectContours function not available');
            }
        }

    } catch (error) {
        console.error('❌ Failed to process image:', error);
    }
}

    /**
     * Get current preview canvas
     */
    getPreviewCanvas() {
        return this.previewCanvas;
    }

    /**
     * Check if image is loaded
     */
    isImageLoaded() {
        return this.previewCanvas !== null && 
               this.previewCanvas.width > 0 && 
               this.previewCanvas.height > 0;
    }
/**
 * Clear current image
 */
clearImage() {
    if (this.previewCanvas) {
        const ctx = this.previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    }
    
    this.previewCanvas = null;
    this.currentFile = null;
    APP_STATE.previewCanvas = null;

    // Hide canvas and show placeholder
    hideElement('canvasOriginal');
    const placeholder = document.getElementById('originalPlaceholder');
    if (placeholder) {
        placeholder.style.display = 'flex';
    }

    // Hide clear button
    this.toggleClearButton(false);

    // Reset tab indicators
    this.updateTabIndicators();

    showToast('تم مسح الصورة', 1500);
}

    /**
     * Get image dimensions
     */
    getImageDimensions() {
        if (!this.previewCanvas) {
            return { width: 0, height: 0 };
        }
        
        return {
            width: this.previewCanvas.width,
            height: this.previewCanvas.height
        };
    }
}

// Create global instance
const fileHandler = new FileHandler();

// Global functions for other modules
window.initFileInput = function() {
    return fileHandler.initFileInput();
};

window.getPreviewCanvas = function() {
    return fileHandler.getPreviewCanvas();
};

window.isImageLoaded = function() {
    return fileHandler.isImageLoaded();
};

window.clearImage = function() {
    return fileHandler.clearImage();
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize file input after a short delay to ensure DOM is fully loaded
    setTimeout(() => {
        if (typeof fileHandler !== 'undefined') {
            fileHandler.initFileInput();
        }
    }, 1000);
});

console.log('✅ File Handler module loaded');
