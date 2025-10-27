// Colormap Manager for CNC AI
class ColormapManager {
    constructor() {
        this.currentColormap = 'jet';
        this.init();
    }

    /**
     * Initialize colormap manager
     */
    init() {
        this.initColormapButtons();
        this.setCurrentColormap('jet');
    }

    /**
     * Initialize colormap buttons
     */
    initColormapButtons() {
        try {
            const colormapButtons = document.querySelector('.colormap-buttons');
            if (!colormapButtons) {
                console.error('❌ Colormap buttons container not found');
                return;
            }

            // Remove existing event listeners
            const buttons = colormapButtons.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.replaceWith(btn.cloneNode(true));
            });

            // Add new event listeners
            colormapButtons.addEventListener('click', (e) => {
                if (e.target.closest('button')) {
                    const button = e.target.closest('button');
                    const colormap = button.dataset.map;
                    if (colormap) {
                        this.setCurrentColormap(colormap);
                    }
                }
            });

            console.log('✅ Colormap buttons initialized');
        } catch (error) {
            console.error('❌ Failed to initialize colormap buttons:', error);
        }
    }

    /**
     * Set current colormap
     */
    setCurrentColormap(colormap) {
        try {
            // Update active button
            const buttons = document.querySelectorAll('.colormap-buttons button');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.map === colormap) {
                    btn.classList.add('active');
                }
            });

            // Update global state
            this.currentColormap = colormap;
            APP_STATE.currentColormap = colormap;

            console.log(`🎨 Colormap changed to: ${colormap}`);

            // Update displays if image is loaded
            if (APP_STATE.previewCanvas) {
                this.renderHeatmap();
                this.updateTopView();
            }

            showToast(`تم تغيير نموذج الألوان إلى ${colormap}`);

        } catch (error) {
            console.error('❌ Failed to set colormap:', error);
        }
    }

    /**
     * Render heatmap
     */
    renderHeatmap() {
        try {
            if (!APP_STATE.grayMat || !APP_STATE.previewCanvas) {
                console.log('⚠️ No image data available for heatmap');
                return;
            }
            
            const heatCanvas = document.getElementById('canvasHeatmap');
            if (!heatCanvas) {
                console.error('❌ Heatmap canvas not found');
                return;
            }
            
            const ctx = heatCanvas.getContext('2d');
            if (!ctx) {
                console.error('❌ Canvas context not available');
                return;
            }
            
            // Set canvas dimensions
            heatCanvas.width = APP_STATE.grayMat.cols;
            heatCanvas.height = APP_STATE.grayMat.rows;
            
            // Create image data
            const imgData = ctx.createImageData(heatCanvas.width, heatCanvas.height);
            const data = APP_STATE.grayMat.data;
            
            // Fill image data with colormap colors
            for (let i = 0; i < data.length; i++) {
                const value = data[i];
                const t = value / 255.0;
                const col = this.getColormapColor(t);
                const idx = i * 4;
                imgData.data[idx] = col.r;
                imgData.data[idx + 1] = col.g;
                imgData.data[idx + 2] = col.b;
                imgData.data[idx + 3] = 255;
            }
            
            // Draw to canvas
            ctx.putImageData(imgData, 0, 0);
            
            // Show canvas
            showElement('canvasHeatmap', 'heatmapPlaceholder');
            
            console.log('✅ Heatmap rendered successfully');

        } catch (error) {
            console.error('❌ Failed to render heatmap:', error);
        }
    }

    /**
     * Get color from current colormap
     */
    getColormapColor(t) {
        t = clamp(t);
        
        switch(this.currentColormap) {
            case 'hot':
                if (t < 0.33) return { r: Math.round(t/0.33*128), g: 0, b: 0 };
                if (t < 0.66) return { r: Math.round(128 + (t-0.33)/0.33*127), g: Math.round((t-0.33)/0.33*128), b: 0 };
                return { r: 255, g: Math.round(128 + (t-0.66)/0.34*127), b: Math.round((t-0.66)/0.34*127) };
                
            case 'cool':
                return { r: Math.round(255 * t), g: Math.round(255 * (1 - t)), b: 255 };
                
            case 'gray':
                const v = Math.round(255 * t);
                return { r: v, g: v, b: v };
                
            case 'jet':
            default:
                // jet colormap approximation
                const r = Math.round(255 * clamp(1.5 - Math.abs(1.0 - 4.0*(t-0.5)), 0, 1));
                const g = Math.round(255 * clamp(1.5 - Math.abs(0.5 - 4.0*(t-0.25)), 0, 1));
                const b = Math.round(255 * clamp(1.5 - Math.abs(0.5 - 4.0*(t)), 0, 1));
                return { r, g, b };
        }
    }

    /**
     * Update top view with current colormap
     */
    updateTopView() {
        try {
            if (typeof renderTopViewFromGcode === 'function' && APP_STATE.lastGeneratedGcode) {
                renderTopViewFromGcode(APP_STATE.lastGeneratedGcode);
            }
        } catch (error) {
            console.error('❌ Failed to update top view:', error);
        }
    }

    /**
     * Get current colormap
     */
    getCurrentColormap() {
        return this.currentColormap;
    }

    /**
     * Create colormap legend
     */
    createLegend() {
        const legend = document.getElementById('topLegend');
        if (!legend) return;

        const steps = 6;
        const stops = [];
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const col = this.getColormapColor(t);
            stops.push(`rgb(${col.r},${col.g},${col.b}) ${Math.round((i/steps)*100)}%`);
        }
        
        legend.style.background = `linear-gradient(90deg, ${stops.join(',')})`;
    }
}

// Create global instance
const colormapManager = new ColormapManager();

// Global functions for other modules
window.renderHeatmap = function() {
    return colormapManager.renderHeatmap();
};

window.setColormap = function(colormap) {
    return colormapManager.setCurrentColormap(colormap);
};

window.getCurrentColormap = function() {
    return colormapManager.getCurrentColormap();
};

console.log('✅ Colormap Manager module loaded');
