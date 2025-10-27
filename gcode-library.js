/**
 * G-code Library for parsing, generating, and manipulating G-code
 */
class GCodeLibrary {
    constructor() {
        this.commands = {
            motion: ['G0', 'G1', 'G2', 'G3', 'G4'],
            plane: ['G17', 'G18', 'G19'],
            units: ['G20', 'G21'],
            positioning: ['G90', 'G91'],
            tool: ['M3', 'M4', 'M5', 'M6'],
            coolant: ['M7', 'M8', 'M9'],
            program: ['M0', 'M1', 'M2', 'M30']
        };
    }

    /**
     * Parse G-code text into structured format
     */
    parse(gcodeText) {
        if (!gcodeText || typeof gcodeText !== 'string') {
            return [];
        }

        const lines = gcodeText.split('\n');
        const parsed = [];

        for (let i = 0; i < lines.length; i++) {
            const original = lines[i];
            const trimmed = original.trim();
            
            if (!trimmed) {
                parsed.push({ 
                    lineNumber: i + 1,
                    original,
                    type: 'empty',
                    comment: null
                });
                continue;
            }

            // Extract comment
            let comment = null;
            let code = trimmed;
            
            const commentIndex = trimmed.indexOf(';');
            if (commentIndex >= 0) {
                comment = trimmed.substring(commentIndex + 1).trim();
                code = trimmed.substring(0, commentIndex).trim();
            }

            if (!code && comment) {
                parsed.push({
                    lineNumber: i + 1,
                    original,
                    type: 'comment',
                    comment
                });
                continue;
            }

            // Parse G-code command
            const command = this.parseCommand(code, i + 1);
            command.original = original;
            command.lineNumber = i + 1;
            command.comment = comment;
            
            parsed.push(command);
        }

        return parsed;
    }

    /**
     * Parse individual G-code command
     */
    parseCommand(code, lineNumber) {
        const parts = code.split(/\s+/);
        const command = {
            type: 'command',
            commands: [],
            parameters: {},
            original: code
        };

        for (const part of parts) {
            if (!part) continue;

            const firstChar = part[0].toUpperCase();
            const rest = part.substring(1);

            // Check if it's a command (G or M code)
            if ((firstChar === 'G' || firstChar === 'M') && /^\d+/.test(rest)) {
                command.commands.push(firstChar + rest);
            } 
            // Check if it's a parameter
            else if ('XYZIJKFRSP'.includes(firstChar)) {
                const value = parseFloat(rest);
                if (!isNaN(value)) {
                    command.parameters[firstChar] = value;
                }
            }
        }

        return command;
    }

    /**
     * Convert parsed G-code back to text
     */
    stringify(parsed) {
        return parsed.map(line => {
            if (line.type === 'empty') return '';
            if (line.type === 'comment') return `; ${line.comment}`;
            
            let output = '';
            
            // Add commands
            if (line.commands && line.commands.length > 0) {
                output += line.commands.join(' ');
            }
            
            // Add parameters
            if (line.parameters && Object.keys(line.parameters).length > 0) {
                if (output) output += ' ';
                output += Object.entries(line.parameters)
                    .map(([key, value]) => `${key}${value.toFixed(4)}`)
                    .join(' ');
            }
            
            // Add comment
            if (line.comment) {
                if (output) output += ' ';
                output += `; ${line.comment}`;
            }
            
            return output;
        }).join('\n');
    }

