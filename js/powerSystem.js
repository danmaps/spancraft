/**
 * Power System Module
 * Handles power propagation logic for both challenge mode and free mode
 */

export class PowerSystem {
    /**
     * Propagate power through a network of conductors from given power sources
     * @param {Array} powerSourcePoles - Array of pole positions [{x, y, z}, ...] that are power sources
     * @param {Array} conductors - Array of conductor objects
     * @returns {Object} { poweredPoles: Set, poweredConductors: Set }
     */
    static propagatePower(powerSourcePoles, conductors) {
        // Start with given power source poles
        const poweredPoles = new Set();
        
        powerSourcePoles.forEach(pole => {
            const key = `${Math.round(pole.x)},${Math.round(pole.y)},${Math.round(pole.z)}`;
            poweredPoles.add(key);
        });
        
        const poweredConductors = new Set();
        let changed = true;
        
        // Iteratively propagate power through connected conductors
        while (changed) {
            changed = false;
            conductors.forEach(conductor => {
                const fromKey = `${Math.round(conductor.fromPos.x)},${Math.round(conductor.fromPos.y)},${Math.round(conductor.fromPos.z)}`;
                const toKey = `${Math.round(conductor.toPos.x)},${Math.round(conductor.toPos.y)},${Math.round(conductor.toPos.z)}`;
                
                const fromPowered = poweredPoles.has(fromKey);
                const toPowered = poweredPoles.has(toKey);
                
                if (fromPowered || toPowered) {
                    poweredConductors.add(conductor);
                    if (!fromPowered) {
                        poweredPoles.add(fromKey);
                        changed = true;
                    }
                    if (!toPowered) {
                        poweredPoles.add(toKey);
                        changed = true;
                    }
                }
            });
        }
        
        return { poweredPoles, poweredConductors };
    }
    
    /**
     * Get all power source poles (poles on battery blocks)
     * Scans world for batteries and expands to all connected pole blocks
     * @param {Array} conductors - Array of conductor objects (unused but kept for interface compatibility)
     * @param {World} world - World object for block queries
     * @returns {Array} Array of pole positions that are power sources
     */
    static getPowerSources(conductors, world) {
        if (!world) {
            return [];
        }
        
        const powerSources = [];
        const allPowerPoles = new Set();
        
        // Find all batteries in the world
        const batteries = [];
        world.data.forEach((blockType, key) => {
            if (blockType === 'battery') {
                const [x, y, z] = key.split(',').map(Number);
                batteries.push({ x, y, z });
            }
        });
        
        // For each battery, check if there's a pole directly above it
        batteries.forEach(battery => {
            const poleAbove = world.get(battery.x, battery.y + 1, battery.z);
            if (poleAbove === 'metal-pole' || poleAbove === 'pole') {
                // Found a pole on this battery, now expand to all connected pole blocks
                const queue = [{ x: battery.x, y: battery.y + 1, z: battery.z }];
                
                while (queue.length > 0) {
                    const pole = queue.shift();
                    const key = `${Math.round(pole.x)},${Math.round(pole.y)},${Math.round(pole.z)}`;
                    
                    if (allPowerPoles.has(key)) {
                        continue;
                    }
                    allPowerPoles.add(key);
                    powerSources.push(pole);
                    
                    const x = Math.round(pole.x);
                    const y = Math.round(pole.y);
                    const z = Math.round(pole.z);
                    
                    // Check block above
                    const blockAbove = world.get(x, y + 1, z);
                    if (blockAbove === 'metal-pole' || blockAbove === 'pole') {
                        const aboveKey = `${x},${y + 1},${z}`;
                        if (!allPowerPoles.has(aboveKey)) {
                            queue.push({ x, y: y + 1, z });
                        }
                    }
                    
                    // Check block below (stop at battery)
                    const blockBelow = world.get(x, y - 1, z);
                    if ((blockBelow === 'metal-pole' || blockBelow === 'pole')) {
                        const belowKey = `${x},${y - 1},${z}`;
                        if (!allPowerPoles.has(belowKey)) {
                            queue.push({ x, y: y - 1, z });
                        }
                    }
                }
            }
        });
        
        return powerSources;
    }
    
    /**
     * Check if a specific pole is in the powered set
     * @param {Object} pole - Pole with {x, y, z} position
     * @param {Set} poweredPoles - Set of powered pole keys
     * @returns {boolean}
     */
    static isPowered(pole, poweredPoles) {
        const key = `${Math.round(pole.x)},${Math.round(pole.y)},${Math.round(pole.z)}`;
        return poweredPoles.has(key);
    }
}
