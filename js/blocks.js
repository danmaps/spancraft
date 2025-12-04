import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export async function loadTextures() {
    const textureSide = loader.load('textures/dirt-side.jpg');
    const textureTop = loader.load('textures/dirt-top.jpg');
    const textureBottom = loader.load('textures/dirt-bottom.jpg');

    // Pixelated look
    textureSide.magFilter = THREE.NearestFilter;
    textureTop.magFilter = THREE.NearestFilter;
    textureBottom.magFilter = THREE.NearestFilter;

    return { textureSide, textureTop, textureBottom };
}

export function createBlockMaterials({ textureSide, textureTop, textureBottom }) {
    const dirtMaterials = [
        new THREE.MeshLambertMaterial({ map: textureSide }),
        new THREE.MeshLambertMaterial({ map: textureSide }),
        new THREE.MeshLambertMaterial({ map: textureTop }),
        new THREE.MeshLambertMaterial({ map: textureBottom }),
        new THREE.MeshLambertMaterial({ map: textureSide }),
        new THREE.MeshLambertMaterial({ map: textureSide })
    ];

    return {
        dirt: dirtMaterials,
        stone: [
            new THREE.MeshLambertMaterial({ color: 0x808080 }),
            new THREE.MeshLambertMaterial({ color: 0x808080 }),
            new THREE.MeshLambertMaterial({ color: 0x909090 }),
            new THREE.MeshLambertMaterial({ color: 0x707070 }),
            new THREE.MeshLambertMaterial({ color: 0x808080 }),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        ],
        wood: [
            new THREE.MeshLambertMaterial({ color: 0xDEB887 }),
            new THREE.MeshLambertMaterial({ color: 0xDEB887 }),
            new THREE.MeshLambertMaterial({ color: 0xF5DEB3 }),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C }),
            new THREE.MeshLambertMaterial({ color: 0xDEB887 }),
            new THREE.MeshLambertMaterial({ color: 0xDEB887 })
        ],
        cobblestone: [
            new THREE.MeshLambertMaterial({ color: 0x6B7280 }),
            new THREE.MeshLambertMaterial({ color: 0x6B7280 }),
            new THREE.MeshLambertMaterial({ color: 0x7B8290 }),
            new THREE.MeshLambertMaterial({ color: 0x5B6270 }),
            new THREE.MeshLambertMaterial({ color: 0x6B7280 }),
            new THREE.MeshLambertMaterial({ color: 0x6B7280 })
        ],
        brick: [
            new THREE.MeshLambertMaterial({ color: 0xB22222 }),
            new THREE.MeshLambertMaterial({ color: 0xB22222 }),
            new THREE.MeshLambertMaterial({ color: 0xC23232 }),
            new THREE.MeshLambertMaterial({ color: 0xA21212 }),
            new THREE.MeshLambertMaterial({ color: 0xB22222 }),
            new THREE.MeshLambertMaterial({ color: 0xB22222 })
        ],
        battery: [
            new THREE.MeshStandardMaterial({ color: 0x00AA00, emissive: 0x00FF00, emissiveIntensity: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x00AA00, emissive: 0x00FF00, emissiveIntensity: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00FF00, emissiveIntensity: 0.5 }),
            new THREE.MeshStandardMaterial({ color: 0x00AA00, emissive: 0x00FF00, emissiveIntensity: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x00AA00, emissive: 0x00FF00, emissiveIntensity: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x00AA00, emissive: 0x00FF00, emissiveIntensity: 0.3 })
        ],
        pole: [
            new THREE.MeshLambertMaterial({ color: 0x8B7355 }),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 }),
            new THREE.MeshLambertMaterial({ color: 0x654321 }),
            new THREE.MeshLambertMaterial({ color: 0x654321 }),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 }),
            new THREE.MeshLambertMaterial({ color: 0x8B7355 })
        ],
        'metal-pole': [
            new THREE.MeshStandardMaterial({ color: 0xB0B0B0, metalness: 0.8, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xB0B0B0, metalness: 0.8, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xD0D0D0, metalness: 0.8, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0x909090, metalness: 0.8, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xB0B0B0, metalness: 0.8, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: 0xB0B0B0, metalness: 0.8, roughness: 0.2 })
        ]
    };
}

export function getBlockGeometry() {
    return {
        standard: new THREE.BoxGeometry(),
        pole: new THREE.BoxGeometry(0.3, 1, 0.3)
    };
}

export const BLOCK_TYPES = {
    DIRT: 'dirt',
    STONE: 'stone',
    WOOD: 'wood',
    COBBLESTONE: 'cobblestone',
    BRICK: 'brick',
    BATTERY: 'battery',
    POLE: 'pole',
    METAL_POLE: 'metal-pole',
    CONDUCTOR: 'conductor'
};

export function isPoleType(blockType) {
    return blockType === BLOCK_TYPES.POLE || blockType === BLOCK_TYPES.METAL_POLE;
}
