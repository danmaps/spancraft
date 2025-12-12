import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { createScene, createCamera, createRenderer, setupLighting, onWindowResize } from './scene.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { loadTextures, createBlockMaterials, getBlockGeometry, BLOCK_TYPES, isPoleType } from './blocks.js';
import { World, createHighlightMesh } from './world.js';
import { calculateCatenaryCurve, createConductor, checkConductorCollision, updateConductorVisuals, updateSparkEffect } from './conductor.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { exportSceneToMsgpack, importSceneFromMsgpack } from './storage.js';
import { Minimap } from './minimap.js';
import { ChallengeMode } from './challengeMode.js';
import { ActionHistory } from './actionHistory.js';
import { Settings, initSettingsUI } from './settings.js';

let scene, camera, renderer, composer, bloomPass, controls, world, player, ui, blockMaterials, geometries, minimap, challengeMode;
let actionHistory, settings;
let conductorFromPole = null;
let conductorFromObject = null;
let conductors = [];
let objects = [];
let highlightMesh;

async function init() {
    // Load settings
    settings = new Settings();
    const config = settings.getAll();

    // Scene setup
    scene = createScene();
    camera = createCamera();
    renderer = createRenderer();
    // Tone mapping to keep brights clean (neon lines) without blowing out the scene
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;

    // Post-processing setup with bloom for bright/sparky effects (neon-line style)
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.25, 0.85);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

    onWindowResize(camera, renderer, composer);

    // Apply fog settings
    scene.fog = new THREE.Fog(0x87CEEB, 10, config.renderDistance);

    // Lighting
    setupLighting(scene);

    // Load textures and create materials
    const textures = await loadTextures();
    blockMaterials = createBlockMaterials(textures);
    geometries = getBlockGeometry();

    // World generation with settings
    world = new World(config.worldSizeX, config.worldSizeZ, config.terrainThickness, config.randomTerrain);
    let hasImportedScene = false;
    
    // Only generate terrain if not importing
    if (!hasImportedScene) {
        const terrainMesh = world.generateTerrain(blockMaterials.dirt);
        terrainMesh.userData.isInstancedMesh = true;
        scene.add(terrainMesh);
        objects.push(terrainMesh);
    }

    // Calculate safe spawn position above terrain at world center
    const spawnX = 0;
    const spawnZ = 0;
    const terrainHeight = world.getHeight(spawnX, spawnZ);
    const safeSpawnY = terrainHeight + 3; // Spawn 3 blocks above terrain surface

    // Generate random tall poles only if not importing
    if (!hasImportedScene) {
        const randomPoles = world.generateRandomPoles(5, 5);
        randomPoles.forEach(pole => {
            for (let i = 0; i < pole.height; i++) {
                const poleBlock = new THREE.Mesh(geometries.pole, blockMaterials['metal-pole']);
                poleBlock.position.set(pole.x, pole.y + i, pole.z);
                poleBlock.castShadow = true;
                poleBlock.receiveShadow = true;
                poleBlock.userData.isPole = true;
                poleBlock.userData.poleType = 'metal-pole';

                const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
                const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
                const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
                hitbox.position.set(pole.x, pole.y + i, pole.z);
                hitbox.userData.isPoleHitbox = true;
                hitbox.userData.parentPole = poleBlock;

                scene.add(hitbox);
                objects.push(hitbox);
                poleBlock.userData.hitbox = hitbox;
                scene.add(poleBlock);
                objects.push(poleBlock);
            }
        });
    }

    // Initialize Action History
    actionHistory = new ActionHistory();

    // Player and controls
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
    
    // Set player spawn position above terrain
    controls.getObject().position.set(spawnX, safeSpawnY, spawnZ);
    
    player = new Player(controls, config.movementSpeed);
    player.setupControls();

    // UI
    ui = new UI(blockMaterials, geometries);
    ui.onBlockSelected = (blockType) => {
        if (blockType !== BLOCK_TYPES.CONDUCTOR) {
            conductorFromPole = null;
            conductorFromObject = null;
            document.getElementById('wire-mode-indicator').textContent = '';
        }
    };

    highlightMesh = ui.getHighlightMesh();
    scene.add(highlightMesh);

    // Setup export/import
    ui.setupExportImport(
        () => exportSceneToMsgpack(scene, world, objects, conductors),
        (arrayBuffer) => {
            const imported = importSceneFromMsgpack(arrayBuffer, scene, world, objects, conductors, blockMaterials, geometries, createConductor);
            if (imported) {
                hasImportedScene = true;
                // Teleport player to safe spawn position above world center
                controls.getObject().position.set(0, 50, 0);
                player.velocity.set(0, 0, 0);
                
                // Try to reconstruct challenge mode from imported scene
                const hasChallengeModeStructures = challengeMode.reconstructFromImport(objects);
                if (hasChallengeModeStructures && !challengeMode.isActive) {
                    // Activate challenge mode if structures are present
                    challengeMode.isActive = true;
                    const challengeUI = document.getElementById('challenge-mode-ui');
                    if (challengeUI) {
                        challengeUI.style.display = 'block';
                    }
                    challengeMode.updateUI();
                }
                
                // Check for powered conductors after import
                if (challengeMode.isActive) {
                    challengeMode.checkPowered(conductors, world);
                }
            }
        }
    );

    // Initialize minimap
    minimap = new Minimap(world, world.worldSizeX, world.worldSizeZ);

    // Initialize Challenge Mode
    challengeMode = new ChallengeMode(scene, world, blockMaterials, geometries, controls);
    
    // Setup Challenge Mode button
    const challengeBtn = document.getElementById('challenge-btn');
    if (challengeBtn) {
        challengeBtn.addEventListener('click', () => {
            // Release pointer lock if active
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            if (!challengeMode.isActive) {
                startChallengeMode();
            }
        });
    }
    
    // Setup challenge completion handlers
    window.addEventListener('challenge-restart', () => {
        challengeMode.completed = false;
        challengeMode.stars = 0;
        startChallengeMode();
    });
    
    window.addEventListener('challenge-exit', () => {
        challengeMode.end();
        const challengeUI = document.getElementById('challenge-mode-ui');
        if (challengeUI) {
            challengeUI.style.display = 'none';
        }
    });

    // Setup minimap toggle
    const minimapToggle = document.getElementById('minimap-toggle');
    const minimapDiv = document.getElementById('minimap');
    if (minimapToggle) {
        minimapToggle.addEventListener('click', () => {
            // Release pointer lock if active
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
            minimapDiv.classList.toggle('visible');
        });
    }

    // Setup undo/redo keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Only handle undo/redo if not typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            event.preventDefault();
            const action = actionHistory.undo();
            if (action) {
                executeUndo(action);
            }
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
            event.preventDefault();
            const action = actionHistory.redo();
            if (action) {
                executeRedo(action);
            }
        }
    });

    // Interaction
    setupInteraction();

    // Initialize Settings UI
    initSettingsUI(settings, (newSettings) => {
        // Apply settings that don't require reload
        player.moveSpeed = newSettings.movementSpeed;
        scene.fog.far = newSettings.renderDistance;
        
        console.log('Settings applied:', newSettings);
    });

    // Start animation loop
    animate();

