// CNC AI Configuration - FIXED VERSION
console.log('🔧 Loading config.js...');

// Prevent redefinition
if (typeof window.CONFIG === 'undefined') {
    window.CONFIG = {
        version: "2.5.0",
        opencvUrl: "https://docs.opencv.org/4.8.0/opencv.js",
        threeJsUrl: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
        maxFileSize: 10 * 1024 * 1024,
        maxImagePixels: 2000000,
        maxPoints3D: 1500,
        maxDebugLogs: 100,
        defaultSettings: {
            router: { feed: 800, safeZ: 5, maxDepth: 3, stepOver: 5 },
            laser: { feed: 2000, safeZ: 0, maxDepth: 0, stepOver: 0.2 },
            threed: { layerHeight: 0.2, fillDensity: 20, printSpeed: 50 }
        },
        colormaps: ['jet', 'hot', 'cool', 'gray']
    };
}

// Global state with safe initialization
if (typeof window.APP_STATE === 'undefined') {
    window.APP_STATE = {
        cvReady: false,
        grayMat: null,
        contour: null,
        previewCanvas: null,
        additionalContours: [],
        lastScanDir: 'x',
        lastGeneratedGcode: '',
        isProcessing: false,
        currentColormap: 'jet',
        currentMachine: 'router'
    };
}

console.log('✅ config.js loaded successfully');
