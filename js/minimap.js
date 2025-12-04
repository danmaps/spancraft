export class Minimap {
    constructor(world, worldSize) {
        this.world = world;
        this.worldSize = worldSize;
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = this.canvas.width / worldSize;
        
        // Block type colors
        this.blockColors = {
            'dirt': '#4CAF50',      // Green (grass appearance)
            'stone': '#808080',
            'wood': '#DEB887',
            'cobblestone': '#696969',
            'brick': '#B22222',
            'grass': '#4CAF50',
            'metal-pole': '#2F4F4F',
            'wood-pole': '#8B4513',
            'pole': '#8B4513'
        };
        
        this.defaultColor = '#4CAF50'; // Green for terrain
    }

    getTopBlockAt(x, z) {
        // Find the highest block at this x,z position
        for (let y = 20; y >= -10; y--) {
            if (this.world.has(x, y, z)) {
                return { y, type: 'terrain' };
            }
        }
        return null;
    }

    getBlockColor(blockType) {
        return this.blockColors[blockType] || this.defaultColor;
    }

    update(playerPos, playerRotation, objects, conductors) {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const halfWorld = this.worldSize / 2;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Build a map of top blocks with their types from objects
        const topBlocks = new Map();
        
        // First, scan world data for terrain
        this.world.data.forEach((_, key) => {
            const [x, y, z] = key.split(',').map(Number);
            const mapKey = `${x},${z}`;
            const existing = topBlocks.get(mapKey);
            if (!existing || y > existing.y) {
                topBlocks.set(mapKey, { y, type: 'dirt' });
            }
        });
        
        // Then overlay with actual block types from objects
        objects.forEach(obj => {
            if (!obj.position || obj.userData?.isPoleHitbox || obj.userData?.isConductor || obj.userData?.isInstancedMesh) return;
            
            const x = Math.round(obj.position.x);
            const y = Math.round(obj.position.y);
            const z = Math.round(obj.position.z);
            const mapKey = `${x},${z}`;
            const existing = topBlocks.get(mapKey);
            
            if (!existing || y >= existing.y) {
                let blockType = obj.userData?.blockType || obj.userData?.poleType || 'dirt';
                if (obj.userData?.isPole) {
                    blockType = obj.userData.poleType || 'pole';
                }
                topBlocks.set(mapKey, { y, type: blockType });
            }
        });
        
        // Draw blocks (fill entire cell to remove grid lines)
        const cellSize = Math.ceil(this.scale) + 1; // Slightly larger to eliminate gaps
        topBlocks.forEach((block, key) => {
            const [x, z] = key.split(',').map(Number);
            const screenX = (x + halfWorld) * this.scale;
            const screenY = (z + halfWorld) * this.scale;
            
            ctx.fillStyle = this.getBlockColor(block.type);
            ctx.fillRect(screenX, screenY, cellSize, cellSize);
        });
        
        // Draw conductors as black lines (from center to center)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const halfCell = this.scale / 2;
        conductors.forEach(conductor => {
            const fromX = (conductor.fromPos.x + halfWorld) * this.scale + halfCell;
            const fromZ = (conductor.fromPos.z + halfWorld) * this.scale + halfCell;
            const toX = (conductor.toPos.x + halfWorld) * this.scale + halfCell;
            const toZ = (conductor.toPos.z + halfWorld) * this.scale + halfCell;
            
            ctx.beginPath();
            ctx.moveTo(fromX, fromZ);
            ctx.lineTo(toX, toZ);
            ctx.stroke();
        });
        
        // Draw player position and direction (iPhone-style blue view cone)
        const playerScreenX = (playerPos.x + halfWorld) * this.scale + halfCell;
        const playerScreenZ = (playerPos.z + halfWorld) * this.scale + halfCell;
        
        // Convert Three.js rotation.y to compass heading
        // Three.js: rotation.y = 0 points down -Z (north on minimap)
        // rotation.y increases counter-clockwise (left turn)
        // We want: 0° = up (north), 90° = right (east), 180° = down (south), 270° = left (west)
        const heading = -playerRotation; // Negate because Three.js counter-clockwise is our clockwise
        
        // Determine compass direction for logging
        let direction = 'NORTH (up)';
        if (heading > Math.PI / 4 && heading <= 3 * Math.PI / 4) direction = 'EAST (right)';
        else if (heading > 3 * Math.PI / 4 || heading <= -3 * Math.PI / 4) direction = 'SOUTH (down)';
        else if (heading > -3 * Math.PI / 4 && heading <= -Math.PI / 4) direction = 'WEST (left)';
        
        // console.log(`Player rotation.y: ${playerRotation.toFixed(2)}, Heading: ${heading.toFixed(2)}, Direction: ${direction}`);
        
        const coneLength = 18;
        const coneWidth = 0.5; // Cone spread angle in radians (~28 degrees each side)
        
        // Draw view cone using compass heading
        // heading in radians where 0=north(up), PI/2=east(right), PI=south(down), 3PI/2=west(left)
        ctx.fillStyle = 'rgba(0, 122, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(playerScreenX, playerScreenZ);
        
        // Left edge of cone
        const leftAngle = heading - coneWidth;
        ctx.lineTo(
            playerScreenX + Math.sin(leftAngle) * coneLength,
            playerScreenZ - Math.cos(leftAngle) * coneLength
        );
        
        // Right edge of cone
        const rightAngle = heading + coneWidth;
        ctx.lineTo(
            playerScreenX + Math.sin(rightAngle) * coneLength,
            playerScreenZ - Math.cos(rightAngle) * coneLength
        );
        ctx.closePath();
        ctx.fill();
        
        // Draw cone border
        ctx.strokeStyle = 'rgba(0, 122, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw player dot (solid blue)
        ctx.fillStyle = '#007AFF';
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenZ, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // White border on player dot
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
