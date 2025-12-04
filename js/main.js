import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { createScene, createCamera, createRenderer, setupLighting, onWindowResize } from './scene.js';
import { loadTextures, createBlockMaterials, getBlockGeometry, BLOCK_TYPES, isPoleType } from './blocks.js';
import { World, createHighlightMesh } from './world.js';
import { calculateCatenaryCurve, createConductor, checkConductorCollision, updateConductorVisuals } from './conductor.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { exportSceneToMsgpack, importSceneFromMsgpack } from './storage.js';

let scene, camera, renderer, controls, world, player, ui, blockMaterials, geometries;
let conductorFromPole = null;
let conductors = [];
let objects = [];
let highlightMesh;

async function init() {
    // Scene setup
    scene = createScene();
    camera = createCamera();
    renderer = createRenderer();
    onWindowResize(camera, renderer);

    // Lighting
    setupLighting(scene);

    // Load textures and create materials
    const textures = await loadTextures();
    blockMaterials = createBlockMaterials(textures);
    geometries = getBlockGeometry();

    // World generation
    world = new World(40, 3);
    const terrainMesh = world.generateTerrain(blockMaterials.dirt);
    terrainMesh.userData.isInstancedMesh = true;
    scene.add(terrainMesh);
    objects.push(terrainMesh);

    // Generate random tall poles
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

    // Player and controls
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
    player = new Player(controls);
    player.setupControls();

    // UI
    ui = new UI(blockMaterials, geometries);
    ui.onBlockSelected = (blockType) => {
        if (blockType !== BLOCK_TYPES.CONDUCTOR) {
            conductorFromPole = null;
            document.getElementById('wire-mode-indicator').style.display = 'none';
        }
    };

    highlightMesh = ui.getHighlightMesh();
    scene.add(highlightMesh);

    // Setup export/import
    ui.setupExportImport(
        () => exportSceneToMsgpack(scene, world, objects, conductors),
        (arrayBuffer) => importSceneFromMsgpack(arrayBuffer, scene, world, objects, conductors, blockMaterials, geometries, createConductor)
    );

    // Interaction
    setupInteraction();

    // Start animation loop
    animate();
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
                            conductors.splice(condIndex, 1);
                        }
                        scene.remove(intersect.object);
                        objects.splice(objects.indexOf(intersect.object), 1);
                        return;
                    }

                    let blockPos;
                    if (instanceId !== undefined) {
                        const matrix = new THREE.Matrix4();
                        intersect.object.getMatrixAt(instanceId, matrix);
                        blockPos = new THREE.Vector3().setFromMatrixPosition(matrix);

                        matrix.scale(new THREE.Vector3(0, 0, 0));
                        intersect.object.setMatrixAt(instanceId, matrix);
                        intersect.object.instanceMatrix.needsUpdate = true;
                    } else {
                        blockPos = intersect.object.position.clone();

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

                    world.delete(Math.round(blockPos.x), Math.round(blockPos.y), Math.round(blockPos.z));
                }
            } else if (event.button === 2) { // Right click: Place or Select Pole
                const intersects = ui.raycaster.intersectObjects(objects);
                if (intersects.length > 0) {
                    const intersect = intersects[0];

                    // Conductor mode
                    if (ui.selectedBlockType === BLOCK_TYPES.CONDUCTOR) {
                        let clickedPole = null;
                        if (intersect.object.userData.isPoleHitbox) {
                            clickedPole = intersect.object.userData.parentPole;
                        } else if (intersect.object.userData.isPole) {
                            clickedPole = intersect.object;
                        }

                        if (clickedPole) {
                            const wireIndicator = document.getElementById('wire-mode-indicator');
                            if (!conductorFromPole) {
                                conductorFromPole = clickedPole;
                                wireIndicator.textContent = 'Select TO pole';
                                wireIndicator.style.display = 'block';
                            } else {
                                // Get attachment points - offset down by 1 block
                                const fromPos = conductorFromPole.position.clone();
                                fromPos.y -= 1;
                                const toPos = clickedPole.position.clone();
                                toPos.y -= 1;
                                
                                console.log('Conductor from position:', fromPos);
                                console.log('Conductor to position:', toPos);

                                if (fromPos.x === toPos.x && fromPos.z === toPos.z) {
                                    wireIndicator.textContent = 'Cannot connect same pole! Select FROM pole';
                                    conductorFromPole = null;
                                    return;
                                }

                                const { tube, conductorData } = createConductor(conductorFromPole, clickedPole, fromPos, toPos);
                                scene.add(tube);
                                objects.push(tube);
                                conductors.push(conductorData);

                                conductorFromPole = null;
                                wireIndicator.textContent = 'Select FROM pole';
                            }
                        }
                        return;
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
                    }

                    scene.add(voxel);
                    objects.push(voxel);
                    world.set(Math.round(voxelPos.x), Math.round(voxelPos.y), Math.round(voxelPos.z));
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
        // Update attachment positions - offset down by 1 block
        conductor.fromPos.copy(conductor.from.position);
        conductor.fromPos.y -= 1;
        conductor.toPos.copy(conductor.to.position);
        conductor.toPos.y -= 1;
        
        const fromPos = conductor.fromPos;
        const toPos = conductor.toPos;
        const hasCollision = checkConductorCollision(fromPos, toPos, world);

        if (hasCollision !== conductor.hasCollision) {
            conductor.hasCollision = hasCollision;
            updateConductorVisuals(conductor);
        }
    });

    // Raycasting
    ui.updateRaycasting(camera, objects, highlightMesh);

    player.prevTime = time;
    renderer.render(scene, camera);
}

// Start the application
init();
