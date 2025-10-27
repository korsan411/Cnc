/**
 * Dynamic Module Loader
 * Handles loading of optional modules on demand
 */
class DynamicModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingModules = new Map();
    }

    /**
     * Load a module dynamically
     */
    async loadModule(moduleName) {
        // If already loaded or loading
        if (this.loadedModules.has(moduleName)) {
            return true;
        }

        if (this.loadingModules.has(moduleName)) {
            return this.loadingModules.get(moduleName);
        }

        // Create loading promise
        const loadPromise = this.loadModuleFile(moduleName);
        this.loadingModules.set(moduleName, loadPromise);

        try {
            await loadPromise;
            this.loadedModules.add(moduleName);
            this.loadingModules.delete(moduleName);
            console.log(`✅ تم تحميل الوحدة: ${moduleName}`);
            return true;
        } catch (error) {
            this.loadingModules.delete(moduleName);
            console.error(`❌ فشل تحميل الوحدة ${moduleName}:`, error);
            throw error;
        }
    }

    /**
     * Load module file
     */
    async loadModuleFile(moduleName) {
        const moduleMap = {
            'ai-analyzer': 'ai-analyzer.js',
            'vector-preview': 'vector-preview.js',
            '3d-viewer': '3d-viewer.js',
            'simulation': 'simulation.js'
        };

        const fileName = moduleMap[moduleName];
        if (!fileName) {
            throw new Error(`الوحدة غير معروفة: ${moduleName}`);
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = fileName;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`فشل تحميل ${fileName}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Check if module is loaded
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Get loaded modules
     */
    getLoadedModules() {
        return Array.from(this.loadedModules);
    }
}

// Create global instance
const moduleLoader = new DynamicModuleLoader();