function recheckAllConductorCollisions() {
    // Check all conductors for collisions and update their state
    conductors.forEach(conductor => {
        const hasCollision = checkConductorCollision(conductor.fromPos, conductor.toPos, world);
        conductor.hasCollision = hasCollision;
        
        if (hasCollision) {
            conductor.material.color.setHex(0xff0000);
            conductor.material.emissive.setHex(0xff0000);
            conductor.material.emissiveIntensity = 0.5;
            conductor.spark.visible = false;
            conductor.sparkLight.visible = false;
        } else {
            conductor.material.color.setHex(0x1a1a1a);
            conductor.material.emissive.setHex(0x000000);
            conductor.material.emissiveIntensity = 0;
        }
    });
}
}

function recheckAllConductorCollisions() {
    // Check all conductors for collisions and update their state
    conductors.forEach(conductor => {
        const hasCollision = checkConductorCollision(conductor.fromPos, conductor.toPos, world);
        conductor.hasCollision = hasCollision;
        
        if (hasCollision) {
            conductor.material.color.setHex(0xff0000);
            conductor.material.emissive.setHex(0xff0000);
            conductor.material.emissiveIntensity = 0.5;
            conductor.spark.visible = false;
            conductor.sparkLight.visible = false;
        } else {
            conductor.material.color.setHex(0x1a1a1a);
            conductor.material.emissive.setHex(0x000000);
            conductor.material.emissiveIntensity = 0;
        }
    });
}

