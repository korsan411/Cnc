// config.js - نسخة معدلة مع فحص أفضل
console.log('⚙️ تحميل إعدادات CNC AI...');

try {
    // CNC AI Configuration
    const CONFIG = {
        version: "2.5.0",
        opencvUrl: "https://docs.opencv.org/4.8.0/opencv.js",
        threeJsUrl: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
        maxFileSize: 10 * 1024 * 1024,
        maxImagePixels: 2000000,
        maxPoints3D: 1500,
        maxDebugLogs: 100,
        defaultSettings: {
            router: { 
                feed: 800, 
                safeZ: 5, 
                maxDepth: 3, 
                stepOver: 5,
                workWidth: 30,
                workHeight: 20
            },
            laser: { 
                feed: 2000, 
                safeZ: 0, 
                maxDepth: 0, 
                stepOver: 0.2,
                workWidth: 30,
                workHeight: 20,
                power: 80,
                speed: 2000
            },
            threed: { 
                layerHeight: 0.2, 
                fillDensity: 20, 
                printSpeed: 50,
                workWidth: 30,
                workHeight: 20,
                workDepth: 10
            }
        },
        colormaps: ['jet', 'hot', 'cool', 'gray'],
        supportedFormats: {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
            models3d: ['.stl', '.obj', '.3ds', '.dae', '.ply'],
            vectors: ['.svg', '.dxf']
        }
    };

    // Global state
    const APP_STATE = {
        cvReady: false,
        grayMat: null,
        contour: null,
        previewCanvas: null,
        additionalContours: [],
        lastScanDir: 'x',
        lastGeneratedGcode: '',
        isProcessing: false,
        currentColormap: 'jet',
        currentMachine: 'router',
        threeDModel: null,
        simulation: {
            isPlaying: false,
            animationFrame: null,
            tool: null,
            toolPath: null,
            pathPoints: [],
            index: 0,
            speed: 1,
            elapsedTime: 0
        }
    };

    // جعلها عالمية
    window.CONFIG = CONFIG;
    window.APP_STATE = APP_STATE;

    console.log('✅ تم تحميل CONFIG و APP_STATE بنجاح');

} catch (error) {
    console.error('❌ خطأ في تحميل config.js:', error);
}
