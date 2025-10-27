/**
 * 3D Viewer for STL and OBJ models using Three.js
 */
class ThreeDViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.modelGroup = null;
        this.currentModel = null;
        this.animationFrame = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the 3D viewer
     */
    init() {
        const container = document.getElementById('threeDContainer');
        const canvas = document.getElementById('canvas3D');
        
        if (!container || !canvas) {
            console.warn('3D container or canvas not found');
            return false;
        }

        try {
            // Set container to visible
            container.style.display = 'block';
            canvas.style.display = 'block';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.objectFit = 'contain';

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true, 
                alpha: true 
            });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            this.renderer.setSize(container.clientWidth, container.clientHeight, false);
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Create scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x081224);
            this.scene.fog = new THREE.Fog(0x081224, 50, 200);

            // Create camera
            const aspect = container.clientWidth / Math.max(1, container.clientHeight);
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            this.camera.position.set(0, 80, 120);
            this.camera.lookAt(0, 0, 0);

            // Setup lighting
            this.setupLighting();

            // Create model group
            this.modelGroup = new THREE.Group();
            this.scene.add(this.modelGroup);

            // Setup controls
            this.setupControls();

            // Add helpers
            this.addHelpers();

            // Start animation loop
            this.animate();

            this.isInitialized = true;
            console.log('3D Viewer initialized successfully');
            
            // Hide placeholder
            const placeholder = document.getElementById('threedPlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }

            return true;

        } catch (error) {
            console.error('Failed to initialize 3D viewer:', error);
            return false;
        }
    }

    /**
     * Setup lighting for the scene
     */
    setupLighting() {
        // Hemisphere light for ambient illumination
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 200, 0);
        this.scene.add(hemiLight);

        // Directional light for main illumination
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(0, 200, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        this.scene.add(dirLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x7777ff, 0.3);
        fillLight.position.set(-100, 50, -100);
        this.scene.add(fillLight);
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
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.12;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 1000;
            this.controls.maxPolarAngle = Math.PI;
            this.controls.enableZoom = true;
            this.controls.enableRotate = true;
            this.controls.enablePan = true;
        } catch (error) {
            console.warn('Failed to setup OrbitControls:', error);
        }
    }

    /**
     * Add grid and axis helpers
     */
    addHelpers() {
        // Grid helper
        const gridHelper = new THREE.GridHelper(200, 40, 0x1a2b3a, 0x0b1624);
        gridHelper.position.y = -0.01;
        this.scene.add(gridHelper);

        // Axes helper
        const axesHelper = new THREE.AxesHelper(40);
        axesHelper.material.depthTest = false;
        axesHelper.renderOrder = 2;
        this.scene.add(axesHelper);
    }

    /**
     * Animation loop
     */
    animate() {
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        if (this.controls) {
            this.controls.update();
        }
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Load 3D model from file
     */
    async loadModel(file) {
        if (!this.isInitialized) {
            const initialized = this.init();
            if (!initialized) {
                throw new Error('Failed to initialize 3D viewer');
            }
        }

        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }

            const fileName = file.name.toLowerCase();
            const reader = new FileReader();

            reader.onerror = (error) => {
                hideProgress();
                reject(new Error('Failed to read file: ' + error));
            };

            reader.onload = async (event) => {
                try {
                    showProgress('جاري تحميل الملف: ' + file.name);
                    
                    // Clear previous model
                    this.clearModel();
                    
                    const fileContent = event.target.result;
                    let model;

                    if (fileName.endsWith('.stl')) {
                        model = await this.loadSTLModel(fileContent);
                    } else if (fileName.endsWith('.obj')) {
                        model = await this.loadOBJModel(fileContent);
                    } else {
                        throw new Error('Unsupported file format');
                    }

                    // Add model to scene
                    this.modelGroup.add(model);
                    this.currentModel = model;

                    // Fit camera to model
                    this.fitCameraToObject(model);

                    hideProgress();
                    showToast(`تم تحميل ${fileName.endsWith('.stl') ? 'STL' : 'OBJ'} بنجاح`, 1800);
                    
                    resolve(model);

                } catch (error) {
                    hideProgress();
                    console.error('Model loading error:', error);
                    reject(new Error('Failed to load model: ' + error.message));
                }
            };

            if (fileName.endsWith('.stl') || fileName.endsWith('.obj')) {
                reader.readAsArrayBuffer(file);
            } else {
                reject(new Error('Unsupported file format'));
            }
        });
    }

    /**
     * Load STL model
     */
    async loadSTLModel(arrayBuffer) {
        return new Promise((resolve, reject) => {
            try {
                const loader = new THREE.STLLoader();
                const geometry = loader.parse(arrayBuffer);
                
                // Compute vertex normals for better lighting
                geometry.computeVertexNormals();
                
                // Create material
                const material = new THREE.MeshStandardMaterial({ 
                    color: 0xcccccc, 
                    metalness: 0.2, 
                    roughness: 0.6,
                    flatShading: false
                });
                
                // Create mesh
                const mesh = new THREE.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                // Center geometry
                geometry.center();
                
                resolve(mesh);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Load OBJ model
     */
    async loadOBJModel(arrayBuffer) {
        return new Promise((resolve, reject) => {
            try {
                const loader = new THREE.OBJLoader();
                const text = new TextDecoder().decode(arrayBuffer);
                const object = loader.parse(text);
                
                // Apply materials and setup shadows
                object.traverse((child) => {
                    if (child.isMesh) {
                        if (!child.material) {
                            child.material = new THREE.MeshStandardMaterial({ 
                                color: 0xcccccc,
                                metalness: 0.1,
                                roughness: 0.8
                            });
                        }
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                resolve(object);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Clear current model
     */
    clearModel() {
        if (!this.modelGroup) return;

        // Dispose of geometry and materials
        this.modelGroup.traverse((object) => {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => this.disposeMaterial(material));
                    } else {
                        this.disposeMaterial(object.material);
                    }
                }
            }
        });

        // Remove all children
        while (this.modelGroup.children.length > 0) {
            this.modelGroup.remove(this.modelGroup.children[0]);
        }

        this.currentModel = null;
    }

    /**
     * Dispose material properly
     */
    disposeMaterial(material) {
        if (material.map) material.map.dispose();
        if (material.normalMap) material.normalMap.dispose();
        if (material.roughnessMap) material.roughnessMap.dispose();
        if (material.metalnessMap) material.metalnessMap.dispose();
        if (material.aoMap) material.aoMap.dispose();
        if (material.emissiveMap) material.emissiveMap.dispose();
        if (material.bumpMap) material.bumpMap.dispose();
        if (material.displacementMap) material.displacementMap.dispose();
        if (material.alphaMap) material.alphaMap.dispose();
        if (material.envMap) material.envMap.dispose();
        
        material.dispose();
    }

    /**
     * Fit camera to object
     */
    fitCameraToObject(object, offset = 1.25) {
        if (!this.camera || !object) return;

        try {
            const box = new THREE.Box3().setFromObject(object);
            
            if (box.isEmpty()) {
                console.warn('Object bounding box is empty');
                return;
            }

            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * this.camera.fov / 360));
            const fitWidthDistance = fitHeightDistance / this.camera.aspect;
            const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

            // Position camera
            const direction = new THREE.Vector3(0.3, 0.5, 1).normalize();
            this.camera.position.copy(center).add(direction.multiplyScalar(distance));
            
            // Update controls
            if (this.controls) {
                this.controls.target.copy(center);
                this.controls.update();
            }

            this.camera.lookAt(center);

        } catch (error) {
            console.warn('Error fitting camera to object:', error);
        }
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const container = document.getElementById('threeDContainer');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / Math.max(1, height);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    /**
     * Get model information
     */
    getModelInfo() {
        if (!this.currentModel) return null;

        const box = new THREE.Box3().setFromObject(this.currentModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        let vertexCount = 0;
        let faceCount = 0;

        this.currentModel.traverse((child) => {
            if (child.isMesh && child.geometry) {
                vertexCount += child.geometry.attributes.position.count;
                if (child.geometry.index) {
                    faceCount += child.geometry.index.count / 3;
                } else {
                    faceCount += child.geometry.attributes.position.count / 3;
                }
            }
        });

        return {
            bounds: {
                min: box.min,
                max: box.max,
                size: size,
                center: center
            },
            statistics: {
                vertices: vertexCount,
                faces: faceCount
            },
            dimensions: {
                width: size.x.toFixed(2),
                height: size.y.toFixed(2),
                depth: size.z.toFixed(2)
            }
        };
    }

    /**
     * Change model color
     */
    setModelColor(color) {
        if (!this.currentModel) return;

        this.currentModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        material.color.set(color);
                    });
                } else {
                    child.material.color.set(color);
                }
            }
        });
    }

    /**
     * Set model visibility
     */
    setModelVisibility(visible) {
        if (this.currentModel) {
            this.currentModel.visible = visible;
        }
    }

    /**
     * Reset camera to default position
     */
    resetCamera() {
        if (this.camera) {
            this.camera.position.set(0, 80, 120);
            this.camera.lookAt(0, 0, 0);
            
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        }
    }

    /**
     * Take screenshot
     */
    takeScreenshot(filename = '3d_model.png') {
        if (!this.renderer) return;

        this.renderer.render(this.scene, this.camera);
        
        const canvas = this.renderer.domElement;
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            showToast(`تم حفظ الصورة: ${filename}`);
        }, 'image/png');
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        this.clearModel();

        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        this.scene = null;
        this.camera = null;
        this.isInitialized = false;
    }
}

// Create global instance
const threeDViewer = new ThreeDViewer();

// Global functions for backward compatibility
async function load3DModel(file) {
    return threeDViewer.loadModel(file);
}

function initThreeDViewer() {
    return threeDViewer.init();
}

// Event listeners for tab activation
document.addEventListener('DOMContentLoaded', function() {
    const threedTabBtn = document.querySelector('.tab-buttons button[data-tab="threed"]');
    if (threedTabBtn) {
        threedTabBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (!threeDViewer.isInitialized) {
                    threeDViewer.init();
                }
                threeDViewer.onWindowResize();
            }, 120);
        });
    }

    // Initialize if threed tab is active on load
    if (document.getElementById('threed')?.classList.contains('active')) {
        setTimeout(() => {
            threeDViewer.init();
            threeDViewer.onWindowResize();
        }, 200);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        threeDViewer.onWindowResize();
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ThreeDViewer, 
        threeDViewer,
        load3DModel,
        initThreeDViewer
    };
}
