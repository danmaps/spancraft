import * as THREE from 'three';

export function calculateCatenaryCurve(fromPos, toPos, numPoints = 50) {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dz = toPos.z - fromPos.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    const sag = horizontalDistance * 0.1;
    const a = solveCatenaryParameter(horizontalDistance, sag);

    const points = [];
    const direction = new THREE.Vector3(dx, 0, dz).normalize();

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = t * horizontalDistance - horizontalDistance / 2;
        const catenaryY = a * (Math.cosh(x / a) - 1);
        const alongSpan = direction.clone().multiplyScalar(t * horizontalDistance);
        const point = fromPos.clone().add(alongSpan);
        point.y += dy * t + catenaryY;
        points.push(point);
    }

    return points;
}

function solveCatenaryParameter(L, S) {
    let a = (L * L) / (8 * S);

    for (let i = 0; i < 20; i++) {
        const halfL_a = L / (2 * a);
        const coshVal = Math.cosh(halfL_a);
        const sinhVal = Math.sinh(halfL_a);

        const f = a * (coshVal - 1) - S;
        const df = coshVal - 1 - halfL_a * sinhVal;

        const delta = f / df;
        a -= delta;

        if (Math.abs(delta) < 1e-6) break;
    }

    return a;
}

export function createConductor(fromPole, toPole, fromPos, toPos) {
    const catenaryPoints = calculateCatenaryCurve(fromPos, toPos);
    const curve = new THREE.CatmullRomCurve3(catenaryPoints);
    const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.03125, 8, false);
    const tubeMaterial = new THREE.MeshLambertMaterial({
        color: 0x1a1a1a,
        emissive: 0x000000
    });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.castShadow = true;

    const conductorData = {
        from: fromPole,
        to: toPole,
        fromPos: fromPos.clone(),
        toPos: toPos.clone(),
        tube,
        material: tubeMaterial,
        hasCollision: false
    };

    tube.userData.isConductor = true;
    tube.userData.conductorData = conductorData;

    return { tube, conductorData };
}

export function checkConductorCollision(fromPos, toPos, world) {
    const catenaryPoints = calculateCatenaryCurve(fromPos, toPos, 30);

    for (const point of catenaryPoints) {
        const x = Math.round(point.x);
        const y = Math.round(point.y);
        const z = Math.round(point.z);

        if (world.has(x, y, z)) {
            // Exclude entire pole columns (ignore y coordinate for pole check)
            const isFromPoleColumn = (x === Math.round(fromPos.x) && z === Math.round(fromPos.z));
            const isToPoleColumn = (x === Math.round(toPos.x) && z === Math.round(toPos.z));

            if (!isFromPoleColumn && !isToPoleColumn) {
                return true;
            }
        }
    }
    return false;
}

export function updateConductorVisuals(conductor) {
    if (conductor.hasCollision) {
        conductor.material.color.setHex(0xff0000);
        conductor.material.emissive.setHex(0xff0000);
        conductor.material.emissiveIntensity = 0.5;
    } else {
        conductor.material.color.setHex(0x1a1a1a);
        conductor.material.emissive.setHex(0x000000);
        conductor.material.emissiveIntensity = 0;
    }
}