    /**
     * Extract toolpath from G-code
     */
    extractToolpath(parsed) {
        const toolpath = [];
        let currentPosition = { x: 0, y: 0, z: 0 };
        let absoluteMode = true;

        for (const line of parsed) {
            if (line.type !== 'command') continue;

            // Handle positioning mode
            if (line.commands.includes('G90')) {
                absoluteMode = true;
            } else if (line.commands.includes('G91')) {
                absoluteMode = false;
            }

            // Handle motion commands
            if (line.commands.includes('G0') || line.commands.includes('G1')) {
                const newPosition = { ...currentPosition };

                // Update coordinates
                if ('X' in line.parameters) {
                    newPosition.x = absoluteMode ? 
                        line.parameters.X : 
                        currentPosition.x + line.parameters.X;
                }
                if ('Y' in line.parameters) {
                    newPosition.y = absoluteMode ? 
                        line.parameters.Y : 
                        currentPosition.y + line.parameters.Y;
                }
                if ('Z' in line.parameters) {
                    newPosition.z = absoluteMode ? 
                        line.parameters.Z : 
                        currentPosition.z + line.parameters.Z;
                }

                // Add to toolpath if position changed
                if (newPosition.x !== currentPosition.x || 
                    newPosition.y !== currentPosition.y || 
                    newPosition.z !== currentPosition.z) {
                    
                    toolpath.push({
                        x: newPosition.x,
                        y: newPosition.y,
                        z: newPosition.z,
                        rapid: line.commands.includes('G0'),
                        lineNumber: line.lineNumber
                    });
                }

                currentPosition = newPosition;
            }
        }

        return toolpath;
    }

    /**
     * Calculate toolpath statistics
     */
    analyzeToolpath(toolpath) {
        if (!toolpath || toolpath.length === 0) {
            return {
                totalPoints: 0,
                totalDistance: 0,
                rapidDistance: 0,
                feedDistance: 0,
                bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }
            };
        }

        let totalDistance = 0;
        let rapidDistance = 0;
        let feedDistance = 0;
        const bounds = {
            minX: toolpath[0].x,
            maxX: toolpath[0].x,
            minY: toolpath[0].y,
            maxY: toolpath[0].y,
            minZ: toolpath[0].z,
            maxZ: toolpath[0].z
        };

        for (let i = 1; i < toolpath.length; i++) {
            const prev = toolpath[i - 1];
            const curr = toolpath[i];
            
            const distance = Math.sqrt(
                Math.pow(curr.x - prev.x, 2) +
                Math.pow(curr.y - prev.y, 2) +
                Math.pow(curr.z - prev.z, 2)
            );

            totalDistance += distance;
            
            if (curr.rapid) {
                rapidDistance += distance;
            } else {
                feedDistance += distance;
            }

            // Update bounds
            bounds.minX = Math.min(bounds.minX, curr.x);
            bounds.maxX = Math.max(bounds.maxX, curr.x);
            bounds.minY = Math.min(bounds.minY, curr.y);
            bounds.maxY = Math.max(bounds.maxY, curr.y);
            bounds.minZ = Math.min(bounds.minZ, curr.z);
            bounds.maxZ = Math.max(bounds.maxZ, curr.z);
        }