function startChallengeMode() {
    // Clear existing terrain and structures
    objects.forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
        scene.remove(obj);
    });
    objects.length = 0;
    conductors.length = 0;
    world.clear();
    
    // Generate new terrain
    const terrainMesh = world.generateTerrain(blockMaterials.dirt);
    terrainMesh.userData.isInstancedMesh = true;
    scene.add(terrainMesh);
    objects.push(terrainMesh);
    
    // Start challenge
    challengeMode.start(objects);
    
    // Show challenge UI
    const challengeUI = document.getElementById('challenge-mode-ui');
    if (!challengeUI) {
        const ui = document.createElement('div');
        ui.id = 'challenge-mode-ui';
        ui.style.cssText = `
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: #00FF00;
            padding: 15px 25px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 16px;
            font-weight: bold;
            z-index: 100;
            text-align: center;
        `;
        document.body.appendChild(ui);
    } else {
        challengeUI.style.display = 'block';
    }
    
    challengeMode.updateUI();
}

function setupInteraction() {
    document.addEventListener('mousedown', (event) => {
        if (!controls.isLocked) return;

        if (highlightMesh.visible) {
            if (event.button === 0) { // Left click: Remove
                const intersects = ui.raycaster.intersectObjects(objects);
                if (intersects.length > 0) {
                    const intersect = intersects[0];
                    const instanceId = intersect.instanceId;

                    // Check if clicking on a conductor line
                    if (intersect.object.userData.isConductor) {
                        const conductorData = intersect.object.userData.conductorData;
                        const condIndex = conductors.indexOf(conductorData);
                        if (condIndex > -1) {
                            // Record action in history
                            actionHistory.recordAction({
                                type: 'conductor-remove',
                                fromPos: conductorData.fromPos.clone(),
                                toPos: conductorData.toPos.clone()
                            });
                            
                            // Record cost refund in challenge mode
                            if (challengeMode.isActive) {
                                challengeMode.recordConductorRemove(conductorData.fromPos, conductorData.toPos);
                            }
                            conductors.splice(condIndex, 1);
                            
                            // Remove spark
                            if (conductorData.spark) {
                                scene.remove(conductorData.spark);
                            }
                        }
                        scene.remove(intersect.object);
                        objects.splice(objects.indexOf(intersect.object), 1);
                        return;
                    }

                    let blockPos;
                    let removedBlockType;
                    if (instanceId !== undefined) {
                        const matrix = new THREE.Matrix4();
                        intersect.object.getMatrixAt(instanceId, matrix);
                        blockPos = new THREE.Vector3().setFromMatrixPosition(matrix);
                        removedBlockType = intersect.object.userData.blockType;

                        matrix.scale(new THREE.Vector3(0, 0, 0));
                        intersect.object.setMatrixAt(instanceId, matrix);
                        intersect.object.instanceMatrix.needsUpdate = true;
                    } else {
                        blockPos = intersect.object.position.clone();
                        removedBlockType = intersect.object.userData.blockType;

                        if (intersect.object.userData.isPoleHitbox) {
                            const pole = intersect.object.userData.parentPole;
                            scene.remove(pole);
                            objects.splice(objects.indexOf(pole), 1);
                        } else if (intersect.object.userData.isPole && intersect.object.userData.hitbox) {
                            const hitbox = intersect.object.userData.hitbox;
                            scene.remove(hitbox);
                            objects.splice(objects.indexOf(hitbox), 1);
                        }

                        scene.remove(intersect.object);
                        objects.splice(objects.indexOf(intersect.object), 1);
                    }

                    // Record action in history
                    actionHistory.recordAction({
                        type: 'block-remove',
                        blockType: removedBlockType,
                        position: blockPos.clone()
                    });

                    // Record cost refund in challenge mode
                    if (challengeMode.isActive) {
                        challengeMode.recordBlockRemove(blockPos);
                    }
                    
                    world.delete(Math.round(blockPos.x), Math.round(blockPos.y), Math.round(blockPos.z));
                                        recheckAllConductorCollisions();
                    
                    // Recheck all conductor collisions
                    recheckAllConductorCollisions();
                }
            } else if (event.button === 2) { // Right click: Place or Select Pole
                const intersects = ui.raycaster.intersectObjects(objects);
                if (intersects.length > 0) {
                    const intersect = intersects[0];

                    // Conductor mode
                    if (ui.selectedBlockType === BLOCK_TYPES.CONDUCTOR) {
                        let clickedPole = null;
                        let clickedObject = null;
                        if (intersect.object.userData.isPoleHitbox) {
                            clickedPole = intersect.object.userData.parentPole;
                            clickedObject = intersect.object; // Use hitbox for position
                        } else if (intersect.object.userData.isPole) {
                            clickedPole = intersect.object;
                            clickedObject = intersect.object.userData.hitbox || intersect.object;
                        }

                        if (clickedPole) {
                            const wireIndicator = document.getElementById('wire-mode-indicator');
                            if (!conductorFromPole) {
                                conductorFromPole = clickedPole;
                                conductorFromObject = clickedObject;
                                wireIndicator.textContent = 'Select TO pole';
                            } else {
                                // Debug: Log all relevant positions
                                // console.log('--- Conductor Creation Debug ---');
                                // console.log('FROM - clickedObject (hitbox) position:', conductorFromObject.position.clone());
                                // console.log('FROM - parentPole position:', conductorFromPole.position.clone());
                                // console.log('TO - clickedObject (hitbox) position:', clickedObject.position.clone());
                                // console.log('TO - parentPole position:', clickedPole.position.clone());
                                
                                // Get attachment points - exact center of clicked block
                                const fromPos = conductorFromObject.position.clone();
                                const toPos = clickedObject.position.clone();
                                
                                // console.log('Final fromPos:', fromPos);
                                // console.log('Final toPos:', toPos);

                                if (fromPos.x === toPos.x && fromPos.z === toPos.z) {
                                    wireIndicator.textContent = 'Cannot connect same pole! Select FROM pole';
                                    conductorFromPole = null;
                                    conductorFromObject = null;
                                    return;
                                }

                                const { tube, conductorData, spark } = createConductor(conductorFromPole, clickedPole, fromPos, toPos);
                                
                                // Check for collisions and mark accordingly
                                const hasCollision = checkConductorCollision(fromPos, toPos, world);
                                conductorData.hasCollision = hasCollision;
                                
                                if (hasCollision) {
                                    // Show temporary warning but allow placement
                                    wireIndicator.textContent = '⚠️ Wire collision - adjust terrain to fix clearance!';
                                    wireIndicator.style.color = '#ff8800';
                                    setTimeout(() => {
                                        wireIndicator.textContent = '';
                                        wireIndicator.style.color = '#ffff00';
                                    }, 3000);
                                }
                                
                                scene.add(tube);
                                scene.add(spark);
                                objects.push(tube);
                                conductors.push(conductorData);
                                recheckAllConductorCollisions();

                                // Record action in history
                                actionHistory.recordAction({
                                    type: 'conductor-place',
                                    fromPos: fromPos.clone(),
                                    toPos: toPos.clone()
                                });

                                // Record cost in challenge mode
                                if (challengeMode.isActive) {
                                    challengeMode.recordConductorPlace(fromPos, toPos);
                                }

                                conductorFromPole = null;
                                conductorFromObject = null;
                                wireIndicator.textContent = 'Select FROM pole';
                            }
                        }
                        return;
                    }
                    // Check budget in challenge mode
                    if (challengeMode.isActive && !challengeMode.canPlace()) {
                        return; // Can't place - over budget
                    }

                    // Place block
                    const voxelPos = intersect.point.clone().add(intersect.face.normal.clone().multiplyScalar(0.5));
                    voxelPos.x = Math.round(voxelPos.x);
                    voxelPos.y = Math.round(voxelPos.y);
                    voxelPos.z = Math.round(voxelPos.z);

                    const playerPos = controls.getObject().position;
                    const dx = Math.abs(playerPos.x - voxelPos.x);
                    const dz = Math.abs(playerPos.z - voxelPos.z);
                    const dy = playerPos.y - voxelPos.y;

                    if (dx < player.playerWidth / 2 + 0.5 && dz < player.playerWidth / 2 + 0.5) {
                        if (dy > -1.0 && dy < 1.8) {
                            return;
                        }
                    }

                    const blockType = ui.selectedBlockType;
                    const useGeometry = isPoleType(blockType) ? geometries.pole : geometries.standard;

                    const voxel = new THREE.Mesh(useGeometry, blockMaterials[blockType]);
                    voxel.position.copy(voxelPos);
                    voxel.castShadow = true;
                    voxel.receiveShadow = true;
                    voxel.userData.blockType = blockType;

                    if (isPoleType(blockType)) {
                        voxel.userData.isPole = true;
                        voxel.userData.poleType = blockType;

                        const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
                        const hitboxMaterial = new THREE.MeshBasicMaterial({
                            visible: false,
                            transparent: true,
                            opacity: 0
                        });
                        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
                        hitbox.position.copy(voxelPos);
                        hitbox.userData.isPoleHitbox = true;
                        hitbox.userData.parentPole = voxel;
                        scene.add(hitbox);
                        objects.push(hitbox);
                        voxel.userData.hitbox = hitbox;
                        
                        // Record action in history
                        actionHistory.recordAction({
                            type: 'block-place',
                            blockType: blockType,
                            position: voxelPos.clone()
                        });
                        
                        // Record cost in challenge mode
                        if (challengeMode.isActive) {
                            challengeMode.recordBlockPlace(voxelPos);
                        }
                        
                        // console.log('--- Pole Block Created ---');
                        // console.log('voxelPos:', voxelPos.clone());
                        // console.log('pole mesh position:', voxel.position.clone());
                        // console.log('hitbox position:', hitbox.position.clone());
                    } else {
                        // Regular block - record action in history
                        actionHistory.recordAction({
                            type: 'block-place',
                            blockType: blockType,
                            position: voxelPos.clone()
                        });
                        
                        // Record cost in challenge mode
                        if (challengeMode.isActive) {
                            challengeMode.recordBlockPlace(voxelPos);
                        }
                    }

                    scene.add(voxel);
                    objects.push(voxel);
                    world.set(Math.round(voxelPos.x), Math.round(voxelPos.y), Math.round(voxelPos.z), blockType);
                                        recheckAllConductorCollisions();
                    
                    // Recheck all conductor collisions
                    recheckAllConductorCollisions();
                }
            }
        }
    });
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = Math.min((time - player.prevTime) / 1000, 0.1);

    player.update(delta, world, camera);

    // Update conductors
    conductors.forEach(conductor => {
        // Use stored attachment positions (already correct from creation)
        const fromPos = conductor.fromPos;
        const toPos = conductor.toPos;
        const hasCollision = checkConductorCollision(fromPos, toPos, world);

        if (hasCollision !== conductor.hasCollision) {
            conductor.hasCollision = hasCollision;
            updateConductorVisuals(conductor);
        }
    });

    // Calculate powered circuit (outside challenge mode or in challenge mode)
    if (challengeMode.isActive) {
        challengeMode.checkPowered(conductors, world);
        // Apply visual feedback to conductors in challenge mode
        conductors.forEach(conductor => {
            // Check for collisions first (red takes priority)
            const hasCollision = checkConductorCollision(conductor.fromPos, conductor.toPos, world);
            conductor.hasCollision = hasCollision;
            
            if (hasCollision) {
                conductor.material.color.setHex(0xff0000);
                conductor.material.emissive.setHex(0xff0000);
                conductor.material.emissiveIntensity = 0.5;
                conductor.spark.visible = false;
                conductor.sparkLight.visible = false;
            } else if (conductor.isPowered) {
                // Use spark effect for powered conductors
                updateSparkEffect(conductor, delta * 1000);
            } else {
                conductor.material.color.setHex(0x1a1a1a);
                conductor.material.emissive.setHex(0x000000);
                conductor.material.emissiveIntensity = 0;
                conductor.spark.visible = false;
                conductor.sparkLight.visible = false;
            }
        });
        
        // Check if challenge is complete (powered + no collisions)
        if (challengeMode.isPowered && !challengeMode.completed) {
            // Check for conductor collisions before completing
            if (!challengeMode.hasCollidingConductors(conductors)) {
                challengeMode.finishChallenge();
            }
        }
    } else {
        // Find all power sources (poles on battery blocks)
        const powerSources = new Set();
        conductors.forEach(conductor => {
            const fromBelowY = Math.round(conductor.fromPos.y) - 1;
            const toBelowY = Math.round(conductor.toPos.y) - 1;
            
            const fromOnBattery = world.get(
                Math.round(conductor.fromPos.x),
                fromBelowY,
                Math.round(conductor.fromPos.z)
            ) === 'battery';
            
            const toOnBattery = world.get(
                Math.round(conductor.toPos.x),
                toBelowY,
                Math.round(conductor.toPos.z)
            ) === 'battery';
            
            if (fromOnBattery) {
                powerSources.add(`${Math.round(conductor.fromPos.x)},${Math.round(conductor.fromPos.y)},${Math.round(conductor.fromPos.z)}`);
            }
            if (toOnBattery) {
                powerSources.add(`${Math.round(conductor.toPos.x)},${Math.round(conductor.toPos.y)},${Math.round(conductor.toPos.z)}`);
            }
        });

        // Propagate power through circuit
        const poweredPoles = new Set(powerSources);
        const poweredConductors = new Set();
        let changed = true;
        
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

        // Apply visual effects to powered conductors
        conductors.forEach(conductor => {
            if (poweredConductors.has(conductor)) {
                conductor.isPowered = true;
                updateSparkEffect(conductor, delta * 1000);
            } else {
                conductor.isPowered = false;
                conductor.material.emissive.setHex(0x000000);
                conductor.material.emissiveIntensity = 0;
                conductor.spark.visible = false;
                conductor.sparkLight.visible = false;
            }
        });
    }

    // Raycasting
    ui.updateRaycasting(camera, objects, highlightMesh);

    // Update minimap
    const playerPos = controls.getObject().position;
    // Get camera direction to calculate yaw (horizontal rotation)
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const playerRotation = Math.atan2(direction.x, -direction.z); // atan2(sin, cos) for yaw
    minimap.update(playerPos, playerRotation, objects, conductors);

    player.prevTime = time;
    composer.render();
}

