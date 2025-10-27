/**
 * 3D Simulation for G-code visualization
 */
class Simulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.tool = null;
        this.toolPath = null;
        this.pathPoints = [];
        this.isPlaying = false;
        this.animationFrame = null;
        this.currentIndex = 0;
        this.speed = 1;
        this.elapsedTime = 0;
        this.isInitialized = false;
    }

    /**
     * Initialize the simulation
     */
    init() {
        const container = document.getElementById('threeContainer');
        if (!container) {
            console.warn('Simulation container not found');
            return false;
        }

        try {
            // Hide placeholder
            const placeholder = document.getElementById('simulationPlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }

            // Cleanup previous simulation
            this.cleanup();

            // Check if Three.js is available
            if (typeof THREE === 'undefined') {
                throw new Error('Three.js not loaded');
            }

            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x081224);
            this.scene.fog = new THREE.Fog(0x081224, 50, 300);

            // Setup camera
            const containerW = container.clientWidth || 800;
            const containerH = container.clientHeight || 400;
            this.camera = new THREE.PerspectiveCamera(60, containerW / containerH, 0.1, 2000);
            this.camera.position.set(100, 100, 100);
            this.camera.lookAt(0, 0, 0);

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: false,
                preserveDrawingBuffer: true
            });
            this.renderer.setSize(containerW, containerH);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(this.renderer.domElement);

            // Setup controls
            this.setupControls();

            // Setup lighting
            this.setupLighting();

            // Create machine platform
            this.createMachinePlatform();

            // Add simulation controls
            this.addSimulationControls();

            // Start render loop
            this.animate();

            this.isInitialized = true;
            console.log('Simulation initialized successfully');
            return true;

        } catch (error) {
            console.error('Failed to initialize simulation:', error);
            return false;
        }
    }

    /**
     * Setup orbit controls
     */
    setupControls() {
        if (typeof THREE.OrbitControls === 'undefined') {
            console.warn('OrbitControls not available');
            return;
        }

        try {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = false;
            this.controls.screenSpacePanning = true;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 2000;
        } catch (error) {
            console.warn('Failed to setup OrbitControls:', error);
        }
    }

    /**
     * Setup lighting for simulation
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }

    /**
     * Create machine platform
     */
    createMachinePlatform() {
        const machineType = document.getElementById('machineCategory').value;
        const isLaser = machineType === 'laser';
        const is3D = machineType === 'threed';

        // Get work dimensions
        let workWidth, workHeight, platformColor;

        if (is3D) {
            workWidth = cmToMm(parseFloat(document.getElementById('threedWorkWidth').value) || 30) / 10;
            workHeight = cmToMm(parseFloat(document.getElementById('threedWorkHeight').value) || 20) / 10;
            platformColor = 0x444444;
        } else if (isLaser) {
            workWidth = cmToMm(parseFloat(document.getElementById('laserWorkWidth').value) || 30) / 10;
            workHeight = cmToMm(parseFloat(document.getElementById('laserWorkHeight').value) || 20) / 10;
            platformColor = 0x666666;
        } else {
            workWidth = cmToMm(parseFloat(document.getElementById('workWidth').value) || 30) / 10;
            workHeight = cmToMm(parseFloat(document.getElementById('workHeight').value) || 20) / 10;
            platformColor = 0x8B4513; // Wood color
        }

        // Create platform
        const platformGeometry = new THREE.BoxGeometry(workWidth, 0.5, workHeight);
        const platformMaterial = new THREE.MeshPhongMaterial({ 
            color: platformColor 
        });
        const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
        platformMesh.position.set(workWidth / 2, -0.25, workHeight / 2);
        platformMesh.receiveShadow = true;
        this.scene.add(platformMesh);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(Math.max(workWidth, workHeight), 10);
        gridHelper.position.set(workWidth / 2, 0, workHeight / 2);
        this.scene.add(gridHelper);

        // Store platform reference
        this.platform = platformMesh;
        this.workArea = { width: workWidth, height: workHeight };
    }

    /**
     * Add simulation controls UI
     */
    addSimulationControls() {
        const container = document.getElementById('threeContainer');
        if (!container) return;

        // Remove existing controls
        const oldControls = container.querySelector('.sim-controls');
        const oldProgress = container.querySelector('.sim-progress');
        if (oldControls) oldControls.remove();
        if (oldProgress) oldProgress.remove();

        // Create controls container
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'sim-controls';
        controlsDiv.innerHTML = `
            <button id="simPlay">▶</button>
            <button id="simPause">⏸</button>
            <button id="simReset">⏮</button>
            <label style="color:#cfeaf2;font-size:12px;margin-right:6px">سرعة</label>
            <input id="simSpeed" type="range" min="0.2" max="3" step="0.1" value="${this.speed}">
            <span id="simSpeedLabel" style="min-width:36px;text-align:center">${this.speed.toFixed(1)}x</span>
        `;
        container.appendChild(controlsDiv);

        // Create progress container
        const progressDiv = document.createElement('div');
        progressDiv.className = 'sim-progress';
        progressDiv.innerHTML = `الحالة: <span id="simStatus">جاهز</span> — تقدم: <span id="simProgress">0%</span>`;
        container.appendChild(progressDiv);

        // Add event listeners
        this.setupControlEvents();
    }

    /**
     * Setup simulation control events
     */
    setupControlEvents() {
        const playBtn = document.getElementById('simPlay');
        const pauseBtn = document.getElementById('simPause');
        const resetBtn = document.getElementById('simReset');
        const speedSlider = document.getElementById('simSpeed');
        const speedLabel = document.getElementById('simSpeedLabel');

        if (playBtn) {
            playBtn.addEventListener('click', () => this.play());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (speedSlider && speedLabel) {
            speedSlider.addEventListener('input', (e) => {
                this.speed = parseFloat(e.target.value);
                speedLabel.textContent = this.speed.toFixed(1) + 'x';
            });
        }
    }

    /**
     * Load G-code for simulation
     */
    loadGCode(gcode) {
        if (!this.isInitialized) {
            const initialized = this.init();
            if (!initialized) {
                throw new Error('Failed to initialize simulation');
            }
        }

        try {
            // Parse G-code
            this.pathPoints = this.parseGCodeForSimulation(gcode);
            
            if (this.pathPoints.length === 0) {
                throw new Error('No valid movement commands found in G-code');
            }

            // Create tool path visualization
            this.createToolPath();

            // Create tool model
            this.createTool();

            // Reset simulation state
            this.reset();

            showToast(`تم تحميل المسار: ${this.pathPoints.length} نقطة`);

        } catch (error) {
            console.error('Failed to load G-code for simulation:', error);
            throw new Error('Failed to load G-code: ' + error.message);
        }
    }

    /**
     * Parse G-code for simulation points
     */
    parseGCodeForSimulation(gcode) {
        if (!gcode || gcode.length === 0) return [];
        
        try {
            const lines = gcode.split('\n');
            const path = [];
            let pos = { x: 0, y: 0, z: 0 };
            let pointCount = 0;
            const maxPoints = CONFIG.simulation.maxPoints;

            for (let line of lines) {
                if (pointCount >= maxPoints) break;
                
                line = line.trim();
                if (!line || line.startsWith(';')) continue;
                
                if (line.startsWith('G0') || line.startsWith('G1')) {
                    const xMatch = line.match(/X([-\d.]+)/i);
                    const yMatch = line.match(/Y([-\d.]+)/i);
                    const zMatch = line.match(/Z([-\d.]+)/i);
                    
                    if (xMatch) pos.x = parseFloat(xMatch[1]) || pos.x;
                    if (yMatch) pos.y = parseFloat(yMatch[1]) || pos.y;
                    if (zMatch) pos.z = parseFloat(zMatch[1]) || pos.z;
                    
                    // Sample points to reduce density
                    if (pointCount % 8 === 0) {
                        path.push({ x: pos.x, y: pos.y, z: pos.z });
                    }
                    pointCount++;
                }
            }
            
            return path;
        } catch (error) {
            console.error('Error parsing G-code for simulation:', error);
            return [];
        }
    }

    /**
     * Create tool path visualization
     */
    createToolPath() {
        if (!this.pathPoints || this.pathPoints.length < 2) return;

        try {
            // Remove existing tool path
            if (this.toolPath) {
                this.scene.remove(this.toolPath);
                this.toolPath = null;
            }

            const points = this.pathPoints.map(p => 
                new THREE.Vector3(p.x / 10, -p.z, p.y / 10)
            );

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            // Choose color based on machine type
            const machineType = document.getElementById('machineCategory').value;
            let color;
            switch (machineType) {
                case 'laser':
                    color = 0xff4444;
                    break;
                case 'threed':
                    color = 0x10b981;
                    break;
                default:
                    color = 0x3b82f6;
            }

            const material = new THREE.LineBasicMaterial({ 
                color: color,
                linewidth: 2
            });

            this.toolPath = new THREE.Line(geometry, material);
            this.scene.add(this.toolPath);

        } catch (error) {
            console.error('Failed to create tool path:', error);
        }
    }

    /**
     * Create tool model
     */
    createTool() {
        // Remove existing tool
        if (this.tool) {
            this.scene.remove(this.tool);
            this.tool = null;
        }

        const machineType = document.getElementById('machineCategory').value;
        const group = new THREE.Group();

        try {
            if (machineType === 'threed') {
                // 3D printer tool
                const bodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 12);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x10b981 });
                const body = new THREE.Mesh(bodyGeom, bodyMat);
                body.rotation.x = Math.PI / 2;
                group.add(body);
                
                const nozzleGeom = new THREE.ConeGeometry(0.5, 2, 12);
                const nozzleMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
                const nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
                nozzle.rotation.x = Math.PI / 2;
                nozzle.position.z = 4;
                group.add(nozzle);
                
            } else if (machineType === 'laser') {
                // Laser tool
                const bodyGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff4444 });
                const body = new THREE.Mesh(bodyGeom, bodyMat);
                body.rotation.x = Math.PI / 2;
                group.add(body);
                
                const lensGeom = new THREE.CylinderGeometry(0.6, 0.6, 1, 16);
                const lensMat = new THREE.MeshPhongMaterial({ color: 0x00ffff });
                const lens = new THREE.Mesh(lensGeom, lensMat);
                lens.rotation.x = Math.PI / 2;
                lens.position.z = 4.5;
                group.add(lens);
                
            } else {
                // CNC router tool
                const bodyGeom = new THREE.CylinderGeometry(0.6, 0.6, 6, 12);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff4444 });
                const body = new THREE.Mesh(bodyGeom, bodyMat);
                body.rotation.x = Math.PI / 2;
                group.add(body);
                
                const tipGeom = new THREE.ConeGeometry(0.8, 2.5, 12);
                const tipMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
                const tip = new THREE.Mesh(tipGeom, tipMat);
                tip.rotation.x = Math.PI / 2;
                tip.position.z = 4;
                group.add(tip);
            }

            group.scale.set(1.2, 1.2, 1.2);
            this.tool = group;
            this.scene.add(this.tool);

        } catch (error) {
            console.error('Failed to create tool model:', error);
        }
    }

    /**
     * Start simulation
     */
    play() {
        if (!this.pathPoints || this.pathPoints.length === 0) {
            showToast('لا يوجد مسار للمحاكاة');
            return;
        }

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.updateStatus('جاري التشغيل');
        showToast('بدأت المحاكاة');

        this.animateSimulation();
    }

    /**
     * Pause simulation
     */
    pause() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.updateStatus('متوقف');
        showToast('أقفلت المحاكاة مؤقتاً');
    }

    /**
     * Reset simulation
     */
    reset() {
        this.pause();
        this.currentIndex = 0;
        this.elapsedTime = 0;
        this.updateToolPosition(0);
        this.updateProgress(0);
        this.updateStatus('جاهز');
        showToast('تم إعادة المحاكاة');
    }

    /**
     * Animation loop for simulation
     */
    animateSimulation() {
        if (!this.isPlaying) return;

        const step = () => {
            if (!this.isPlaying) return;

            this.currentIndex += this.speed;
            
            if (this.currentIndex >= this.pathPoints.length) {
                this.currentIndex = this.pathPoints.length - 1;
                this.updateToolPosition(this.currentIndex);
                this.updateProgress(100);
                this.updateStatus('مكتمل');
                this.isPlaying = false;
                showToast('اكتملت المحاكاة');
                return;
            }

            this.updateToolPosition(this.currentIndex);
            
            const progress = ((this.currentIndex + 1) / this.pathPoints.length) * 100;
            this.updateProgress(progress);

            this.animationFrame = requestAnimationFrame(step);
        };

        this.animationFrame = requestAnimationFrame(step);
    }

    /**
     * Update tool position
     */
    updateToolPosition(index) {
        if (!this.tool || !this.pathPoints || this.pathPoints.length === 0) return;

        try {
            const i = Math.floor(index);
            const point = this.pathPoints[i];
            if (!point) return;

            // Convert coordinates for Three.js (scale and invert Y/Z as needed)
            this.tool.position.set(point.x / 10, -point.z, point.y / 10);
        } catch (error) {
            console.warn('Failed to update tool position:', error);
        }
    }

    /**
     * Update progress display
     */
    updateProgress(percentage) {
        const progressElement = document.getElementById('simProgress');
        if (progressElement) {
            progressElement.textContent = percentage.toFixed(1) + '%';
        }
    }

    /**
     * Update status display
     */
    updateStatus(status) {
        const statusElement = document.getElementById('simStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const container = document.getElementById('threeContainer');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Get simulation statistics
     */
    getStats() {
        return {
            points: this.pathPoints.length,
            isPlaying: this.isPlaying,
            progress: this.currentIndex / this.pathPoints.length * 100,
            speed: this.speed
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.pause();

        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        if (this.renderer) {
            const container = document.getElementById('threeContainer');
            if (container && this.renderer.domElement) {
                container.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
            this.renderer = null;
        }

        this.scene = null;
        this.camera = null;
        this.tool = null;
        this.toolPath = null;
        this.pathPoints = [];
        this.isInitialized = false;
    }
}

// Create global instance
const simulation = new Simulation();

// Global functions for backward compatibility
function initSimulation() {
    return simulation.init();
}

function loadGCodeForSimulation(gcode) {
    return simulation.loadGCode(gcode);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const simulationTabBtn = document.querySelector('.tab-buttons button[data-tab="simulation"]');
    if (simulationTabBtn) {
        simulationTabBtn.addEventListener('click', () => {
            // Auto-load G-code if available
            const gcode = document.getElementById('gcodeOut').value;
            if (gcode && gcode.trim().length > 0) {
                setTimeout(() => {
                    try {
                        simulation.init();
                        simulation.loadGCode(gcode);
                    } catch (error) {
                        console.error('Failed to load simulation:', error);
                    }
                }, 100);
            }
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        simulation.onWindowResize();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        Simulation, 
        simulation,
        initSimulation,
        loadGCodeForSimulation
    };
}
