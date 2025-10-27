/**
 * Input validation utilities for CNC AI application
 */
class InputValidator {
    /**
     * Validate number input with min/max constraints
     */
    static validateNumberInput(inputId, min, max, defaultValue = min) {
        try {
            const input = document.getElementById(inputId);
            if (!input) {
                throw new Error(`عنصر الإدخال ${inputId} غير موجود`);
            }
            
            let value = parseFloat(input.value);
            
            if (isNaN(value)) {
                showToast(`القيمة في ${inputId} غير صالحة`);
                input.value = defaultValue;
                return defaultValue;
            }
            
            if (value < min) {
                showToast(`القيمة في ${inputId} أقل من المسموح (${min})`);
                input.value = min;
                return min;
            }
            
            if (value > max) {
                showToast(`القيمة في ${inputId} أكبر من المسموح (${max})`);
                input.value = max;
                return max;
            }
            
            return value;
        } catch (error) {
            console.error(`خطأ في التحقق من ${inputId}:`, error);
            return defaultValue;
        }
    }

    /**
     * Validate image size and resize if too large
     */
    static validateImageSize(canvas) {
        if (!canvas) return false;
        
        const maxPixels = CONFIG.maxImagePixels;
        const currentPixels = canvas.width * canvas.height;
        
        if (currentPixels > maxPixels) {
            const ratio = Math.sqrt(maxPixels / currentPixels);
            const newWidth = Math.floor(canvas.width * ratio);
            const newHeight = Math.floor(canvas.height * ratio);
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            tempCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
            
            const ctx = canvas.getContext('2d');
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(tempCanvas, 0, 0);
            
            showToast('تم تقليل حجم الصورة للأداء الأفضل');
            return true;
        }
        return false;
    }

    /**
     * Validate laser settings
     */
    static validateLaserSettings() {
        const power = this.validateNumberInput('laserPower', 0, 100, 80);
        const speed = this.validateNumberInput('laserSpeed', 100, 10000, 2000);
        const passes = this.validateNumberInput('laserPasses', 1, 10, 1);
        
        return { power, speed, passes };
    }

    /**
     * Validate router settings
     */
    static validateRouterSettings() {
        const feedRate = this.validateNumberInput('feedRate', 10, 5000, 800);
        const safeZ = this.validateNumberInput('safeZ', 0, 100, 5);
        const maxDepth = this.validateNumberInput('maxDepth', 0.1, 50, 3);
        const stepOver = this.validateNumberInput('stepOver', 0.1, 50, 5);
        
        return { feedRate, safeZ, maxDepth, stepOver };
    }

    /**
     * Validate 3D printer settings
     */
    static validate3DSettings() {
        const layerHeight = this.validateNumberInput('threedLayerHeight', 0.05, 1.0, 0.2);
        const fillDensity = this.validateNumberInput('threedFillDensity', 0, 100, 20);
        const printSpeed = this.validateNumberInput('threedPrintSpeed', 10, 200, 50);
        const workDepth = this.validateNumberInput('threedWorkDepth', 0.1, 100, 10);
        
        return { layerHeight, fillDensity, printSpeed, workDepth };
    }

    /**
     * Validate file type and size
     */
    static validateFile(file, allowedTypes, maxSize = CONFIG.maxFileSize) {
        const errors = [];
        
        // Check file size
        if (file.size > maxSize) {
            errors.push(`حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)}MB). الحد الأقصى: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        }
        
        // Check file type
        let isValidType = false;
        if (Array.isArray(allowedTypes)) {
            isValidType = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type);
                } else {
                    return file.type.startsWith(type);
                }
            });
        }
        
        if (!isValidType) {
            errors.push(`نوع الملف غير مدعوم. الأنواع المسموحة: ${allowedTypes.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate all required inputs
     */
    static validateAllInputs() {
        const errors = [];
        
        // Validate basic dimensions
        const requiredInputs = [
            { id: 'workWidth', min: 1, max: 200 },
            { id: 'workHeight', min: 1, max: 200 },
            { id: 'laserWorkWidth', min: 1, max: 200 },
            { id: 'laserWorkHeight', min: 1, max: 200 },
            { id: 'threedWorkWidth', min: 1, max: 200 },
            { id: 'threedWorkHeight', min: 1, max: 200 }
        ];
        
        requiredInputs.forEach(input => {
            try {
                this.validateNumberInput(input.id, input.min, input.max);
            } catch (error) {
                errors.push(`خطأ في ${input.id}: ${error.message}`);
            }
        });
        
        // Validate machine-specific settings based on current selection
        const machineType = document.getElementById('machineCategory')?.value || 'router';
        
        switch (machineType) {
            case 'router':
                try {
                    this.validateRouterSettings();
                } catch (error) {
                    errors.push(`إعدادات الراوتر: ${error.message}`);
                }
                break;
            case 'laser':
                try {
                    this.validateLaserSettings();
                } catch (error) {
                    errors.push(`إعدادات الليزر: ${error.message}`);
                }
                break;
            case 'threed':
                try {
                    this.validate3DSettings();
                } catch (error) {
                    errors.push(`إعدادات الطباعة ثلاثية الأبعاد: ${error.message}`);
                }
                break;
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate G-code syntax (basic validation)
     */
    static validateGCode(gcode) {
        const errors = [];
        const lines = gcode.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith(';')) {
                return;
            }
            
            // Basic G-code command validation
            if (!trimmed.match(/^(G|M|T)\d+/i) && !trimmed.match(/^[XYZIJKFSP]\s*[-]?\d/)) {
                errors.push(`سطر ${index + 1}: بناء جملة غير صالح - "${trimmed}"`);
            }
            
            // Check for valid coordinates
            const coordMatch = trimmed.match(/[XYZ]\s*([-]?\d*\.?\d+)/g);
            if (coordMatch) {
                coordMatch.forEach(coord => {
                    const value = parseFloat(coord.substring(1));
                    if (isNaN(value)) {
                        errors.push(`سطر ${index + 1}: قيمة إحداثيات غير صالحة - "${coord}"`);
                    }
                });
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors,
            lineCount: lines.length,
            commandCount: lines.filter(line => line.trim() && !line.trim().startsWith(';')).length
        };
    }

    /**
     * Validate if image is loaded and ready for processing
     */
    static validateImageReady() {
        if (!APP_STATE.previewCanvas || APP_STATE.previewCanvas.width === 0 || APP_STATE.previewCanvas.height === 0) {
            throw new Error('لا توجد صورة محملة للمعالجة');
        }
        
        if (!APP_STATE.cvReady) {
            throw new Error('OpenCV غير جاهز بعد');
        }
        
        return true;
    }

    /**
     * Sanitize filename
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9\u0600-\u06FF\.\-_]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 100);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputValidator };
}
