import * as THREE from 'three';
import { BLOCK_TYPES } from './blocks.js';

export class UI {
    constructor(blockMaterials, geometries) {
        this.blockMaterials = blockMaterials;
        this.geometries = geometries;
        this.selectedBlockType = BLOCK_TYPES.DIRT;
        this.raycaster = new THREE.Raycaster();
        this.onBlockSelected = null;
        this.onRaycast = null;
        this.setupBlockSelector();
    }

    setupBlockSelector() {
        const blockOptions = document.querySelectorAll('.block-option');
        blockOptions.forEach((option, index) => {
            option.addEventListener('click', (e) => {
                blockOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedBlockType = option.dataset.type;
                if (this.onBlockSelected) {
                    this.onBlockSelected(this.selectedBlockType);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            const key = e.key;
            if (key >= '1' && key <= '9') {
                const index = parseInt(key) - 1;
                if (blockOptions[index]) {
                    blockOptions.forEach(opt => opt.classList.remove('selected'));
                    blockOptions[index].classList.add('selected');
                    this.selectedBlockType = blockOptions[index].dataset.type;
                    if (this.onBlockSelected) {
                        this.onBlockSelected(this.selectedBlockType);
                    }
                }
            }
        });
    }

    getHighlightMesh() {
        const highlightMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.001, 1.001, 1.001),
            new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
        );
        highlightMesh.visible = false;
        return highlightMesh;
    }

    updateRaycasting(camera, objects, highlightMesh) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = this.raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const lookTarget = intersect.point.clone().sub(intersect.face.normal.clone().multiplyScalar(0.1));
            lookTarget.x = Math.round(lookTarget.x);
            lookTarget.y = Math.round(lookTarget.y);
            lookTarget.z = Math.round(lookTarget.z);

            highlightMesh.position.copy(lookTarget);
            highlightMesh.visible = true;
        } else {
            highlightMesh.visible = false;
        }
    }

    setupExportImport(exportFn, importFn) {
        const exportBtn = document.getElementById('export-btn');
        const importBtn = document.getElementById('import-btn');
        const importInput = document.getElementById('import-input');

        exportBtn.onclick = exportFn;
        importBtn.onclick = () => importInput.click();
        importInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
                try {
                    importFn(evt.target.result);
                } catch (err) {
                    alert('Invalid scene file.');
                }
            };
            reader.readAsArrayBuffer(file);
        };
    }
}
