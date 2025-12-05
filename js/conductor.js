import * as THREE from 'three';

export function calculateCatenaryCurve(fromPos, toPos, numPoints = 50) {
    const points = [];
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        
        // Linear interpolation between endpoints
        const x = fromPos.x + (toPos.x - fromPos.x) * t;
        const y = fromPos.y + (toPos.y - fromPos.y) * t;
        const z = fromPos.z + (toPos.z - fromPos.z) * t;
        
        // Calculate sag using parabola (max at center, 0 at ends)
        // t goes from 0 to 1, so t*(1-t) is max at t=0.5
        const horizontalDistance = Math.sqrt(
            Math.pow(toPos.x - fromPos.x, 2) + 
            Math.pow(toPos.z - fromPos.z, 2)
        );
        const sagAmount = horizontalDistance * 0.1; // 10% of span
        const sag = 4 * sagAmount * t * (1 - t); // Parabolic sag, max in middle
        
        points.push(new THREE.Vector3(x, y - sag, z));
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

    // Create spark particle for traveling effect
    const sparkGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const sparkMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0
    });
    const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
    spark.visible = false;

    // Create point light for spark
    const sparkLight = new THREE.PointLight(0x00ffff, 2, 8);
    sparkLight.visible = false;
    spark.add(sparkLight);

    const conductorData = {
        from: fromPole,
        to: toPole,
        fromPos: fromPos.clone(),
        toPos: toPos.clone(),
        tube,
        material: tubeMaterial,
        hasCollision: false,
        isPowered: false,
        curve,
        spark,
        sparkMaterial,
        sparkLight,
        sparkProgress: 0,
        sparkSpeed: 0.4 + Math.random() * 0.3 // Randomize speed slightly
    };

    tube.userData.isConductor = true;
    tube.userData.conductorData = conductorData;

    return { tube, conductorData, spark };
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

export function updateSparkEffect(conductor, deltaTime) {
    if (!conductor.isPowered || conductor.hasCollision) {
        // Hide spark if not powered or has collision
        conductor.spark.visible = false;
        conductor.sparkLight.visible = false;
        return;
    }

    // Show and animate spark
    conductor.spark.visible = true;
    conductor.sparkLight.visible = true;

    // Update progress along curve
    conductor.sparkProgress += deltaTime * conductor.sparkSpeed;
    if (conductor.sparkProgress > 1) {
        conductor.sparkProgress = 0;
    }

    // Get position along curve
    const position = conductor.curve.getPoint(conductor.sparkProgress);
    conductor.spark.position.copy(position);

    // Pulsing glow effect
    const pulse = 0.7 + Math.sin(conductor.sparkProgress * Math.PI * 4) * 0.3;
    conductor.sparkMaterial.opacity = pulse;
    conductor.sparkLight.intensity = 2 + pulse * 1.5;

    // Add trail effect with emissive on wire
    const trailLength = 0.15;
    const distanceFromSpark = Math.abs(conductor.sparkProgress - 0.5);
    if (distanceFromSpark < trailLength) {
        const trailIntensity = (1 - distanceFromSpark / trailLength) * 0.3;
        conductor.material.emissive.setHex(0x0088ff);
        conductor.material.emissiveIntensity = trailIntensity;
    } else {
        conductor.material.emissive.setHex(0x0044ff);
        conductor.material.emissiveIntensity = 0.1;
    }
}