        return {
            totalPoints: toolpath.length,
            totalDistance,
            rapidDistance,
            feedDistance,
            bounds
        };
    }

    /**
     * Generate basic G-code header
     */
    generateHeader(settings = {}) {
        const {
            units = 'G21', // mm
            positioning = 'G90', // absolute
            plane = 'G17', // XY plane
            safeZ = 5,
            feedRate = 1000
        } = settings;

        const lines = [
            '; CNC AI Generated G-code',
            '; ' + new Date().toISOString(),
            `${units} ${positioning} ${plane} ; Units, Positioning, Plane`,
            `G0 Z${safeZ.toFixed(2)} ; Move to safe Z`,
            `G1 F${feedRate.toFixed(0)} ; Set feed rate`
        ];

        return lines.join('\n');
    }

    /**
     * Generate G-code footer
     */
    generateFooter() {
        return [
            'G0 Z5 ; Move to safe Z',
            'M5 ; Stop spindle',
            'M30 ; Program end'
        ].join('\n');
    }

    /**
     * Optimize G-code (remove redundant commands, etc.)
     */
    optimize(parsed) {
        const optimized = [];
        let lastCommand = null;
        let lastParameters = {};

        for (const line of parsed) {
            if (line.type !== 'command') {
                optimized.push(line);
                continue;
            }

            // Skip redundant modal commands
            if (this.isModalCommand(line) && this.commandsEqual(line, lastCommand)) {
                continue;
            }

            // Remove redundant parameters
            const cleanedLine = this.cleanRedundantParameters(line, lastParameters);
            optimized.push(cleanedLine);

            lastCommand = line;
            lastParameters = { ...line.parameters };
        }

        return optimized;
    }

    /**
     * Check if command is modal
     */
    isModalCommand(command) {
        const modalCommands = [
            'G0', 'G1', 'G2', 'G3', 'G17', 'G18', 'G19', 
            'G20', 'G21', 'G90', 'G91', 'G94'
        ];

        return command.commands.some(cmd => modalCommands.includes(cmd));
    }

    /**
     * Check if two commands are equal
     */
    commandsEqual(cmd1, cmd2) {
        if (!cmd1 || !cmd2) return false;
        
        return cmd1.commands.join(' ') === cmd2.commands.join(' ') &&
               JSON.stringify(cmd1.parameters) === JSON.stringify(cmd2.parameters);
    }

    /**
     * Remove redundant parameters from command
     */
    cleanRedundantParameters(command, lastParameters) {
        const cleaned = { ...command };
        cleaned.parameters = { ...command.parameters };

        // Remove parameters that haven't changed
        for (const [key, value] of Object.entries(command.parameters)) {
            if (lastParameters[key] === value) {
                delete cleaned.parameters[key];
            }
        }

        return cleaned;
    }

    /**
     * Validate G-code syntax
     */
    validate(gcodeText) {
        const errors = [];
        const parsed = this.parse(gcodeText);

        for (const line of parsed) {
            if (line.type !== 'command') continue;

            // Check for valid commands
            for (const cmd of line.commands) {
                if (!this.isValidCommand(cmd)) {
                    errors.push(`سطر ${line.lineNumber}: أمر غير معروف "${cmd}"`);
                }
            }

            // Check parameter values
            for (const [param, value] of Object.entries(line.parameters)) {
                if (isNaN(value)) {
                    errors.push(`سطر ${line.lineNumber}: قيمة غير صالحة للمعامل ${param}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            lineCount: parsed.length,
            commandCount: parsed.filter(line => line.type === 'command').length
        };
    }

    /**
     * Check if command is valid
     */
    isValidCommand(command) {
        // Check if it matches G or M code pattern
        if (!/^[GM]\d+$/i.test(command)) {
            return false;
        }

        // Add more specific validation as needed
        return true;
    }

    /**
     * Estimate machining time
     */
    estimateMachiningTime(parsed, settings = {}) {
        const toolpath = this.extractToolpath(parsed);
        const stats = this.analyzeToolpath(toolpath);
        
        const {
            rapidFeedrate = 3000, // mm/min
            defaultFeedrate = 1000 // mm/min
        } = settings;

        const rapidTime = (stats.rapidDistance / rapidFeedrate) * 60; // seconds
        const feedTime = (stats.feedDistance / defaultFeedrate) * 60; // seconds
        
        const totalTime = rapidTime + feedTime;

        return {
            totalTime: totalTime / 60, // minutes
            rapidTime: rapidTime / 60,
            feedTime: feedTime / 60,
            totalDistance: stats.totalDistance,
            rapidDistance: stats.rapidDistance,
            feedDistance: stats.feedDistance
        };
    }

    /**
     * Convert between G-code dialects
     */
    convertDialect(parsed, fromDialect, toDialect) {
        // This is a simplified conversion - extend as needed
        const conversions = {
            'GRBL->LinuxCNC': {
                'G21': 'G21', // mm
                'G90': 'G90', // absolute
                'G0': 'G0',   // rapid
                'G1': 'G1'    // linear
            }
            // Add more conversion rules as needed
        };

        const conversionRules = conversions[`${fromDialect}->${toDialect}`];
        if (!conversionRules) {
            throw new Error(`تحويل اللهجة غير مدعوم: ${fromDialect} إلى ${toDialect}`);
        }

        return parsed.map(line => {
            if (line.type !== 'command') return line;

            const converted = { ...line };
            converted.commands = line.commands.map(cmd => conversionRules[cmd] || cmd);
            
            return converted;
        });
    }
}

// Create global instance
const gcodeLibrary = new GCodeLibrary();

// Global functions for backward compatibility
function parseGCode(gcodeText) {
    return gcodeLibrary.parse(gcodeText);
}

function stringifyGCode(parsed) {
    return gcodeLibrary.stringify(parsed);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        GCodeLibrary, 
        gcodeLibrary,
        parseGCode,
        stringifyGCode
    };
}
