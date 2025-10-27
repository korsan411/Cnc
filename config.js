// CNC AI Configuration
const CONFIG = {
    version: "2.5.0",
    opencvUrl: "https://docs.opencv.org/4.8.0/opencv.js",
    threeJsUrl: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImagePixels: 2000000, // 2MP
    maxPoints3D: 1500,
    maxDebugLogs: 100,
    defaultSettings: {
        router: { feed: 800, safeZ: 5, maxDepth: 3, stepOver: 5 },
        laser: { feed: 2000, safeZ: 0, maxDepth: 0, stepOver: 0.2 },
        threed: { layerHeight: 0.2, fillDensity: 20, printSpeed: 50 }
    },
    colormaps: ['jet', 'hot', 'cool', 'gray'],
    supportedFormats: {
        images: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
        models3d: ['.stl', '.obj', '.3ds', '.dae', '.ply'],
        vectors: ['.svg', '.dxf']
    }
};

// Global variables
let cvReady = false;
let grayMat = null;
let contour = null;
let previewCanvas = null;
let additionalContours = [];
let lastScanDir = 'x';
let lastGeneratedGcode = '';
let isProcessing = false;
let currentColormap = 'jet';
