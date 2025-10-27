/**
 * Advanced Machine Settings Manager
 * Handles advanced calibration and machine-specific transformations
 */
class AdvancedMachineManager {
    constructor() {
        this.settings = null;
        this.storageKey = 'cnc_machine_advanced_v2';
        this.isInitialized = false;
    }

    /**
     * Initialize advanced machine settings
     */
    init() {
        if (this.isInitialized) return;

        this.loadSettings();
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log('تم تهيئة الإعدادات المتقدمة للماكينة');
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.settings = JSON.parse(stored);
            } else {
                this.settings = this.getDefaultSettings();
            }
        } catch (error) {
            console.error('فشل تحميل الإعدادات المتقدمة:', error);
            this.settings = this.getDefaultSettings();
        }

        this.updateUI();
        return this.settings;
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            origin_x: 0,
            origin_y: 0,
            origin_z: 0,
            cal_x: 0,
            cal_y: 0,
            rev_x: false,
            rev_y: false,
            exec: 'raster',
            delay: 0
        };
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settingsToSave = {
                origin_x: parseFloat(document.getElementById('adv_origin_x')?.value) || 0,
                origin_y: parseFloat(document.getElementById('adv_origin_y')?.value) || 0,
                origin_z: parseFloat(document.getElementById('adv_origin_z')?.value) || 0,
                cal_x: parseFloat(document.getElementById('adv_cal_x')?.value) || 0,
                cal_y: parseFloat(document.getElementById('adv_cal_y')?.value) || 0,
                rev_x: !!document.getElementById('adv_rev_x')?.checked,
                rev_y: !!document.getElementById('adv_rev_y')?.checked,
                exec: document.getElementById('adv_exec')?.value || 'raster',
                delay: parseInt(document.getElementById('adv_delay')?.value) || 0
            };

            localStorage.setItem(this.storageKey, JSON.stringify(settingsToSave));
            this.settings = settingsToSave;
            
            console.log('تم حفظ الإعدادات المتقدمة:', this.settings);
            showToast('تم حفظ الإعدادات المتقدمة');
            
            return this.settings;
        } catch (error) {
            console.error('فشل حفظ الإعدادات المتقدمة:', error);
            showToast('فشل حفظ الإعدادات المتقدمة', 3000);
            return null;
        }
    }

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        this.settings = this.getDefaultSettings();
        
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('فشل حذف الإعدادات من التخزين:', error);
        }
        
        this.updateUI();
        showToast('تم إرجاع الإعدادات إلى الافتراضية');
        
        return this.settings;
    }

    /**
     * Update UI with current settings
     */
    updateUI() {
        if (!this.settings) return;

        // Update input fields
        this.setValue('adv_origin_x', this.settings.origin_x);
        this.setValue('adv_origin_y', this.settings.origin_y);
        this.setValue('adv_origin_z', this.settings.origin_z);
        this.setValue('adv_cal_x', this.settings.cal_x);
        this.setValue('adv_cal_y', this.settings.cal_y);
        this.setValue('adv_rev_x', this.settings.rev_x);
        this.setValue('adv_rev_y', this.settings.rev_y);
        this.setValue('adv_exec', this.settings.exec);
        this.setValue('adv_delay', this.settings.delay);

        // Update slider displays
        this.setValue('adv_cal_x_val', this.settings.cal_x);
        this.setValue('adv_cal_y_val', this.settings.cal_y);
    }

    /**
     * Set value for an element
     */
    setValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (element.type === 'checkbox') {
            element.checked = !!value;
        } else {
            element.value = value;
        }
    }

    /**
     * Setup event listeners for advanced settings
     */
    setupEventListeners() {
        // Toggle advanced settings panel
        const toggle = document.getElementById('adv-machine-toggle');
        const body = document.getElementById('adv-machine-body');
        const arrow = document.getElementById('adv-arrow');

        if (toggle && body && arrow) {
            toggle.addEventListener('click', () => {
                const isOpen = body.style.display === 'flex';
                body.style.display = isOpen ? 'none' : 'flex';
                body.setAttribute('aria-hidden', !isOpen);
                arrow.textContent = isOpen ? '▼' : '▲';
            });
        }

        // Live update for calibration sliders
        const calX = document.getElementById('adv_cal_x');
        const calY = document.getElementById('adv_cal_y');
        const calXVal = document.getElementById('adv_cal_x_val');
        const calYVal = document.getElementById('adv_cal_y_val');

        if (calX && calXVal) {
            calX.addEventListener('input', () => {
                calXVal.textContent = calX.value;
                this.saveSettings();
            });
        }

        if (calY && calYVal) {
            calY.addEventListener('input', () => {
                calYVal.textContent = calY.value;
                this.saveSettings();
            });
        }

        // Save on changes for other inputs
        const saveInputs = ['adv_origin_x', 'adv_origin_y', 'adv_origin_z', 'adv_rev_x', 'adv_rev_y', 'adv_exec', 'adv_delay'];
        saveInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('change', () => this.saveSettings());
            }
        });

        // Reset button
        const resetBtn = document.getElementById('adv_reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetSettings());
        }

        // Save button
        const saveBtn = document.getElementById('adv_save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    /**
     * Apply advanced machine settings to G-code
     */
    applyAdvancedMachineSettings(gcode, customSettings = null) {
        if (!gcode || typeof gcode !== 'string') return gcode;

        const settings = customSettings || this.settings;
        if (!settings) return gcode;

        try {
            // Parse G-code into structured format
            const parsed = this.parseGCode(gcode);
            
            // Apply transformations
            const transformed = parsed.map(line => {
                if (!line.command) return line.original;

                let newLine = line.original;
                
                // Apply coordinate transformations for G0 and G1 commands
                if (line.command === 'G0' || line.command === 'G1') {
                    newLine = this.transformCoordinates(newLine, settings);
                }

                return newLine;
            });

            return transformed.join('\n');
        } catch (error) {
            console.error('فشل في تطبيق الإعدادات المتقدمة على G-code:', error);
            return gcode;
        }
    }

    /**
     * Parse G-code into structured format
     */
    parseGCode(gcodeText) {
        const lines = gcodeText.split('\n');
        return lines.map(originalLine => {
            const trimmed = originalLine.trim();
            
            if (!trimmed || trimmed.startsWith(';')) {
                return { original: originalLine, command: null };
            }

            // Extract command and parameters
            const commandMatch = trimmed.match(/^([GM]\d+)/i);
            if (!commandMatch) {
                return { original: originalLine, command: null };
            }

            return {
                original: originalLine,
                command: commandMatch[1].toUpperCase(),
                parameters: this.extractParameters(trimmed)
            };
        });
    }

    /**
     * Extract parameters from G-code line
     */
    extractParameters(line) {
        const params = {};
        const paramRegex = /([XYZIJKFSP])\s*(-?\d*\.?\d+)/gi;
        let match;

        while ((match = paramRegex.exec(line)) !== null) {
            const key = match[1].toUpperCase();
            const value = parseFloat(match[2]);
            if (!isNaN(value)) {
                params[key] = value;
            }
        }

        return params;
    }

    /**
     * Transform coordinates based on settings
     */
    transformCoordinates(line, settings) {
        let transformedLine = line;

        // Apply transformations for each axis
        ['X', 'Y', 'Z'].forEach(axis => {
            const regex = new RegExp(`(${axis})(-?\\d+(?:\\.\\d+)?)`, 'i');
            if (regex.test(transformedLine)) {
                transformedLine = transformedLine.replace(regex, (match, axisChar, valueStr) => {
                    let value = parseFloat(valueStr);
                    
                    // Apply transformations based on axis
                    switch (axisChar.toUpperCase()) {
                        case 'X':
                            if (settings.rev_x) value = -value;
                            if (settings.origin_x) value += settings.origin_x;
                            if (settings.cal_x) value *= (1 + settings.cal_x);
                            break;
                            
                        case 'Y':
                            if (settings.rev_y) value = -value;
                            if (settings.origin_y) value += settings.origin_y;
                            if (settings.cal_y) value *= (1 + settings.cal_y);
                            break;
                            
                        case 'Z':
                            if (settings.origin_z) value += settings.origin_z;
                            break;
                    }
                    
                    return axisChar + value.toFixed(4);
                });
            }
        });

        return transformedLine;
    }

    /**
     * Get current settings
     */
    getSettings() {
        return this.settings || this.loadSettings();
    }

    /**
     * Validate settings
     */
    validateSettings(settings) {
        const errors = [];

        if (Math.abs(settings.cal_x) > 1) {
            errors.push('معايرة X خارج النطاق المسموح (-1 إلى 1)');
        }

        if (Math.abs(settings.cal_y) > 1) {
            errors.push('معايرة Y خارج النطاق المسموح (-1 إلى 1)');
        }

        if (Math.abs(settings.origin_x) > 1000) {
            errors.push('نقطة أصل X كبيرة جداً');
        }

        if (Math.abs(settings.origin_y) > 1000) {
            errors.push('نقطة أصل Y كبيرة جداً');
        }

        if (Math.abs(settings.origin_z) > 1000) {
            errors.push('نقطة أصل Z كبيرة جداً');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Export settings as file
     */
    exportSettings() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cncai-advanced-settings-${timestamp}.json`;
        const content = JSON.stringify(this.settings, null, 2);
        
        if (downloadTextAsFile(content, filename)) {
            showToast('تم تصدير الإعدادات المتقدمة');
            return true;
        } else {
            showToast('فشل تصدير الإعدادات', 3000);
            return false;
        }
    }

    /**
     * Import settings from file
     */
    importSettings(fileContent) {
        try {
            const importedSettings = JSON.parse(fileContent);
            const validation = this.validateSettings(importedSettings);
            
            if (validation.isValid) {
                this.settings = { ...this.getDefaultSettings(), ...importedSettings };
                this.saveSettings();
                this.updateUI();
                showToast('تم استيراد الإعدادات المتقدمة بنجاح');
                return true;
            } else {
                showToast(`إعدادات غير صالحة: ${validation.errors.join(', ')}`, 5000);
                return false;
            }
        } catch (error) {
            showToast('فشل استيراد الإعدادات: ملف غير صالح', 5000);
            return false;
        }
    }

    /**
     * Calculate machine limits based on settings
     */
    calculateMachineLimits(workArea) {
        const limits = {
            minX: workArea.minX,
            maxX: workArea.maxX,
            minY: workArea.minY,
            maxY: workArea.maxY,
            minZ: workArea.minZ,
            maxZ: workArea.maxZ
        };

        // Apply origin offsets
        if (this.settings.origin_x) {
            limits.minX += this.settings.origin_x;
            limits.maxX += this.settings.origin_x;
        }

        if (this.settings.origin_y) {
            limits.minY += this.settings.origin_y;
            limits.maxY += this.settings.origin_y;
        }

        if (this.settings.origin_z) {
            limits.minZ += this.settings.origin_z;
            limits.maxZ += this.settings.origin_z;
        }

        // Apply calibration scaling
        if (this.settings.cal_x) {
            const scaleX = 1 + this.settings.cal_x;
            limits.minX *= scaleX;
            limits.maxX *= scaleX;
        }

        if (this.settings.cal_y) {
            const scaleY = 1 + this.settings.cal_y;
            limits.minY *= scaleY;
            limits.maxY *= scaleY;
        }

        return limits;
    }
}

// Create global instance
const advancedMachineManager = new AdvancedMachineManager();

// Global functions for other modules
function getAdvancedMachineSettings() {
    return advancedMachineManager.getSettings();
}

function applyAdvancedMachineSettings(gcode, settings) {
    return advancedMachineManager.applyAdvancedMachineSettings(gcode, settings);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AdvancedMachineManager, 
        advancedMachineManager,
        getAdvancedMachineSettings,
        applyAdvancedMachineSettings
    };
}