function executeUndo(action) {
    if (!action) return;
    
    console.log(`[UNDO] Reversing action:`, action);
    
    if (action.type === 'block-place') {
        const { x, y, z } = action.position;
        const roundedPos = new THREE.Vector3(Math.round(x), Math.round(y), Math.round(z));
        
        // Find and remove the block from scene
        const objectToRemove = objects.find(obj => {
            if (obj.position.equals(roundedPos)) {
                return true;
            }
            return false;
        });
        
        if (objectToRemove) {
            // Remove associated hitbox if it's a pole
            if (objectToRemove.userData.hitbox) {
                scene.remove(objectToRemove.userData.hitbox);
                objects.splice(objects.indexOf(objectToRemove.userData.hitbox), 1);
            }
            // Remove pole hitbox reference if this is a hitbox
            if (objectToRemove.userData.isPoleHitbox) {
                scene.remove(objectToRemove);
                objects.splice(objects.indexOf(objectToRemove), 1);
            } else {
                scene.remove(objectToRemove);
                objects.splice(objects.indexOf(objectToRemove), 1);
            }
        }
        
        world.delete(roundedPos.x, roundedPos.y, roundedPos.z);
            recheckAllConductorCollisions();
        console.log(`[UNDO] Removed block-place at (${roundedPos.x}, ${roundedPos.y}, ${roundedPos.z})`);
        
    } else if (action.type === 'block-remove') {
        const { x, y, z } = action.position;
        const blockType = action.blockType;
        const roundedPos = new THREE.Vector3(Math.round(x), Math.round(y), Math.round(z));
        
        // Restore block
        const useGeometry = isPoleType(blockType) ? geometries.pole : geometries.standard;
        const voxel = new THREE.Mesh(useGeometry, blockMaterials[blockType]);
        voxel.position.copy(roundedPos);
        voxel.castShadow = true;
        voxel.receiveShadow = true;
        voxel.userData.blockType = blockType;
        
        if (isPoleType(blockType)) {
            voxel.userData.isPole = true;
            voxel.userData.poleType = blockType;
            
            const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                visible: false,
                transparent: true,
                opacity: 0
            });
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.position.copy(roundedPos);
            hitbox.userData.isPoleHitbox = true;
            hitbox.userData.parentPole = voxel;
            scene.add(hitbox);
            objects.push(hitbox);
            voxel.userData.hitbox = hitbox;
        }
        
        scene.add(voxel);
        objects.push(voxel);
        world.set(roundedPos.x, roundedPos.y, roundedPos.z, blockType);
        recheckAllConductorCollisions();
        console.log(`[UNDO] Restored block-remove ${blockType} at (${roundedPos.x}, ${roundedPos.y}, ${roundedPos.z})`);
            recheckAllConductorCollisions();
            recheckAllConductorCollisions();
        
    } else if (action.type === 'conductor-place') {
        const fromPos = new THREE.Vector3().copy(action.fromPos);
        const toPos = new THREE.Vector3().copy(action.toPos);
        
        // Find and remove conductor from scene
        const conductorToRemove = conductors.find(cond => {
            return cond.fromPos.equals(fromPos) && cond.toPos.equals(toPos);
        });
        
        if (conductorToRemove) {
            const condIndex = conductors.indexOf(conductorToRemove);
            if (condIndex > -1) {
                conductors.splice(condIndex, 1);
            }
            // Find the tube in scene
            const tubeToRemove = objects.find(obj => obj.userData.isConductor && obj.userData.conductorData === conductorToRemove);
            if (tubeToRemove) {
                scene.remove(tubeToRemove);
                objects.splice(objects.indexOf(tubeToRemove), 1);
            }
            // Remove spark
            if (conductorToRemove.spark) {
                scene.remove(conductorToRemove.spark);
            }
        }
        
        console.log(`[UNDO] Removed conductor-place from (${Math.round(fromPos.x)}, ${Math.round(fromPos.y)}, ${Math.round(fromPos.z)}) to (${Math.round(toPos.x)}, ${Math.round(toPos.y)}, ${Math.round(toPos.z)})`);
        
    } else if (action.type === 'conductor-remove') {
        const fromPos = new THREE.Vector3().copy(action.fromPos);
        const toPos = new THREE.Vector3().copy(action.toPos);
        
        // Find the poles to reconnect
        const fromPole = objects.find(obj => obj.userData.isPole && obj.position.equals(fromPos));
        const toPole = objects.find(obj => obj.userData.isPole && obj.position.equals(toPos));
        
        if (fromPole && toPole) {
            const { tube, conductorData, spark } = createConductor(fromPole, toPole, fromPos, toPos);
            scene.add(tube);
            scene.add(spark);
            objects.push(tube);
            conductors.push(conductorData);
            recheckAllConductorCollisions();
            
            console.log(`[UNDO] Restored conductor-remove from (${Math.round(fromPos.x)}, ${Math.round(fromPos.y)}, ${Math.round(fromPos.z)}) to (${Math.round(toPos.x)}, ${Math.round(toPos.y)}, ${Math.round(toPos.z)})`);
        }
    }
}

