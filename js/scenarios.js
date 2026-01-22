// Scenario definitions and management for SpanCraft challenge mode
import * as THREE from 'three';

export const SCENARIOS = {
    basic: {
        id: 'basic',
        name: 'Basic Connection',
        description: 'Connect the substation to the customer. Learn the fundamentals of power line construction.',
        difficulty: 1,
        category: 'Tutorial',
        budget: 10000,
        objectives: [
            'Connect substation to customer',
            'Establish power flow',
            'Stay within budget'
        ],
        setup: {
            type: 'basic',
            createPrebuiltGrid: false
        }
    },
    
    lightningStrike: {
        id: 'lightningStrike',
        name: 'Lightning Strike Pole Replacement',
        description: 'A lightning strike has damaged a critical pole. Isolate, replace, and restore power quickly to minimize outage duration.',
        difficulty: 2,
        category: 'Repair',
        budget: 5000,
        timeLimit: 300, // 5 minutes
        objectives: [
            'Identify the damaged pole',
            'Remove and replace damaged components',
            'Restore power to all customers',
            'Minimize outage duration'
        ],
        setup: {
            type: 'lightningStrike',
            createPrebuiltGrid: true
        },
        scoring: {
            stars: {
                // Star thresholds based on completion time (seconds)
                time: [120, 180, 240], // 3 stars if under 2min, 2 stars under 3min, 1 star under 4min
                budget: [0.8, 0.9, 1.0] // Budget usage ratios
            }
        }
    }
};

export class ScenarioManager {
    constructor(challengeMode) {
        this.challengeMode = challengeMode;
        this.currentScenario = null;
        this.startTime = null;
        this.endTime = null;
        this.outageStartTime = null;
        this.totalOutageDuration = 0;
    }

    loadScenario(scenarioId) {
        const scenario = SCENARIOS[scenarioId];
        if (!scenario) {
            console.error(`Scenario ${scenarioId} not found`);
            return null;
        }
        
        this.currentScenario = scenario;
        return scenario;
    }

    startScenario() {
        if (!this.currentScenario) return;
        
        this.startTime = Date.now();
        
        // Track outage from the start for repair scenarios
        if (this.currentScenario.id === 'lightningStrike') {
            this.outageStartTime = Date.now();
        }
    }

    recordPowerRestored() {
        if (this.outageStartTime) {
            this.totalOutageDuration += (Date.now() - this.outageStartTime) / 1000;
            this.outageStartTime = null;
        }
    }

    recordPowerLost() {
        if (!this.outageStartTime) {
            this.outageStartTime = Date.now();
        }
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        return (Date.now() - this.startTime) / 1000;
    }

    getRemainingTime() {
        if (!this.currentScenario || !this.currentScenario.timeLimit) return null;
        const elapsed = this.getElapsedTime();
        return Math.max(0, this.currentScenario.timeLimit - elapsed);
    }

    isTimeExpired() {
        const remaining = this.getRemainingTime();
        return remaining !== null && remaining <= 0;
    }

    calculateScenarioStars() {
        if (!this.currentScenario) return 0;
        
        const scenario = this.currentScenario;
        const elapsedTime = this.getElapsedTime();
        const budgetUsage = this.challengeMode.spent / this.challengeMode.budget;
        
        // For lightning strike, use time-based and budget-based scoring
        if (scenario.id === 'lightningStrike' && scenario.scoring) {
            const timeThresholds = scenario.scoring.stars.time;
            const budgetThresholds = scenario.scoring.stars.budget;
            
            let timeStars = 1;
            if (elapsedTime <= timeThresholds[0]) timeStars = 3;
            else if (elapsedTime <= timeThresholds[1]) timeStars = 2;
            
            let budgetStars = 1;
            if (budgetUsage <= budgetThresholds[0]) budgetStars = 3;
            else if (budgetUsage <= budgetThresholds[1]) budgetStars = 2;
            
            // Return average, rounded down
            return Math.floor((timeStars + budgetStars) / 2);
        }
        
        // Default budget-based scoring (for basic scenario)
        return this.challengeMode.calculateStars();
    }

    getScenarioCompletionData() {
        return {
            scenarioName: this.currentScenario?.name || 'Unknown',
            elapsedTime: this.getElapsedTime(),
            totalOutageDuration: this.totalOutageDuration,
            budget: this.challengeMode.budget,
            spent: this.challengeMode.spent,
            stars: this.calculateScenarioStars()
        };
    }
}

