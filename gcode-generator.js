/**
 * G-code generation utilities for CNC AI application
 */
class GCodeGenerator {
    constructor() {
        this.gcodeBuffer = [];
    }

    /**
     * Generate raster G-code for CNC router
     */
    generateRasterGcode(scaleDown = false) {
        if (!APP_STATE.grayMat || !APP_STATE.contour) {
            throw new Error("لا توجد صورة جاهزة للمعالجة");
        }
        
        try {
            InputValidator.validateRouterSettings();
            
            const dir = document.getElementById('scanDir').value;
            APP_STATE.lastScanDir = dir;
            const stepOver = parseFloat(document.getElementById('stepOver').value) || 5;
            const maxDepth = parseFloat(document.getElementById('maxDepth').value) || 3;
            const feed = parseFloat(document.getElementById('feedRate').value) || 800;
            const safeZ = parseFloat(document.getElementById('safeZ').value) || 5;

            const useFixedZ = document.getElementById('fixedZ').checked;
            const fixedZValue = parseFloat(document.getElementById('fixedZValue').value) || -1.0;
            const invertZ = document.getElementById('invertZ').checked;

            const workWidth = cmToMm(parseFloat(document.getElementById('workWidth').value) || 30);
            const workHeight = cmToMm(parseFloat(document.getElementById('workHeight').value) || 20);
            const originX = cmToMm(parseFloat(document.getElementById('originX').value) || 0);
            const originY = cmToMm(parseFloat(document.getElementById('originY').value) || 0);

            const lines = [];
            lines.push('G21 G90 G17'); // Metric, absolute, XY plane
            lines.push('G0 Z' + safeZ.toFixed(2));

            let totalLen = 0;
            const step = scaleDown ? stepOver * 4 : stepOver;
            const scaleX = workWidth / APP_STATE.previewCanvas.width;
            const scaleY = workHeight / APP_STATE.previewCanvas.height;

            if (dir === 'x') {
                for (let y = 0; y < APP_STATE.previewCanvas.height; y += step) {
                    const rowPoints = [];
                    let inContour = false;
                    let segmentStart = -1;
                    
                    for (let x = 0; x < APP_STATE.previewCanvas.width; x += 2) {
                        const pt = new cv.Point(x, y);
                        const inside = cv.pointPolygonTest(APP_STATE.contour, pt, false) >= 0;
                        if (inside && !inContour) { 
                            segmentStart = x; 
                            inContour = true; 
                        } else if (!inside && inContour) {
                            this.addSegmentPoints(rowPoints, segmentStart, x - 1, y, scaleX, scaleY, originX, originY, maxDepth, invertZ, useFixedZ, fixedZValue);
                            inContour = false;
                        }
                    }
                    
                    if (inContour) {
                        this.addSegmentPoints(rowPoints, segmentStart, APP_STATE.previewCanvas.width - 1, y, scaleX, scaleY, originX, originY, maxDepth, invertZ, useFixedZ, fixedZValue);
                    }
                    
                    if (rowPoints.length > 1) {
                        this.processRowPoints(rowPoints, lines, feed, safeZ, (y / step) % 2 !== 0);
                        totalLen += this.calculateRowLength(rowPoints);
                    }
                }
            } else if (dir === 'y') {
                for (let x = 0; x < APP_STATE.previewCanvas.width; x += step) {
                    const colPoints = [];
                    let inContour = false;
                    let segmentStart = -1;
                    
                    for (let y = 0; y < APP_STATE.previewCanvas.height; y += 2) {
                        const pt = new cv.Point(x, y);
                        const inside = cv.pointPolygonTest(APP_STATE.contour, pt, false) >= 0;
                        if (inside && !inContour) { 
                            segmentStart = y; 
                            inContour = true; 
                        } else if (!inside && inContour) {
                            this.addVerticalSegmentPoints(colPoints, x, segmentStart, y - 1, scaleX, scaleY, originX, originY, maxDepth, invertZ, useFixedZ, fixedZValue);
                            inContour = false;
                        }
                    }
                    
                    if (inContour) {
                        this.addVerticalSegmentPoints(colPoints, x, segmentStart, APP_STATE.previewCanvas.height - 1, scaleX, scaleY, originX, originY, maxDepth, invertZ, useFixedZ, fixedZValue);
                    }
                    
                    if (colPoints.length > 1) {
                        this.processRowPoints(colPoints, lines, feed, safeZ, (x / step) % 2 !== 0);
                        totalLen += this.calculateRowLength(colPoints);
                    }
                }
            }

            lines.push('M5'); // Spindle off
            lines.push('M30'); // Program end

            // Estimate time
            const timeMin = (totalLen / (feed || 1)) + ((Math.max(0, safeZ) / 50) * (totalLen / 1000));
            document.getElementById('estTime').innerHTML = "⏱️ تقدير الوقت: " + timeMin.toFixed(1) + " دقيقة";

            const gcode = lines.join('\n');
            APP_STATE.lastGeneratedGcode = gcode;
            return gcode;

        } catch (error) {
            console.error('خطأ في توليد G-code:', error);
            throw new Error('فشل في توليد G-code (Raster): ' + error.message);
        }
    }

