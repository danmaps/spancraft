import * as THREE from 'three';

export class ChallengeMode {
    constructor(scene, world, blockMaterials, geometries) {
        this.scene = scene;
        this.world = world;
        this.blockMaterials = blockMaterials;
        this.geometries = geometries;
        
        this.isActive = false;
        this.budget = 10000; // Starting budget in "credits"
        this.spent = 0;
        this.costPerBlock = 100;
        this.costPerConductor = 50;
        
        this.substation = null;
        this.customer = null;
        this.substationPole = null;
        this.customerPole = null;
        
        this.isPowered = false;
    }

    start(objects) {
        this.isActive = true;
        this.budget = 10000;
        this.spent = 0;
        this.isPowered = false;
        
        // Change sky to dark
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
        
        // Create buildings
        this.createSubstation(objects);
        this.createCustomer(objects);
        
        // Update UI
        this.updateUI();
    }

    createSubstation(objects) {
        // Green substation - 2x2x2 blocks (matching voxel system)
        // Base corner at integer coordinates
        const baseX = -16;
        const baseY = 0;
        const baseZ = -16;
        
        // Create 2x2x2 cube building from individual voxel blocks
        const buildingMat = new THREE.MeshStandardMaterial({ 
            color: 0x00AA00, 
            emissive: 0x00FF00,
            emissiveIntensity: 0.3
        });
        
        // Create 8 blocks (2x2x2) aligned to voxel grid
        const blocks = [];
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
                    const block = new THREE.Mesh(blockGeo, buildingMat.clone());
                    block.position.set(
                        baseX + x,
                        baseY + y,
                        baseZ + z
                    );
                    block.castShadow = true;
                    block.receiveShadow = true;
                    block.userData.isBuilding = true;
                    block.userData.buildingType = 'substation';
                    this.scene.add(block);
                    objects.push(block);
                    blocks.push(block);
                }
            }
        }
        this.substation = blocks; // Store array of blocks
        
        // Metal pole on top corner (aligned to grid)
        const polePos = new THREE.Vector3(baseX, baseY + 2, baseZ);
        const poleMesh = new THREE.Mesh(this.geometries.pole, this.blockMaterials['metal-pole']);
        poleMesh.position.copy(polePos);
        poleMesh.castShadow = true;
        poleMesh.receiveShadow = true;
        poleMesh.userData.isPole = true;
        poleMesh.userData.poleType = 'metal-pole';
        poleMesh.userData.isChallengePole = true;
        poleMesh.userData.buildingType = 'substation';
        
        const hitboxGeo = new THREE.BoxGeometry(1, 1, 1);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.position.copy(polePos);
        hitbox.userData.isPoleHitbox = true;
        hitbox.userData.parentPole = poleMesh;
        
        this.scene.add(hitbox);
        this.scene.add(poleMesh);
        objects.push(hitbox);
        objects.push(poleMesh);
        
        this.substationPole = poleMesh;
        this.world.set(polePos.x, polePos.y, polePos.z);
    }

    createCustomer(objects) {
        // Blue customer - 2x2x2 blocks (matching voxel system)
        // Base corner at integer coordinates
        const baseX = 15;
        const baseY = 0;
        const baseZ = 15;
        
        // Create 2x2x2 cube building from individual voxel blocks
        const buildingMat = new THREE.MeshStandardMaterial({ 
            color: 0x0000AA,
            emissive: 0x0000FF,
            emissiveIntensity: 0.0 // Will glow when powered
        });
        
        // Create 8 blocks (2x2x2) aligned to voxel grid
        const blocks = [];
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
                    const block = new THREE.Mesh(blockGeo, buildingMat.clone());
                    block.position.set(
                        baseX + x,
                        baseY + y,
                        baseZ + z
                    );
                    block.castShadow = true;
                    block.receiveShadow = true;
                    block.userData.isBuilding = true;
                    block.userData.buildingType = 'customer';
                    this.scene.add(block);
                    objects.push(block);
                    blocks.push(block);
                }
            }
        }
        this.customer = blocks; // Store array of blocks
        
        // Metal pole on top corner (aligned to grid)
        const polePos = new THREE.Vector3(baseX, baseY + 2, baseZ);
        const poleMesh = new THREE.Mesh(this.geometries.pole, this.blockMaterials['metal-pole']);
        poleMesh.position.copy(polePos);
        poleMesh.castShadow = true;
        poleMesh.receiveShadow = true;
        poleMesh.userData.isPole = true;
        poleMesh.userData.poleType = 'metal-pole';
        poleMesh.userData.isChallengePole = true;
        poleMesh.userData.buildingType = 'customer';
        
        const hitboxGeo = new THREE.BoxGeometry(1, 1, 1);
        const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
        hitbox.position.copy(polePos);
        hitbox.userData.isPoleHitbox = true;
        hitbox.userData.parentPole = poleMesh;
        
        this.scene.add(hitbox);
        this.scene.add(poleMesh);
        objects.push(hitbox);
        objects.push(poleMesh);
        
        this.customerPole = poleMesh;
        this.world.set(polePos.x, polePos.y, polePos.z);
    }

    recordBlockPlace() {
        this.spent += this.costPerBlock;
        this.updateUI();
    }

    recordBlockRemove() {
        this.spent = Math.max(0, this.spent - this.costPerBlock);
        this.updateUI();
    }

    recordConductorPlace() {
        this.spent += this.costPerConductor;
        this.updateUI();
    }

    recordConductorRemove() {
        this.spent = Math.max(0, this.spent - this.costPerConductor);
        this.updateUI();
    }

    checkPowered(conductors, world) {
        // Check if any conductor connects substation to customer
        this.isPowered = false;
        
        // Find conductors touching substation pole OR poles on battery blocks
        const powerSourceConductors = conductors.filter(c => {
            // Check if connected to substation pole
            const touchesSubstation = 
                (Math.abs(c.fromPos.x - this.substationPole.position.x) < 0.1 &&
                 Math.abs(c.fromPos.y - this.substationPole.position.y) < 0.1 &&
                 Math.abs(c.fromPos.z - this.substationPole.position.z) < 0.1) ||
                (Math.abs(c.toPos.x - this.substationPole.position.x) < 0.1 &&
                 Math.abs(c.toPos.y - this.substationPole.position.y) < 0.1 &&
                 Math.abs(c.toPos.z - this.substationPole.position.z) < 0.1);
            
            if (touchesSubstation) return true;
            
            // Check if pole is on a battery block
            const fromBelowY = Math.round(c.fromPos.y) - 1;
            const toBelowY = Math.round(c.toPos.y) - 1;
            
            const fromOnBattery = world && world.get(
                Math.round(c.fromPos.x),
                fromBelowY,
                Math.round(c.fromPos.z)
            ) === 'battery';
            
            const toOnBattery = world && world.get(
                Math.round(c.toPos.x),
                toBelowY,
                Math.round(c.toPos.z)
            ) === 'battery';
            
            return fromOnBattery || toOnBattery;
        });
        
        // Reset all conductor glows first
        for (let c of conductors) {
            c.material.emissive.setHex(0x000000);
            c.material.emissiveIntensity = 0;
        }
        
        // Make conductors attached to power source glow
        for (let c of powerSourceConductors) {
            c.material.emissive.setHex(0xFFFF00); // Yellow glow
            c.material.emissiveIntensity = 0.5;
        }
        
        // Track powered conductors
        const poweredConductors = new Set();
        
        // Check if any of those form a path to customer pole
        for (let conductor of powerSourceConductors) {
            const pathConductors = [];
            if (this.isConnectedToCustomer(conductor, conductors, new Set(), pathConductors)) {
                this.isPowered = true;
                // Mark all conductors in the path as powered
                for (let c of pathConductors) {
                    poweredConductors.add(c);
                }
            }
        }
        
        // Make powered conductors glow
        for (let c of poweredConductors) {
            c.material.emissive.setHex(0xFFFF00); // Yellow glow
            c.material.emissiveIntensity = 0.5;
        }
        
        // Update customer glow
        if (this.customer) {
            for (let block of this.customer) {
                block.material.emissiveIntensity = this.isPowered ? 0.5 : 0.0;
            }
        }
    }

    isConnectedToCustomer(conductor, allConductors, visited, pathConductors = []) {
        pathConductors.push(conductor);
        
        const otherEnd = Math.abs(conductor.fromPos.x - this.substationPole.position.x) < 0.1 
            ? conductor.toPos 
            : conductor.fromPos;
        
        // Check if this is the customer pole
        if (Math.abs(otherEnd.x - this.customerPole.position.x) < 0.1 &&
            Math.abs(otherEnd.y - this.customerPole.position.y) < 0.1 &&
            Math.abs(otherEnd.z - this.customerPole.position.z) < 0.1) {
            return true;
        }
        
        // Mark as visited
        const key = `${otherEnd.x},${otherEnd.y},${otherEnd.z}`;
        if (visited.has(key)) {
            pathConductors.pop();
            return false;
        }
        visited.add(key);
        
        // Check for other conductors from this end
        for (let other of allConductors) {
            if (other === conductor) continue;
            
            if ((Math.abs(other.fromPos.x - otherEnd.x) < 0.1 &&
                 Math.abs(other.fromPos.y - otherEnd.y) < 0.1 &&
                 Math.abs(other.fromPos.z - otherEnd.z) < 0.1) ||
                (Math.abs(other.toPos.x - otherEnd.x) < 0.1 &&
                 Math.abs(other.toPos.y - otherEnd.y) < 0.1 &&
                 Math.abs(other.toPos.z - otherEnd.z) < 0.1)) {
                if (this.isConnectedToCustomer(other, allConductors, visited, pathConductors)) {
                    return true;
                }
            }
        }
        
        pathConductors.pop();
        return false;
    }

    updateUI() {
        const remaining = this.budget - this.spent;
        const element = document.getElementById('challenge-mode-ui');
        if (element) {
            element.innerHTML = `
                <div style="color: ${remaining < 0 ? '#FF0000' : '#00FF00'}; font-weight: bold;">
                    Budget: $${remaining.toLocaleString()}
                </div>
                ${this.isPowered ? '<div style="color: #00FF00; font-weight: bold;">✓ POWERED!</div>' : ''}
            `;
        }
    }

    isUnderBudget() {
        return (this.budget - this.spent) >= 0;
    }

    canPlace() {
        return this.isUnderBudget();
    }

    end() {
        this.isActive = false;
        const element = document.getElementById('challenge-mode-ui');
        if (element) {
            element.style.display = 'none';
        }
    }
}