// Generate pre-built grid for lightning strike scenario
export function generateLightningStrikeGrid(world, scene, blockMaterials, geometries, objects) {
    const grid = {
        poles: [],
        conductors: [],
        substationPole: null,
        customerPole: null,
        damagedPoleIndex: null
    };
    
    // Create a simple grid: substation -> 3 poles -> customer
    // Place them in a line across the world
    const spacing = 12;
    const startX = -spacing * 2;
    const startZ = 0;
    
    // Find terrain height and place poles
    const polePositions = [];
    for (let i = 0; i < 5; i++) {
        const x = startX + (i * spacing);
        const z = startZ;
        const terrainHeight = world.getHeight(x, z);
        const y = terrainHeight + 4; // 4 blocks tall
        
        polePositions.push({ x, y, z });
    }
    
    // Create poles
    polePositions.forEach((pos, index) => {
        const isSubstation = index === 0;
        const isCustomer = index === polePositions.length - 1;
        const isDamaged = index === 2; // Middle pole is damaged
        
        // Create 4-block tall pole
        for (let i = 0; i < 4; i++) {
            const poleMesh = new THREE.Mesh(
                geometries.pole, 
                blockMaterials['metal-pole']
            );
            poleMesh.position.set(pos.x, pos.y - 4 + i, pos.z);
            poleMesh.castShadow = true;
            poleMesh.receiveShadow = true;
            poleMesh.userData.isPole = true;
            poleMesh.userData.poleType = 'metal-pole';
            poleMesh.userData.isPrebuilt = true;
            
            if (isDamaged && i === 3) {
                // Mark top block of damaged pole
                poleMesh.userData.isDamaged = true;
                // Make it visually damaged (darker, emissive red)
                poleMesh.material = blockMaterials['metal-pole'].clone();
                poleMesh.material.emissive = new THREE.Color(0xff0000);
                poleMesh.material.emissiveIntensity = 0.5;
            }
            
            if (isSubstation) {
                poleMesh.userData.isChallengePole = true;
                poleMesh.userData.buildingType = 'substation';
            } else if (isCustomer) {
                poleMesh.userData.isChallengePole = true;
                poleMesh.userData.buildingType = 'customer';
            }
            
            const hitboxGeo = new THREE.BoxGeometry(1, 1, 1);
            const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
            const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
            hitbox.position.copy(poleMesh.position);
            hitbox.userData.isPoleHitbox = true;
            hitbox.userData.parentPole = poleMesh;
            
            scene.add(hitbox);
            scene.add(poleMesh);
            objects.push(hitbox);
            objects.push(poleMesh);
            
            world.set(poleMesh.position.x, poleMesh.position.y, poleMesh.position.z);
            
            // Store top block reference
            if (i === 3) {
                grid.poles.push(poleMesh);
                
                if (isSubstation) grid.substationPole = poleMesh;
                if (isCustomer) grid.customerPole = poleMesh;
                if (isDamaged) grid.damagedPoleIndex = grid.poles.length - 1;
            }
        }
    });
    
    // Create conductors connecting poles (except skip the damaged connection)
    // Connect: substation -> pole1 -> [DAMAGED] -> pole3 -> customer
    for (let i = 0; i < grid.poles.length - 1; i++) {
        // Skip connection to/from damaged pole
        if (i === 1 || i === 2) continue;
        
        grid.conductors.push({
            from: grid.poles[i],
            to: grid.poles[i + 1]
        });
    }
    
    return grid;
}

export function createScenarioPickerUI(onScenarioSelected) {
    // Remove existing picker if any
    const existing = document.getElementById('scenario-picker-ui');
    if (existing) existing.remove();
    
    const picker = document.createElement('div');
    picker.id = 'scenario-picker-ui';
    picker.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        font-family: monospace;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        text-align: center;
        color: #00FF00;
        max-width: 800px;
        padding: 40px;
    `;
    
    content.innerHTML = `
        <div style="font-size: 36px; font-weight: bold; margin-bottom: 40px;">
            SELECT CHALLENGE SCENARIO
        </div>
    `;
    
    // Create scenario cards
    const scenariosContainer = document.createElement('div');
    scenariosContainer.style.cssText = `
        display: flex;
        gap: 20px;
        justify-content: center;
        flex-wrap: wrap;
    `;
    
    Object.values(SCENARIOS).forEach(scenario => {
        const card = document.createElement('div');
        card.style.cssText = `
            background-color: rgba(0, 50, 0, 0.5);
            border: 2px solid #00AA00;
            border-radius: 8px;
            padding: 20px;
            width: 300px;
            cursor: pointer;
            transition: all 0.3s;
        `;
        
        card.addEventListener('mouseenter', () => {
            card.style.backgroundColor = 'rgba(0, 80, 0, 0.7)';
            card.style.borderColor = '#00FF00';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.backgroundColor = 'rgba(0, 50, 0, 0.5)';
            card.style.borderColor = '#00AA00';
        });
        
        card.addEventListener('click', () => {
            picker.remove();
            onScenarioSelected(scenario.id);
        });
        
        const difficultyStars = '⭐'.repeat(scenario.difficulty);
        
        card.innerHTML = `
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">
                ${scenario.name}
            </div>
            <div style="font-size: 12px; color: #AAAAAA; margin-bottom: 10px;">
                ${scenario.category} | ${difficultyStars}
            </div>
            <div style="font-size: 14px; margin-bottom: 15px; line-height: 1.4;">
                ${scenario.description}
            </div>
            <div style="font-size: 12px; color: #00AAAA; text-align: left;">
                <div>Budget: $${scenario.budget.toLocaleString()}</div>
                ${scenario.timeLimit ? `<div>Time Limit: ${scenario.timeLimit}s</div>` : ''}
            </div>
        `;
        
        scenariosContainer.appendChild(card);
    });
    
    content.appendChild(scenariosContainer);
    picker.appendChild(content);
    document.body.appendChild(picker);
}
