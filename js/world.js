import * as THREE from 'three';

export class World {
    constructor(worldSizeX = 40, worldSizeZ = 40, terrainThickness = 3, randomTerrain = true) {
        this.worldSizeX = worldSizeX;
        this.worldSizeZ = worldSizeZ;
        this.worldSize = Math.max(worldSizeX, worldSizeZ); // For backwards compatibility
        this.terrainThickness = terrainThickness;
        this.randomTerrain = randomTerrain;
        this.data = new Map();
        this.seedX = Math.random() * 100;
        this.seedZ = Math.random() * 100;
    }

    getChunkKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    has(x, y, z) {
        const key = typeof x === 'string' ? x : this.getChunkKey(x, y, z);
        return this.data.has(key);
    }

    set(x, y, z, blockType = true) {
        const key = typeof x === 'string' ? x : this.getChunkKey(x, y, z);
        this.data.set(key, blockType);
    }

    get(x, y, z) {
        const key = typeof x === 'string' ? x : this.getChunkKey(x, y, z);
        return this.data.get(key);
    }

    delete(x, y, z) {
        const key = typeof x === 'string' ? x : this.getChunkKey(x, y, z);
        this.data.delete(key);
    }

    clear() {
        this.data.clear();
    }

    getHeight(x, z) {
        if (!this.randomTerrain) {
            return 0; // Flat terrain at y=0
        }
        const scale = 0.2;
        const h = Math.sin((x + this.seedX) * scale) * Math.cos((z + this.seedZ) * scale) * 2 + 
                  Math.sin((x + this.seedX) * scale * 0.5 + (z + this.seedZ) * scale * 0.5) * 2;
        return Math.floor(h);
    }

    generateTerrain(materials) {
        const geometry = new THREE.BoxGeometry();
        const maxCount = this.worldSizeX * this.worldSizeZ * this.terrainThickness;
        const mesh = new THREE.InstancedMesh(geometry, materials, maxCount);
        mesh.receiveShadow = true;
        mesh.castShadow = true;

        const dummy = new THREE.Object3D();
        let index = 0;

        for (let x = 0; x < this.worldSizeX; x++) {
            for (let z = 0; z < this.worldSizeZ; z++) {
                const wx = x - this.worldSizeX / 2;
                const wz = z - this.worldSizeZ / 2;
                const surfaceHeight = this.getHeight(wx, wz);

                for (let y = 0; y < this.terrainThickness; y++) {
                    const wy = surfaceHeight - y;

                    dummy.position.set(wx, wy, wz);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(index++, dummy.matrix);

                    this.set(wx, wy, wz, 'dirt');
                }
            }
        }

        mesh.count = index;
        mesh.instanceMatrix.needsUpdate = true;
        return mesh;
    }

    checkCollision(position) {
        const x = Math.round(position.x);
        const y = Math.round(position.y);
        const z = Math.round(position.z);
        return this.has(x, y, z);
    }

    generateRandomPoles(numPoles = 5, poleHeight = 5) {
        const poles = [];
        const minDistanceBetweenPoles = 10;
        const attempts = numPoles * 50;
        let polesCreated = 0;

        for (let attempt = 0; attempt < attempts && polesCreated < numPoles; attempt++) {
            const wx = Math.floor(Math.random() * this.worldSizeX) - this.worldSizeX / 2;
            const wz = Math.floor(Math.random() * this.worldSizeZ) - this.worldSizeZ / 2;
            const surfaceHeight = Math.floor(this.getHeight(wx, wz)) + 1;

            // Check distance from other poles
            const tooClose = poles.some(pole => {
                const distance = Math.sqrt(
                    Math.pow(pole.x - wx, 2) + Math.pow(pole.z - wz, 2)
                );
                return distance < minDistanceBetweenPoles;
            });

            if (tooClose) continue;

            // Create pole (5 blocks high, starting at surface)
            for (let i = 0; i < poleHeight; i++) {
                const wy = surfaceHeight + i;
                this.set(wx, wy, wz, 'metal-pole');
            }

            poles.push({ x: wx, y: surfaceHeight, z: wz, height: poleHeight });
            polesCreated++;
        }

        return poles;
    }
}

export function createHighlightMesh() {
    const highlightMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.001, 1.001, 1.001),
        new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
    );
    highlightMesh.visible = false;
    return highlightMesh;
}