    /**
     * Add segment points for horizontal scanning
     */
    addSegmentPoints(rowPoints, startX, endX, y, scaleX, scaleY, originX, originY, maxDepth, invertZ, useFixedZ, fixedZValue) {
        try {
            for (let x = startX; x <= endX; x += 2) {
                const pv = this.sampleGrayAt(x, y);
                let z;
                if (useFixedZ) {
                    z = fixedZValue;
                } else {
                    z = -((255 - pv) / 255.0) * maxDepth;
                }
                if (invertZ) z = -z;
                const scaledX = (x * scaleX) + originX;
                const scaledY = (y * scaleY) + originY;
                rowPoints.push({ x: scaledX, y: scaledY, z });
            }
        } catch (error) {
            console.warn('خطأ في إضافة نقاط المقطع:', error);
        }
    }

    /**
     * Add segment points for vertical scanning
     */
    addVerticalSegmentPoints(colPoints, x, startY, endY, scaleX, scaleY, originX, originY, maxDepth, invertZ, useFixedZ, fixedZValue) {
        try {
            for (let y = startY; y <= endY; y += 2) {
                const pv = this.sampleGrayAt(x, y);
                let z;
                if (useFixedZ) {
                    z = fixedZValue;
                } else {
                    z = -((255 - pv) / 255.0) * maxDepth;
                }
                if (invertZ) z = -z;
                const scaledX = (x * scaleX) + originX;
                const scaledY = (y * scaleY) + originY;
                colPoints.push({ x: scaledX, y: scaledY, z });
            }
        } catch (error) {
            console.warn('خطأ في إضافة نقاط المقطع الرأسي:', error);
        }
    }

    /**
     * Process row points and add to G-code
     */
    processRowPoints(rowPoints, lines, feed, safeZ, reverse) {
        try {
            if (reverse) rowPoints.reverse();
            if (rowPoints.length === 0) return;
            
            lines.push('G0 X' + rowPoints[0].x.toFixed(2) + ' Y' + rowPoints[0].y.toFixed(2) + ' Z' + safeZ.toFixed(2));
            lines.push('G1 F' + feed.toFixed(0));
            
            for (let i = 0; i < rowPoints.length; i++) {
                const p = rowPoints[i];
                lines.push('G1 X' + p.x.toFixed(2) + ' Y' + p.y.toFixed(2) + ' Z' + p.z.toFixed(3));
            }
            
            lines.push('G0 Z' + safeZ.toFixed(2));
        } catch (error) {
            console.warn('خطأ في معالجة نقاط الصف:', error);
        }
    }

    /**
     * Calculate row length for time estimation
     */
    calculateRowLength(rowPoints) {
        try {
            let length = 0;
            for (let i = 1; i < rowPoints.length; i++) {
                length += Math.hypot(rowPoints[i].x - rowPoints[i-1].x, rowPoints[i].y - rowPoints[i-1].y);
            }
            return length;
        } catch {
            return 0;
        }
    }

