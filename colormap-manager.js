/**
 * Colormap management for visualization
 */
class ColormapManager {
    constructor() {
        this.currentColormap = 'jet';
        this.colormaps = {
            jet: this.jetColormap,
            hot: this.hotColormap,
            cool: this.coolColormap,
            gray: this.grayColormap
        };
    }

    /**
     * Jet colormap (blue to red)
     */
    jetColormap(t) {
        t = Math.max(0, Math.min(1, t));
        const r = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(1.0 - 4.0 * (t - 0.5)))));
        const g = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(0.5 - 4.0 * (t - 0.25)))));
        const b = Math.round(255 * Math.max(0, Math.min(1, 1.5 - Math.abs(0.5 - 4.0 * t)));
        return { r, g, b };
    }

    /**
     * Hot colormap (black to red to yellow to white)
     */
    hotColormap(t) {
        t = Math.max(0, Math.min(1, t));
        let r, g, b;
        
        if (t < 0.33) {
            r = Math.round(t / 0.33 * 128);
            g = 0;
            b = 0;
        } else if (t < 0.66) {
            r = Math.round(128 + (t - 0.33) / 0.33 * 127);
            g = Math.round((t - 0.33) / 0.33 * 128);
            b = 0;
        } else {
            r = 255;
            g = Math.round(128 + (t - 0.66) / 0.34 * 127);
            b = Math.round((t - 0.66) / 0.34 * 127);
        }
        
        return { r, g, b };
    }

    /**
     * Cool colormap (cyan to magenta)
     */
    coolColormap(t) {
        t = Math.max(0, Math.min(1, t));
        const r = Math.round(255 * t);
        const g = Math.round(255 * (1 - t));
        const b = 255;
        return { r, g, b };
    }

    /**
     * Grayscale colormap
     */
    grayColormap(t) {
        t = Math.max(0, Math.min(1, t));
        const v = Math.round(255 * t);
        return { r: v, g: v, b: v };
    }

    /**
     * Get color from current colormap
     */
    getColor(t, map = null) {
        const colormap = map || this.currentColormap;
        const mapper = this.colormaps[colormap] || this.jetColormap;
        
        try {
            return mapper(Math.max(0, Math.min(1, t)));
        } catch (error) {
            console.warn('خطأ في توليد لون الخريطة:', error);
            return { r: 128, g: 128, b: 128 };
        }
    }

    /**
     * Initialize colormap buttons
     */
    initColormapButtons() {
        const buttons = document.querySelectorAll('#colormapButtons button');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setColormap(btn.dataset.map);
            });
        });
    }

    /**
     * Set current colormap
     */
    setColormap(map) {
        if (!this.colormaps[map]) {
            console.warn(`خريطة الألوان غير معروفة: ${map}`);
            return;
        }

        // Update active button
        document.querySelectorAll('#colormapButtons button').forEach(b => {
            b.classList.remove('active');
        });
        document.querySelector(`#colormapButtons button[data-map="${map}"]`).classList.add('active');

        // Update current colormap
        this.currentColormap = map;
        APP_STATE.currentColormap = map;

        // Update visualizations
        this.updateVisualizations();

        showToast('تم تغيير نموذج الألوان إلى ' + map);
    }

    /**
     * Update all visualizations with current colormap
     */
    updateVisualizations() {
        // Update heatmap if visible
        if (document.getElementById('heatmap').classList.contains('active')) {
            renderHeatmap();
        }
        
        // Update top view if G-code exists
        if (APP_STATE.lastGeneratedGcode) {
            renderTopViewFromGcode(APP_STATE.lastGeneratedGcode);
        }
        
        // Update contour view if visible
        if (document.getElementById('contour').classList.contains('active') && 
            APP_STATE.grayMat && APP_STATE.contour) {
            renderContour(APP_STATE.grayMat, APP_STATE.contour);
        }

        // Update legend
        this.updateLegend();
    }

    /**
     * Update color legend
     */
    updateLegend() {
        const legend = document.getElementById('topLegend');
        if (!legend) return;
        
        try {
            const steps = 6;
            const stops = [];
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const c = this.getColor(t);
                stops.push(`rgb(${c.r},${c.g},${c.b}) ${Math.round((i/steps)*100)}%`);
            }
            legend.style.background = `linear-gradient(90deg, ${stops.join(',')})`;
        } catch(e) {
            console.warn('فشل في تحديث وسيلة الإيضاح:', e);
        }
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        try {
            if (!hex) return { r: 160, g: 82, b: 45 };
            const h = hex.replace('#', '');
            const hh = (h.length === 3) ? h.split('').map(c => c + c).join('') : h;
            const bigint = parseInt(hh, 16);
            return { 
                r: (bigint >> 16) & 255, 
                g: (bigint >> 8) & 255, 
                b: bigint & 255 
            };
        } catch {
            return { r: 160, g: 82, b: 45 };
        }
    }

    /**
     * Mix two colors
     */
    mixColors(c1, c2, t) {
        try {
            t = Math.max(0, Math.min(1, t));
            return {
                r: Math.round(c1.r * (1 - t) + c2.r * t),
                g: Math.round(c1.g * (1 - t) + c2.g * t),
                b: Math.round(c1.b * (1 - t) + c2.b * t)
            };
        } catch {
            return c1;
        }
    }

    /**
     * Generate color gradient for visualization
     */
    generateGradient(steps = 256, map = null) {
        const gradient = [];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            gradient.push(this.getColor(t, map));
        }
        return gradient;
    }

    /**
     * Get current colormap name
     */
    getCurrentColormap() {
        return this.currentColormap;
    }

    /**
     * Get available colormaps
     */
    getAvailableColormaps() {
        return Object.keys(this.colormaps);
    }

    /**
     * Create custom colormap
     */
    createCustomColormap(name, colorStops) {
        if (this.colormaps[name]) {
            console.warn(`خريطة الألوان موجودة مسبقاً: ${name}`);
            return false;
        }

        this.colormaps[name] = function(t) {
            t = Math.max(0, Math.min(1, t));
            
            // Find the segment that t falls into
            for (let i = 0; i < colorStops.length - 1; i++) {
                const start = colorStops[i];
                const end = colorStops[i + 1];
                
                if (t >= start.position && t <= end.position) {
                    const segmentT = (t - start.position) / (end.position - start.position);
                    return {
                        r: Math.round(start.r * (1 - segmentT) + end.r * segmentT),
                        g: Math.round(start.g * (1 - segmentT) + end.g * segmentT),
                        b: Math.round(start.b * (1 - segmentT) + end.b * segmentT)
                    };
                }
            }
            
            return colorStops[colorStops.length - 1];
        };

        return true;
    }
}

// Create global instance
const colormapManager = new ColormapManager();

// Global functions for backward compatibility
function getColormapColor(t, map) {
    return colormapManager.getColor(t, map);
}

function hexToRgb(hex) {
    return colormapManager.hexToRgb(hex);
}

function mixColors(c1, c2, t) {
    return colormapManager.mixColors(c1, c2, t);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ColormapManager, 
        colormapManager,
        getColormapColor,
        hexToRgb,
        mixColors
    };
}