function executeRedo(action) {
    if (!action) return;
    
    console.log(`[REDO] Reapplying action:`, action);
    
    if (action.type === 'block-place') {
        const { x, y, z } = action.position;
        const blockType = action.blockType;
        const roundedPos = new THREE.Vector3(Math.round(x), Math.round(y), Math.round(z));
        
        // Re-place block
        const useGeometry = isPoleType(blockType) ? geometries.pole : geometries.standard;
        const voxel = new THREE.Mesh(useGeometry, blockMaterials[blockType]);
        voxel.position.copy(roundedPos);
        voxel.castShadow = true;
        voxel.receiveShadow = true;
        voxel.userData.blockType = blockType;
        
        if (isPoleType(blockType)) {
            voxel.userData.isPole = true;
            voxel.userData.poleType = blockType;
            
            const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                visible: false,
                transparent: true,
                opacity: 0
            });
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.position.copy(roundedPos);
            hitbox.userData.isPoleHitbox = true;
            hitbox.userData.parentPole = voxel;
            scene.add(hitbox);
            objects.push(hitbox);
            voxel.userData.hitbox = hitbox;
        }
        
        scene.add(voxel);
        objects.push(voxel);
        world.set(roundedPos.x, roundedPos.y, roundedPos.z, blockType);
        console.log(`[REDO] Re-placed block-place ${blockType} at (${roundedPos.x}, ${roundedPos.y}, ${roundedPos.z})`);
        
    } else if (action.type === 'block-remove') {
        const { x, y, z } = action.position;
        const roundedPos = new THREE.Vector3(Math.round(x), Math.round(y), Math.round(z));
        
        // Find and remove the block from scene
        const objectToRemove = objects.find(obj => {
            if (obj.position.equals(roundedPos)) {
                return true;
            }
            return false;
        });
        
        if (objectToRemove) {
            if (objectToRemove.userData.hitbox) {
                scene.remove(objectToRemove.userData.hitbox);
                objects.splice(objects.indexOf(objectToRemove.userData.hitbox), 1);
            }
            if (objectToRemove.userData.isPoleHitbox) {
                scene.remove(objectToRemove);
                objects.splice(objects.indexOf(objectToRemove), 1);
            } else {
                scene.remove(objectToRemove);
                objects.splice(objects.indexOf(objectToRemove), 1);
            }
        }
        
        world.delete(roundedPos.x, roundedPos.y, roundedPos.z);
        console.log(`[REDO] Re-removed block-remove at (${roundedPos.x}, ${roundedPos.y}, ${roundedPos.z})`);
        
    } else if (action.type === 'conductor-place') {
        const fromPos = new THREE.Vector3().copy(action.fromPos);
        const toPos = new THREE.Vector3().copy(action.toPos);
        
        // Find the poles to reconnect
        const fromPole = objects.find(obj => obj.userData.isPole && obj.position.equals(fromPos));
        const toPole = objects.find(obj => obj.userData.isPole && obj.position.equals(toPos));
        
        if (fromPole && toPole) {
            const { tube, conductorData, spark } = createConductor(fromPole, toPole, fromPos, toPos);
            scene.add(tube);
            scene.add(spark);
            objects.push(tube);
            conductors.push(conductorData);
            recheckAllConductorCollisions();
            
            console.log(`[REDO] Re-placed conductor-place from (${Math.round(fromPos.x)}, ${Math.round(fromPos.y)}, ${Math.round(fromPos.z)}) to (${Math.round(toPos.x)}, ${Math.round(toPos.y)}, ${Math.round(toPos.z)})`);
        }
        
    } else if (action.type === 'conductor-remove') {
        const fromPos = new THREE.Vector3().copy(action.fromPos);
        const toPos = new THREE.Vector3().copy(action.toPos);
        
        // Find and remove conductor from scene
        const conductorToRemove = conductors.find(cond => {
            return cond.fromPos.equals(fromPos) && cond.toPos.equals(toPos);
        });
        
        if (conductorToRemove) {
            const condIndex = conductors.indexOf(conductorToRemove);
            if (condIndex > -1) {
                conductors.splice(condIndex, 1);
            }
            // Remove spark
            if (conductorToRemove.spark) {
                scene.remove(conductorToRemove.spark);
            }
            const tubeToRemove = objects.find(obj => obj.userData.isConductor && obj.userData.conductorData === conductorToRemove);
            if (tubeToRemove) {
                scene.remove(tubeToRemove);
                objects.splice(objects.indexOf(tubeToRemove), 1);
            }
        }
        
        console.log(`[REDO] Re-removed conductor-remove from (${Math.round(fromPos.x)}, ${Math.round(fromPos.y)}, ${Math.round(fromPos.z)}) to (${Math.round(toPos.x)}, ${Math.round(toPos.y)}, ${Math.round(toPos.z)})`);
    }
}

// Start the application
init();