    /**
     * Sample grayscale value at coordinates
     */
    sampleGrayAt(x, y) {
        try {
            if (!APP_STATE.grayMat || !APP_STATE.previewCanvas) return 128;
            
            const gw = APP_STATE.grayMat.cols, gh = APP_STATE.grayMat.rows;
            if (gw === 0 || gh === 0) return 128;
            
            // Check bounds
            const gx_f = Math.max(0, Math.min(gw - 1, (x / APP_STATE.previewCanvas.width) * (gw - 1)));
            const gy_f = Math.max(0, Math.min(gh - 1, (y / APP_STATE.previewCanvas.height) * (gh - 1)));
            
            const x0 = Math.floor(gx_f), y0 = Math.floor(gy_f);
            const x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1);
            const sx = gx_f - x0, sy = gy_f - y0;
            
            // Check matrix bounds
            const idx00 = y0 * gw + x0;
            const idx10 = y0 * gw + x1;
            const idx01 = y1 * gw + x0;
            const idx11 = y1 * gw + x1;
            
            if (idx00 >= APP_STATE.grayMat.data.length || idx10 >= APP_STATE.grayMat.data.length || 
                idx01 >= APP_STATE.grayMat.data.length || idx11 >= APP_STATE.grayMat.data.length) {
                return 128;
            }
            
            const v00 = APP_STATE.grayMat.data[idx00];
            const v10 = APP_STATE.grayMat.data[idx10];
            const v01 = APP_STATE.grayMat.data[idx01];
            const v11 = APP_STATE.grayMat.data[idx11];
            
            const v0 = v00 * (1 - sx) + v10 * sx;
            const v1 = v01 * (1 - sx) + v11 * sx;
            return Math.round(v0 * (1 - sy) + v1 * sy);
        } catch (error) {
            console.warn('خطأ في أخذ عينات الرمادي:', error);
            return 128;
        }
    }

    /**
     * Generate contour G-code
     */
    generateContourGcode() {
        if (!APP_STATE.grayMat || !APP_STATE.contour) {
            throw new Error("لا توجد بيانات حواف لتوليد الكود");
        }
        
        try {
            InputValidator.validateRouterSettings();
            
            const mode = document.getElementById('contourMode').value || 'outer';
            APP_STATE.lastScanDir = 'contour';
            const feed = parseFloat(document.getElementById('feedRate').value) || 800;
            const safeZ = parseFloat(document.getElementById('safeZ').value) || 5;
            const maxDepth = parseFloat(document.getElementById('maxDepth').value) || 3;

            const useFixedZ = document.getElementById('fixedZ').checked;
            const fixedZValue = parseFloat(document.getElementById('fixedZValue').value) || -1.0;
            const invertZ = document.getElementById('invertZ').checked;

            const workWidth = cmToMm(parseFloat(document.getElementById('workWidth').value) || 30);
            const workHeight = cmToMm(parseFloat(document.getElementById('workHeight').value) || 20);
            const originX = cmToMm(parseFloat(document.getElementById('originX').value) || 0);
            const originY = cmToMm(parseFloat(document.getElementById('originY').value) || 0);
            const scaleX = workWidth / APP_STATE.previewCanvas.width;
            const scaleY = workHeight / APP_STATE.previewCanvas.height;

            const lines = [];
            lines.push('G21 G90 G17');
            lines.push('G0 Z' + safeZ.toFixed(2));

            const contoursToUse = (mode === 'outer') ? 
                [APP_STATE.contour] : 
                [APP_STATE.contour, ...APP_STATE.additionalContours.map(c => c.contour)];
            let totalLen = 0;

            for (const cnt of contoursToUse) {
                if (!cnt) continue;
                
                const data = cnt.data32S;
                if (!data || data.length < 4) continue;

                let x0 = data[0], y0 = data[1];
                const startX = (x0 * scaleX + originX).toFixed(2);
                const startY = (y0 * scaleY + originY).toFixed(2);
                const startGray = this.sampleGrayAt(x0, y0);

                let zStart;
                if (useFixedZ) zStart = fixedZValue;
                else zStart = -((255 - startGray) / 255.0) * maxDepth;
                if (invertZ) zStart = -zStart;

                lines.push(`G0 X${startX} Y${startY} Z${safeZ.toFixed(2)}`);
                lines.push(`G1 F${feed.toFixed(0)}`);
                lines.push(`G1 Z${zStart.toFixed(3)}`);

                for (let i = 2; i < data.length; i += 2) {
                    const x = data[i], y = data[i + 1];
                    const px = (x * scaleX + originX).toFixed(2);
                    const py = (y * scaleY + originY).toFixed(2);
                    const pv = this.sampleGrayAt(x, y);
                    let zVal;
                    if (useFixedZ) zVal = fixedZValue;
                    else zVal = -((255 - pv) / 255.0) * maxDepth;
                    if (invertZ) zVal = -zVal;
                    lines.push(`G1 X${px} Y${py} Z${zVal.toFixed(3)}`);
                    totalLen += Math.hypot(x - x0, y - y0);
                    x0 = x; y0 = y;
                }

                lines.push(`G1 X${startX} Y${startY} Z${zStart.toFixed(3)}`);
                lines.push(`G0 Z${safeZ.toFixed(2)}`);
            }

            lines.push('M5');
            lines.push('M30');

            const timeMin = totalLen / (parseFloat(document.getElementById('feedRate').value)||800);
            document.getElementById('estTime').innerHTML = "⏱️ تقدير الوقت (Contour): " + timeMin.toFixed(1) + " دقيقة";

            const gcode = lines.join('\n');
            APP_STATE.lastGeneratedGcode = gcode;
            return gcode;

        } catch (error) {
            console.error('خطأ في توليد G-code الكنتور:', error);
            throw new Error('فشل في توليد G-code (Contour): ' + error.message);
        }
    }

    /**
     * Generate laser engraving G-code
     */
    generateLaserEngraveGcode() {
        if (!APP_STATE.grayMat || !APP_STATE.contour) {
            throw new Error("لا توجد صورة جاهزة للمعالجة");
        }

        try {
            InputValidator.validateLaserSettings();
            
            const laserPower = parseInt(document.getElementById('laserPower').value) || 80;
            const laserSpeed = parseInt(document.getElementById('laserSpeed').value) || 2000;
            const dynamicPower = document.getElementById('laserDynamic').checked;

            const workWidth = cmToMm(parseFloat(document.getElementById('laserWorkWidth').value) || 30);
            const workHeight = cmToMm(parseFloat(document.getElementById('laserWorkHeight').value) || 20);
            const originX = cmToMm(parseFloat(document.getElementById('laserOriginX').value) || 0);
            const originY = cmToMm(parseFloat(document.getElementById('laserOriginY').value) || 0);

            const lines = [];
            lines.push('G21 G90'); // Metric, absolute
            lines.push('G0 X0 Y0');
            lines.push('M3 S' + Math.round(laserPower * 10)); // Laser on
            
            const scaleX = workWidth / APP_STATE.previewCanvas.width;
            const scaleY = workHeight / APP_STATE.previewCanvas.height;
            
            const stepOver = 3.0;
            let totalLen = 0;
            let pointCount = 0;

            for (let y = 0; y < APP_STATE.previewCanvas.height; y += stepOver) {
                const rowPoints = [];
                
                for (let x = 0; x < APP_STATE.previewCanvas.width; x += 3) {
                    const pt = new cv.Point(x, y);
                    const inside = cv.pointPolygonTest(APP_STATE.contour, pt, false) >= 0;
                    
                    if (inside) {
                        const pv = this.sampleGrayAt(x, y);
                        const power = dynamicPower ? Math.round((pv / 255) * laserPower) : laserPower;
                        const scaledX = (x * scaleX) + originX;
                        const scaledY = (y * scaleY) + originY;
                        rowPoints.push({ x: scaledX, y: scaledY, power });
                        pointCount++;
                        
                        if (pointCount > 2000) break;
                    }
                }
                
                if (rowPoints.length > 1) {
                    const reverse = (y / stepOver) % 2 !== 0;
                    if (reverse) rowPoints.reverse();
                    
                    lines.push('G0 X' + rowPoints[0].x.toFixed(2) + ' Y' + rowPoints[0].y.toFixed(2));
                    lines.push('G1 F' + laserSpeed.toFixed(0));
                    
                    for (let i = 0; i < rowPoints.length; i++) {
                        const p = rowPoints[i];
                        lines.push('G1 X' + p.x.toFixed(2) + ' Y' + p.y.toFixed(2));
                        // Note: Laser power control would typically be handled by PWM
                    }
                    
                    totalLen += this.calculateRowLength(rowPoints);
                }
                
                if (pointCount > 2000) break;
            }

            lines.push('M5'); // Laser off
            lines.push('M30'); // Program end

            const timeMin = totalLen / laserSpeed;
            document.getElementById('estTime').innerHTML = "⏱️ تقدير وقت الليزر: " + timeMin.toFixed(1) + " دقيقة | " + pointCount + " نقطة";

            const gcode = lines.join('\n');
            APP_STATE.lastGeneratedGcode = gcode;
            return gcode;
        } catch (error) {
            console.error('خطأ في توليد كود الليزر:', error);
            throw new Error('فشل في توليد كود الليزر: ' + error.message);
        }
    }

    /**
     * Generate quick laser G-code (simplified)
     */
    generateLaserQuickGcode() {
        // Simplified version for quick testing
        return this.generateLaserEngraveGcode().then(gcode => {
            // Modify for quick mode
            const lines = gcode.split('\n');
            const quickLines = lines.filter(line => 
                !line.includes('F') || parseFloat(line.split('F')[1]) > 1000
            );
            return quickLines.join('\n');
        });
    }

    /**
     * Generate 3D printing G-code
     */
    generate3DGcode() {
        if (!APP_STATE.threeDModel) {
            throw new Error("لا يوجد نموذج ثلاثي الأبعاد محمل");
        }
        
        try {
            InputValidator.validate3DSettings();
            
            // This is a simplified 3D G-code generator
            // In a real implementation, you would use a proper slicing engine
            
            const layerHeight = parseFloat(document.getElementById('threedLayerHeight').value) || 0.2;
            const printSpeed = parseFloat(document.getElementById('threedPrintSpeed').value) || 50;
            const fillDensity = parseFloat(document.getElementById('threedFillDensity').value) || 20;
            const workWidth = cmToMm(parseFloat(document.getElementById('threedWorkWidth').value) || 30);
            const workHeight = cmToMm(parseFloat(document.getElementById('threedWorkHeight').value) || 20);
            const workDepth = parseFloat(document.getElementById('threedWorkDepth').value) || 10;
            
            const lines = [];
            lines.push('; G-code للنموذج ثلاثي الأبعاد');
            lines.push('; تم التوليد بواسطة CNC AI');
            lines.push('G21 G90 G94 ; Set units to millimeters, absolute positioning');
            lines.push('M82 ; Set extruder to absolute mode');
            lines.push('M107 ; Fan off');
            lines.push('G28 ; Home all axes');
            
            // Simple layer generation
            const layers = Math.floor(workDepth / layerHeight);
            
            for (let layer = 0; layer < layers; layer++) {
                const z = layer * layerHeight;
                lines.push(`; Layer ${layer + 1}, Z = ${z.toFixed(2)}`);
                lines.push(`G0 Z${z.toFixed(2)} F3000`);
                
                // Perimeter
                lines.push('; Outer perimeter');
                lines.push('G1 X10 Y10 F2400');
                lines.push(`G1 X${workWidth - 10} Y10`);
                lines.push(`G1 X${workWidth - 10} Y${workHeight - 10}`);
                lines.push(`G1 X10 Y${workHeight - 10}`);
                lines.push('G1 X10 Y10');
                
                // Simple infill pattern
                const infillStep = Math.max(5, 20 * (100 - fillDensity) / 100);
                for (let y = 15; y < workHeight - 15; y += infillStep) {
                    lines.push(`G0 X10 Y${y} F3000`);
                    lines.push(`G1 X${workWidth - 10} Y${y} F${printSpeed * 60}`);
                }
            }
            
            lines.push('; Finished printing');
            lines.push('G0 Z15 F3000 ; Move Z up');
            lines.push('M84 ; Disable steppers');
            lines.push('M30 ; End of program');
            
            const estimatedTime = (layers * 2) / 60;
            document.getElementById('estTime').innerHTML = "⏱️ تقدير وقت الطباعة: " + estimatedTime.toFixed(1) + " دقيقة | " + layers + " طبقة";
            
            const gcode = lines.join('\n');
            APP_STATE.lastGeneratedGcode = gcode;
            return gcode;
        } catch (error) {
            console.error('خطأ في توليد G-code ثلاثي الأبعاد:', error);
            throw new Error('فشل في توليد G-code ثلاثي الأبعاد: ' + error.message);
        }
    }
}

// Create global instance
const gcodeGenerator = new GCodeGenerator();

// Global functions for backward compatibility
function generateRasterGcode(scaleDown = false) {
    return gcodeGenerator.generateRasterGcode(scaleDown);
}

function generateContourGcode() {
    return gcodeGenerator.generateContourGcode();
}

function generateLaserEngraveGcode() {
    return gcodeGenerator.generateLaserEngraveGcode();
}

function generateLaserQuickGcode() {
    return gcodeGenerator.generateLaserQuickGcode();
}

function generate3DGcode() {
    return gcodeGenerator.generate3DGcode();
}

function sampleGrayAt(x, y) {
    return gcodeGenerator.sampleGrayAt(x, y);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        GCodeGenerator, 
        gcodeGenerator,
        generateRasterGcode,
        generateContourGcode,
        generateLaserEngraveGcode,
        generateLaserQuickGcode,
        generate3DGcode,
        sampleGrayAt
    };
}
