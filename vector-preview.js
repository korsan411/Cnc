/**
 * 2D Vector Preview for SVG and DXF files
 */
class VectorPreview {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentVector = null;
        this.view = {
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            isPanning: false,
            lastX: 0,
            lastY: 0
        };
        this.isInitialized = false;
    }

    /**
     * Initialize the vector preview
     */
    init() {
        this.canvas = document.getElementById('vectorCanvas');
        const placeholder = document.getElementById('vectorPlaceholder');
        
        if (!this.canvas) {
            console.warn('Vector canvas not found');
            return false;
        }

        try {
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Could not get canvas context');
            }

            // Setup canvas size
            this.resizeCanvas();

            // Setup event listeners
            this.setupEventListeners();

            // Setup control buttons
            this.setupControlButtons();

            this.isInitialized = true;
            
            // Hide placeholder
            if (placeholder) {
                placeholder.style.display = 'none';
            }

            this.canvas.style.display = 'block';
            console.log('Vector preview initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize vector preview:', error);
            return false;
        }
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = Math.min(420, rect.height || 420);

        const dpr = Math.max(1, window.devicePixelRatio || 1);
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Redraw if we have content
        if (this.currentVector) {
            this.render();
        }
    }

    /**
     * Setup event listeners for pan and zoom
     */
    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events for panning
        this.canvas.addEventListener('mousedown', (e) => this.startPan(e));
        this.canvas.addEventListener('mousemove', (e) => this.doPan(e));
        this.canvas.addEventListener('mouseup', () => this.endPan());
        this.canvas.addEventListener('mouseleave', () => this.endPan());

        // Wheel event for zooming
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.endPan());

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Setup control buttons
     */
    setupControlButtons() {
        const zoomInBtn = document.getElementById('vectorZoomIn');
        const zoomOutBtn = document.getElementById('vectorZoomOut');
        const fitBtn = document.getElementById('vectorFit');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }

        if (fitBtn) {
            fitBtn.addEventListener('click', () => this.fitToView());
        }
    }

    /**
     * Load SVG file
     */
    async loadSVG(file) {
        if (!this.isInitialized) {
            const initialized = this.init();
            if (!initialized) {
                throw new Error('Failed to initialize vector preview');
            }
        }

        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            
            reader.onerror = (error) => {
                reject(new Error('Failed to read file: ' + error));
            };

            reader.onload = (event) => {
                try {
                    const svgText = event.target.result;
                    const parsed = this.parseSVG(svgText);
                    
                    if (!parsed) {
                        throw new Error('Failed to parse SVG file');
                    }

                    this.currentVector = {
                        type: 'svg',
                        paths: parsed.paths,
                        bbox: parsed.bbox
                    };

                    this.fitToView();
                    this.render();
                    
                    showToast('تم تحميل SVG بنجاح', 1500);
                    resolve(this.currentVector);

                } catch (error) {
                    reject(new Error('Failed to load SVG: ' + error.message));
                }
            };

            reader.readAsText(file);
        });
    }

    /**
     * Load DXF file
     */
    async loadDXF(file) {
        if (!this.isInitialized) {
            const initialized = this.init();
            if (!initialized) {
                throw new Error('Failed to initialize vector preview');
            }
        }

        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const reader = new FileReader();
            
            reader.onerror = (error) => {
                reject(new Error('Failed to read file: ' + error));
            };

            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    const parsed = this.parseDXF(arrayBuffer);
                    
                    if (!parsed) {
                        throw new Error('Failed to parse DXF file');
                    }

                    this.currentVector = {
                        type: 'dxf',
                        paths: parsed.paths,
                        bbox: parsed.bbox
                    };

                    this.fitToView();
                    this.render();
                    
                    showToast('تم تحميل DXF بنجاح', 1500);
                    resolve(this.currentVector);

                } catch (error) {
                    reject(new Error('Failed to load DXF: ' + error.message));
                }
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parse SVG content
     */
    parseSVG(svgText) {
        try {
            if (typeof THREE === 'undefined' || !THREE.SVGLoader) {
                throw new Error('SVGLoader not available');
            }

            const loader = new THREE.SVGLoader();
            const svgData = loader.parse(svgText);
            
            const paths = [];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            svgData.paths.forEach(path => {
                const shapes = path.toShapes(true);
                shapes.forEach(shape => {
                    const points = shape.getPoints();
                    if (points.length > 0) {
                        const pathPoints = points.map(p => ({ x: p.x, y: p.y }));
                        paths.push(pathPoints);
                        
                        // Update bounding box
                        pathPoints.forEach(pt => {
                            if (pt.x < minX) minX = pt.x;
                            if (pt.x > maxX) maxX = pt.x;
                            if (pt.y < minY) minY = pt.y;
                            if (pt.y > maxY) maxY = pt.y;
                        });
                    }
                });
            });

            if (paths.length === 0) {
                // Fallback: try to extract paths directly
                this.extractPathsFromSVG(svgText, paths);
                
                if (paths.length === 0) {
                    throw new Error('No valid paths found in SVG');
                }
            }

            if (minX === Infinity) {
                minX = 0; minY = 0; maxX = 100; maxY = 100;
            }

            return {
                paths,
                bbox: { minX, minY, maxX, maxY }
            };

        } catch (error) {
            console.error('SVG parsing error:', error);
            return null;
        }
    }

    /**
     * Fallback SVG path extraction
     */
    extractPathsFromSVG(svgText, paths) {
        try {
            // Simple path extraction using regex
            const pathRegex = /d="([^"]*)"/g;
            let match;
            
            while ((match = pathRegex.exec(svgText)) !== null) {
                const pathData = match[1];
                // Basic path parsing - in a real implementation, use a proper SVG path parser
                const points = this.parseSVGPath(pathData);
                if (points.length > 0) {
                    paths.push(points);
                }
            }
        } catch (error) {
            console.warn('Fallback SVG parsing failed:', error);
        }
    }

    /**
     * Basic SVG path parser
     */
    parseSVGPath(pathData) {
        const points = [];
        const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
        
        if (!commands) return points;

        let currentX = 0, currentY = 0;

        commands.forEach(command => {
            const cmd = command[0];
            const numbers = command.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));

            switch (cmd) {
                case 'M': // moveto absolute
                case 'm': // moveto relative
                    if (numbers.length >= 2) {
                        if (cmd === 'm') {
                            currentX += numbers[0];
                            currentY += numbers[1];
                        } else {
                            currentX = numbers[0];
                            currentY = numbers[1];
                        }
                        points.push({ x: currentX, y: currentY });
                    }
                    break;

                case 'L': // lineto absolute
                case 'l': // lineto relative
                    if (numbers.length >= 2) {
                        if (cmd === 'l') {
                            currentX += numbers[0];
                            currentY += numbers[1];
                        } else {
                            currentX = numbers[0];
                            currentY = numbers[1];
                        }
                        points.push({ x: currentX, y: currentY });
                    }
                    break;

                case 'H': // horizontal lineto absolute
                case 'h': // horizontal lineto relative
                    if (numbers.length >= 1) {
                        if (cmd === 'h') {
                            currentX += numbers[0];
                        } else {
                            currentX = numbers[0];
                        }
                        points.push({ x: currentX, y: currentY });
                    }
                    break;

                case 'V': // vertical lineto absolute
                case 'v': // vertical lineto relative
                    if (numbers.length >= 1) {
                        if (cmd === 'v') {
                            currentY += numbers[0];
                        } else {
                            currentY = numbers[0];
                        }
                        points.push({ x: currentX, y: currentY });
                    }
                    break;

                case 'Z': // closepath
                case 'z':
                    if (points.length > 0) {
                        points.push({ x: points[0].x, y: points[0].y });
                    }
                    break;
            }
        });

        return points;
    }

    /**
     * Parse DXF content
     */
    parseDXF(arrayBuffer) {
        try {
            if (typeof THREE === 'undefined' || !THREE.DXFLoader) {
                throw new Error('DXFLoader not available');
            }

            const loader = new THREE.DXFLoader();
            const text = new TextDecoder().decode(arrayBuffer);
            const object = loader.parse(text);
            
            const paths = [];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            object.traverse(child => {
                if (child.isLine || child.type === 'Line' || child.geometry) {
                    const geometry = child.geometry;
                    if (geometry && geometry.attributes && geometry.attributes.position) {
                        const positions = geometry.attributes.position.array;
                        const pathPoints = [];
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            const x = positions[i];
                            const y = positions[i + 1];
                            
                            if (isFinite(x) && isFinite(y)) {
                                pathPoints.push({ x, y });
                                
                                // Update bounding box
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                        
                        if (pathPoints.length > 0) {
                            paths.push(pathPoints);
                        }
                    }
                }
            });

            if (minX === Infinity) {
                minX = 0; minY = 0; maxX = 100; maxY = 100;
            }

            return {
                paths,
                bbox: { minX, minY, maxX, maxY }
            };

        } catch (error) {
            console.error('DXF parsing error:', error);
            return null;
        }
    }

    /**
     * Render the vector paths
     */
    render() {
        if (!this.ctx || !this.currentVector) return;

        try {
            // Clear canvas with transparent background
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const rect = this.canvas.getBoundingClientRect();
            const canvasW = rect.width;
            const canvasH = rect.height;
            const bbox = this.currentVector.bbox;

            // Calculate transform
            const vbW = bbox.maxX - bbox.minX;
            const vbH = bbox.maxY - bbox.minY;

            if (vbW === 0 || vbH === 0) return;

            const scaleFit = Math.min(canvasW / vbW, canvasH / vbH) * 0.9;
            const scale = this.view.scale * scaleFit;
            
            const centerX = (canvasW / 2) - ((bbox.minX + bbox.maxX) / 2) * scale + this.view.offsetX;
            const centerY = (canvasH / 2) + ((bbox.minY + bbox.maxY) / 2) * scale + this.view.offsetY;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(scale, -scale); // Flip Y to match SVG coordinate system

            // Set drawing style
            this.ctx.lineWidth = 1.5 / scale;
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';

            // Draw all paths
            this.currentVector.paths.forEach(path => {
                if (path.length < 2) return;

                this.ctx.beginPath();
                
                path.forEach((point, index) => {
                    if (index === 0) {
                        this.ctx.moveTo(point.x, point.y);
                    } else {
                        this.ctx.lineTo(point.x, point.y);
                    }
                });

                // Close path if it's a closed shape
                if (path.length > 2) {
                    const first = path[0];
                    const last = path[path.length - 1];
                    if (Math.abs(first.x - last.x) < 0.1 && Math.abs(first.y - last.y) < 0.1) {
                        this.ctx.closePath();
                    }
                }

                this.ctx.stroke();
            });

            this.ctx.restore();

        } catch (error) {
            console.error('Rendering error:', error);
        }
    }

    /**
     * Start panning
     */
    startPan(event) {
        this.view.isPanning = true;
        this.view.lastX = event.clientX;
        this.view.lastY = event.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * Perform panning
     */
    doPan(event) {
        if (!this.view.isPanning) return;

        const dx = event.clientX - this.view.lastX;
        const dy = event.clientY - this.view.lastY;

        this.view.offsetX += dx;
        this.view.offsetY += dy;

        this.view.lastX = event.clientX;
        this.view.lastY = event.clientY;

        this.render();
    }

    /**
     * End panning
     */
    endPan() {
        this.view.isPanning = false;
        this.canvas.style.cursor = 'default';
    }

    /**
     * Handle touch start
     */
    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.startPan(event.touches[0]);
        }
    }

    /**
     * Handle touch move
     */
    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.doPan(event.touches[0]);
        }
    }

    /**
     * Handle zoom
     */
    handleZoom(event) {
        event.preventDefault();

        const zoomIntensity = 0.1;
        const wheel = event.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);

        this.view.scale *= zoom;
        this.render();
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.view.scale *= 1.25;
        this.render();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.view.scale /= 1.25;
        this.render();
    }

    /**
     * Fit vector to view
     */
    fitToView() {
        this.view.scale = 1;
        this.view.offsetX = 0;
        this.view.offsetY = 0;
        this.render();
    }

    /**
     * Clear the preview
     */
    clear() {
        this.currentVector = null;
        this.view.scale = 1;
        this.view.offsetX = 0;
        this.view.offsetY = 0;
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        const placeholder = document.getElementById('vectorPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'flex';
        }
        
        this.canvas.style.display = 'none';
    }

    /**
     * Get vector information
     */
    getVectorInfo() {
        if (!this.currentVector) return null;

        const bbox = this.currentVector.bbox;
        return {
            type: this.currentVector.type,
            paths: this.currentVector.paths.length,
            totalPoints: this.currentVector.paths.reduce((sum, path) => sum + path.length, 0),
            bounds: {
                width: (bbox.maxX - bbox.minX).toFixed(2),
                height: (bbox.maxY - bbox.minY).toFixed(2)
            }
        };
    }

    /**
     * Export as image
     */
    exportImage(filename = 'vector.png') {
        if (!this.canvas) return;

        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`تم حفظ الصورة: ${filename}`);
        }, 'image/png');
    }
}

// Create global instance
const vectorPreview = new VectorPreview();

// Global functions for backward compatibility
async function loadSVGModel(file) {
    return vectorPreview.loadSVG(file);
}

async function loadDXFModel(file) {
    return vectorPreview.loadDXF(file);
}

// Event listeners for tab activation
document.addEventListener('DOMContentLoaded', function() {
    const vectorTabBtn = document.querySelector('.tab-buttons button[data-tab="vector2d"]');
    if (vectorTabBtn) {
        vectorTabBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (!vectorPreview.isInitialized) {
                    vectorPreview.init();
                }
            }, 120);
        });
    }

    // Initialize if vector tab is active on load
    if (document.getElementById('vector2d')?.classList.contains('active')) {
        setTimeout(() => {
            vectorPreview.init();
        }, 200);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        VectorPreview, 
        vectorPreview,
        loadSVGModel,
        loadDXFModel
    };
}
