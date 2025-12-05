import * as THREE from 'three';
import { Packr } from 'msgpackr';

const packr = new Packr();

export function exportSceneToMsgpack(scene, world, objects, conductors) {
    const blocks = [];
    const polePositions = new Set();
    
    // First, collect all pole positions
    objects.forEach(obj => {
        if (obj.userData && obj.userData.isPole) {
            polePositions.add(`${obj.position.x},${obj.position.y},${obj.position.z}`);
        }
    });
    
    world.data.forEach((v, key) => {
        if (v) {
            const [x, y, z] = key.split(',').map(Number);
            
            // Skip if this position is a pole
            if (polePositions.has(`${x},${y},${z}`)) {
                return;
            }
            
            // Try to find a mesh object to get its block type
            const meshObj = objects.find(obj =>
                obj.position &&
                obj.position.x === x &&
                obj.position.y === y &&
                obj.position.z === z &&
                obj.userData &&
                !obj.userData.isPoleHitbox &&
                !obj.userData.isConductor &&
                !obj.userData.isInstancedMesh
            );

            // Export the block (either with its specific type or default to dirt for terrain)
            blocks.push({ x, y, z, type: meshObj?.userData?.blockType || 'dirt' });
        }
    });

    const poles = objects
        .filter(obj => obj.userData && obj.userData.isPole)
        .map(obj => ({
            x: obj.position.x,
            y: obj.position.y,
            z: obj.position.z,
            type: obj.userData.poleType || 'pole'
        }));

    const wires = conductors.map(c => ({
        from: { x: c.from.position.x, y: c.from.position.y, z: c.from.position.z },
        to: { x: c.to.position.x, y: c.to.position.y, z: c.to.position.z }
    }));

    const data = { blocks, poles, wires };
    const packed = packr.pack(data);
    const blob = new Blob([packed], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spancraft-scene.msgpack';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

export function importSceneFromMsgpack(arrayBuffer, scene, world, objects, conductors, blockMaterials, geometries, createConductorFn) {
    const unpacked = packr.unpack(new Uint8Array(arrayBuffer));

    // Clear ALL objects including terrain
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else {
                obj.material.dispose();
            }
        }
    }
    objects.length = 0;

    conductors.length = 0;
    world.clear();

    // console.log('Importing scene...');
    // console.log('Blocks to import:', unpacked.blocks?.length || 0);
    // console.log('Poles to import:', unpacked.poles?.length || 0);
    // console.log('Wires to import:', unpacked.wires?.length || 0);

    if (unpacked.blocks) {
        unpacked.blocks.forEach(b => {
            const voxel = new THREE.Mesh(geometries.standard, blockMaterials[b.type] || blockMaterials.dirt);
            voxel.position.set(b.x, b.y, b.z);
            voxel.castShadow = true;
            voxel.receiveShadow = true;
            voxel.userData.blockType = b.type;
            scene.add(voxel);
            objects.push(voxel);
            world.set(Math.round(b.x), Math.round(b.y), Math.round(b.z));
        });
        // console.log('Blocks imported:', unpacked.blocks.length);
        // console.log('World data size:', world.data.size);
    }

    if (unpacked.poles) {
        unpacked.poles.forEach(p => {
            const voxel = new THREE.Mesh(geometries.pole, blockMaterials[p.type] || blockMaterials.pole);
            voxel.position.set(p.x, p.y, p.z);
            voxel.castShadow = true;
            voxel.receiveShadow = true;
            voxel.userData.isPole = true;
            voxel.userData.poleType = p.type;

            const hitboxGeometry = new THREE.BoxGeometry(1, 1, 1);
            const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.position.set(p.x, p.y, p.z);
            hitbox.userData.isPoleHitbox = true;
            hitbox.userData.parentPole = voxel;

            scene.add(hitbox);
            objects.push(hitbox);
            voxel.userData.hitbox = hitbox;
            scene.add(voxel);
            objects.push(voxel);
            world.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
        });
    }

    if (unpacked.wires) {
        unpacked.wires.forEach(w => {
            const fromPole = objects.find(obj =>
                obj.userData &&
                obj.userData.isPole &&
                obj.position.x === w.from.x &&
                obj.position.y === w.from.y &&
                obj.position.z === w.from.z
            );
            const toPole = objects.find(obj =>
                obj.userData &&
                obj.userData.isPole &&
                obj.position.x === w.to.x &&
                obj.position.y === w.to.y &&
                obj.position.z === w.to.z
            );

            if (fromPole && toPole) {
                const fromPos = fromPole.position.clone();
                const toPos = toPole.position.clone();
                const { tube, conductorData } = createConductorFn(fromPole, toPole, fromPos, toPos);
                scene.add(tube);
                objects.push(tube);
                conductors.push(conductorData);
            }
        });
    }
    
    // console.log('Import complete');
    return true;
}
