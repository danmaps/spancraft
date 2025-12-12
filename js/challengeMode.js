import * as THREE from 'three';
import { checkConductorCollision } from './conductor.js';

export class ChallengeMode {
    constructor(scene, world, blockMaterials, geometries, controls = null) {
        this.scene = scene;
        this.world = world;
        this.blockMaterials = blockMaterials;
        this.geometries = geometries;
        this.controls = controls;
        
        this.isActive = false;
        this.budget = 10000; // Starting budget in "credits"
        this.spent = 0;
        this.baseCostPerBlock = 100;
        this.baseCostPerConductor = 50;
        
        this.substation = null;
        this.customer = null;
        this.substationPole = null;
        this.customerPole = null;
        
        this.isPowered = false;
        this.completed = false;
        this.stars = 0;
        
        // Pricing configuration
        this.terrainCostMultiplier = 1.0;
        this.optimalSpanDistance = 15; // Optimal span distance for pricing
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
        const baseZ = -16;
        // Find max height across 2x2 footprint to ensure building sits on terrain
        const baseY = Math.max(
            this.world.getHeight(baseX, baseZ),
            this.world.getHeight(baseX + 1, baseZ),
            this.world.getHeight(baseX, baseZ + 1),
            this.world.getHeight(baseX + 1, baseZ + 1)
        );
        
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
                    block.userData.blockType = 'substation';
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
        const baseZ = 15;
        // Find max height across 2x2 footprint to ensure building sits on terrain
        const baseY = Math.max(
            this.world.getHeight(baseX, baseZ),
            this.world.getHeight(baseX + 1, baseZ),
            this.world.getHeight(baseX, baseZ + 1),
            this.world.getHeight(baseX + 1, baseZ + 1)
        );
        
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
                    block.userData.blockType = 'customer';
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

    calculateBlockCost(position) {
        let baseCost = this.baseCostPerBlock;
        
        // Height penalty: exponential cost increase for taller poles
        const y = position.y;
        const heightPenalty = y > 2 ? Math.pow(1.15, Math.max(0, y - 2)) : 1.0;
        
        // Terrain difficulty: check slope
        const x = Math.round(position.x);
        const z = Math.round(position.z);
        const terrainHeightHere = this.world.getHeight(x, z);
        const terrainHeightAdjacent = (
            this.world.getHeight(x + 1, z) +
            this.world.getHeight(x - 1, z) +
            this.world.getHeight(x, z + 1) +
            this.world.getHeight(x, z - 1)
        ) / 4;
        
        const slopeAngle = Math.abs(terrainHeightHere - terrainHeightAdjacent);
        const slopePenalty = 1.0 + (slopeAngle * 0.2); // Steep slopes cost more
        
        return Math.round(baseCost * heightPenalty * slopePenalty);
    }

    calculateConductorCost(fromPos, toPos) {
        let baseCost = this.baseCostPerConductor;
        
        // Span distance cost curve: optimal spans are cheapest
        const spanDistance = fromPos.distanceTo(toPos);
        const distanceRatio = spanDistance / this.optimalSpanDistance;
        
        // Cost increases for spans too short or too long
        let distancePenalty = 1.0;
        if (distanceRatio < 0.8) {
            // Too short: inefficient pole placement
            distancePenalty = 1.0 + (0.8 - distanceRatio) * 0.3;
        } else if (distanceRatio > 1.2) {
            // Too long: expensive hardware needed
            distancePenalty = 1.0 + (distanceRatio - 1.2) * 0.5;
        }
        
        return Math.round(baseCost * distancePenalty);
    }

    recordBlockPlace(position) {
        const cost = this.calculateBlockCost(position);
        this.spent += cost;
        this.updateUI();
    }

    recordBlockRemove(position) {
        // Removing dirt blocks costs money (terrain modification)
        // Other blocks return cost
        const blockType = this.world.get(
            Math.round(position.x),
            Math.round(position.y),
            Math.round(position.z)
        );
        
        if (blockType === 'dirt' || blockType === true) {
            // Dirt removal costs money - add excavation cost
            this.spent += this.calculateBlockCost(position);
        } else {
            // Other blocks (poles, structures) return cost
            const cost = this.calculateBlockCost(position);
            this.spent = Math.max(0, this.spent - cost);
        }
        this.updateUI();
    }

    recordConductorPlace(fromPos, toPos) {
        const cost = this.calculateConductorCost(fromPos, toPos);
        this.spent += cost;
        this.updateUI();
    }

    recordConductorRemove(fromPos, toPos) {
        const cost = this.calculateConductorCost(fromPos, toPos);
        this.spent = Math.max(0, this.spent - cost);
        this.updateUI();
    }

    calculateStars() {
        const budgetUsagePercent = (this.spent / this.budget) * 100;
        
        if (budgetUsagePercent <= 100) {
            // Under budget: 3 stars
            return 3;
        } else if (budgetUsagePercent <= 150) {
            // Over budget but not too much (100-150%): 2 stars
            return 2;
        } else {
            // Significantly over budget (>150%): 1 star
            return 1;
        }
    }

    checkPowered(conductors, world) {
        // Check if any conductor connects substation to customer
        this.isPowered = false;
        
        // Reset powered state for all conductors
        conductors.forEach(c => {
            c.isPowered = false;
        });
        
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
            c.isPowered = true;
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
        
        // Make powered conductors glow (pulsing effect applied in main animate loop)
        for (let c of poweredConductors) {
            c.material.emissive.setHex(0xFFFF00); // Yellow glow
            c.isPowered = true;
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
        const budgetUsagePercent = (this.spent / this.budget) * 100;
        const element = document.getElementById('challenge-mode-ui');
        if (element) {
            // Determine color based on budget
            let budgetColor = '#00FF00'; // Green
            if (remaining < 0) {
                budgetColor = '#FF0000'; // Red
            } else if (budgetUsagePercent > 75) {
                budgetColor = '#FFAA00'; // Orange
            }
            
            element.innerHTML = `
                <div style="display: flex; gap: 20px; align-items: center; justify-content: center;">
                    <div>
                        <div style="color: ${budgetColor}; font-weight: bold; font-size: 18px;">
                            Budget: $${remaining.toLocaleString()}
                        </div>
                        <div style="color: #AAAAAA; font-size: 12px;">
                            Spent: $${this.spent.toLocaleString()} / $${this.budget.toLocaleString()}
                        </div>
                        <div style="color: #AAAAAA; font-size: 12px;">
                            ${budgetUsagePercent.toFixed(1)}% used
                        </div>
                    </div>
                    ${this.isPowered ? '<div style="color: #00FF00; font-weight: bold; font-size: 18px;">✓ POWERED!</div>' : ''}
                </div>
            `;
        }
    }

    isUnderBudget() {
        return (this.budget - this.spent) >= 0;
    }

    canPlace() {
        return this.isUnderBudget();
    }

    hasCollidingConductors(conductors) {
        for (let conductor of conductors) {
            if (checkConductorCollision(conductor.fromPos, conductor.toPos, this.world)) {
                return true;
            }
        }
        return false;
    }

    finishChallenge() {
        this.completed = true;
        this.stars = this.calculateStars();
        
        // Release mouse control
        if (this.controls && this.controls.isLocked) {
            document.exitPointerLock();
        }
        
        this.showCompletionScreen();
    }

    showCompletionScreen() {
        const completionUI = document.getElementById('challenge-completion-ui');
        if (completionUI) {
            completionUI.remove();
        }
        
        const screen = document.createElement('div');
        screen.id = 'challenge-completion-ui';
        screen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            font-family: monospace;
        `;
        
        const budgetUsagePercent = (this.spent / this.budget) * 100;
        const budgetStatus = budgetUsagePercent <= 100 ? '✓ UNDER BUDGET' : '✗ OVER BUDGET';
        const starDisplay = '★'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
        
        const content = document.createElement('div');
        content.style.cssText = `
            text-align: center;
            color: #00FF00;
            font-size: 20px;
        `;
        
        content.innerHTML = `
            <div style="margin-bottom: 30px;">
                <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px;">CHALLENGE COMPLETE!</div>
                <div style="font-size: 32px; margin: 20px 0; letter-spacing: 10px;">${starDisplay}</div>
            </div>
            <div style="font-size: 18px; margin-bottom: 20px;">
                <div style="margin: 10px 0;">Budget: $${this.budget.toLocaleString()}</div>
                <div style="margin: 10px 0;">Spent: $${this.spent.toLocaleString()}</div>
                <div style="margin: 10px 0; ${budgetUsagePercent <= 100 ? 'color: #00FF00;' : 'color: #FFAA00;'}">${budgetStatus}</div>
                <div style="margin: 10px 0;">Usage: ${budgetUsagePercent.toFixed(1)}%</div>
            </div>
            <div style="margin-top: 40px;">
                <button id="challenge-again-btn" style="
                    padding: 12px 30px;
                    font-size: 16px;
                    background-color: #00AA00;
                    color: white;
                    border: 2px solid #00FF00;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                    font-family: monospace;
                    font-weight: bold;
                ">TRY AGAIN</button>
                <button id="challenge-exit-btn" style="
                    padding: 12px 30px;
                    font-size: 16px;
                    background-color: #AA0000;
                    color: white;
                    border: 2px solid #FF0000;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                    font-family: monospace;
                    font-weight: bold;
                ">EXIT</button>
            </div>
        `;
        
        screen.appendChild(content);
        document.body.appendChild(screen);
        
        document.getElementById('challenge-again-btn').addEventListener('click', () => {
            screen.remove();
            // Reset and restart challenge (will be handled by main.js)
            window.dispatchEvent(new CustomEvent('challenge-restart'));
        });
        
        document.getElementById('challenge-exit-btn').addEventListener('click', () => {
            screen.remove();
            window.dispatchEvent(new CustomEvent('challenge-exit'));
        });
    }

    end() {
        this.isActive = false;
        const element = document.getElementById('challenge-mode-ui');
        if (element) {
            element.style.display = 'none';
        }
    }

    reconstructFromImport(objects) {
        // After importing a scene, reconstruct challenge mode references
        // Find substation pole (challenge pole with buildingType 'substation')
        this.substationPole = objects.find(obj => 
            obj.userData && 
            obj.userData.isPole && 
            obj.userData.isChallengePole && 
            obj.userData.buildingType === 'substation'
        );
        
        // Find customer pole (challenge pole with buildingType 'customer')
        this.customerPole = objects.find(obj => 
            obj.userData && 
            obj.userData.isPole && 
            obj.userData.isChallengePole && 
            obj.userData.buildingType === 'customer'
        );
        
        // Find substation building blocks
        this.substation = objects.filter(obj =>
            obj.userData &&
            obj.userData.blockType === 'substation'
        );
        
        // Find customer building blocks
        this.customer = objects.filter(obj =>
            obj.userData &&
            obj.userData.blockType === 'customer'
        );
        
        // Return true if challenge mode structures were found
        return this.substationPole && this.customerPole && 
               this.substation.length > 0 && this.customer.length > 0;
    }
}
