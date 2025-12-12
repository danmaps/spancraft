import * as THREE from 'three';

export class Player {
    constructor(controls, moveSpeed = 20) {
        this.controls = controls;
        this.velocity = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.canJump = false;
        this.isFlying = false;
        this.playerHeight = 1.8;
        this.playerWidth = 0.6;
        this.moveSpeed = moveSpeed;
        this.prevTime = performance.now();
    }

    setupControls() {
        const updateOverlay = () => {
            const overlay = document.getElementById('pointer-lock-overlay');
            const clickToPlay = document.getElementById('click-to-play');
            
            if (document.pointerLockElement) {
                // Pointer is locked - hide overlay
                overlay.classList.add('hidden');
                clickToPlay.classList.add('hidden');
            } else {
                // Pointer is not locked - show overlay
                overlay.classList.remove('hidden');
                clickToPlay.classList.remove('hidden');
            }
        };

        document.addEventListener('click', () => {
            // Don't lock pointer if settings modal is visible
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal && settingsModal.style.display === 'block') {
                return;
            }
            this.controls.lock();
        });

        // Handle pointer lock state changes
        document.addEventListener('pointerlockchange', updateOverlay);
        
        // Also listen to controls events
        this.controls.addEventListener('lock', updateOverlay);
        this.controls.addEventListener('unlock', updateOverlay);

        // Set initial state
        updateOverlay();

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.isFlying) {
                    this.moveUp = true;
                } else if (this.canJump) {
                    this.velocity.y += 12;
                    this.canJump = false;
                }
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                if (this.isFlying) {
                    this.moveDown = true;
                }
                break;
            case 'KeyF':
                this.toggleFlying();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.moveUp = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveDown = false;
                break;
        }
    }

    toggleFlying() {
        this.isFlying = !this.isFlying;
        const indicator = document.getElementById('fly-indicator');
        indicator.style.display = this.isFlying ? 'block' : 'none';
        if (this.isFlying) {
            this.velocity.y = 0;
        }
    }

    update(delta, world, camera) {
        if (!this.controls.isLocked) return;

        // Friction
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        if (this.isFlying) {
            this.velocity.y -= this.velocity.y * 10.0 * delta;
        } else {
            this.velocity.y -= 30.0 * delta;
        }

        // Direction
        const forward = new THREE.Vector3();
        this.controls.getDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();

        const inputVector = new THREE.Vector3();
        if (this.moveForward) inputVector.add(forward);
        if (this.moveBackward) inputVector.sub(forward);
        if (this.moveRight) inputVector.add(right);
        if (this.moveLeft) inputVector.sub(right);
        inputVector.normalize();

        const flySpeedMultiplier = this.isFlying ? 1.5 : 1.0;
        if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
            this.velocity.x += inputVector.x * this.moveSpeed * 5.0 * delta * flySpeedMultiplier;
            this.velocity.z += inputVector.z * this.moveSpeed * 5.0 * delta * flySpeedMultiplier;
        }

        if (this.isFlying) {
            if (this.moveUp) this.velocity.y += this.moveSpeed * 5.0 * delta;
            if (this.moveDown) this.velocity.y -= this.moveSpeed * 5.0 * delta;
        }

        // Collision detection
        const playerObj = this.controls.getObject();
        const originalPos = playerObj.position.clone();

        playerObj.position.x += this.velocity.x * delta;
        if (this.checkHorizontalCollision(playerObj.position, world)) {
            playerObj.position.x = originalPos.x;
            this.velocity.x = 0;
        }

        playerObj.position.z += this.velocity.z * delta;
        if (this.checkHorizontalCollision(playerObj.position, world)) {
            playerObj.position.z = originalPos.z;
            this.velocity.z = 0;
        }

        playerObj.position.y += this.velocity.y * delta;

        if (!this.isFlying) {
            if (this.velocity.y < 0) {
                if (this.checkVerticalCollision(playerObj.position, world, true)) {
                    this.velocity.y = 0;
                    this.canJump = true;
                    const feetY = playerObj.position.y - 1.5;
                    const blockY = Math.round(feetY);
                    playerObj.position.y = blockY + 0.5 + 1.5;
                }
            } else if (this.velocity.y > 0) {
                if (this.checkVerticalCollision(playerObj.position, world, false)) {
                    this.velocity.y = 0;
                    playerObj.position.y = Math.floor(playerObj.position.y + 0.1) - 0.1 - 0.1;
                }
            }
        }

        if (playerObj.position.y < -10) {
            this.velocity.y = 0;
            playerObj.position.set(0, 10, 0);
        }
    }

    checkHorizontalCollision(pos, world) {
        const x = pos.x;
        const y = pos.y;
        const z = pos.z;
        const w = 0.3;

        const points = [
            new THREE.Vector3(x - w, y - 1.4, z - w),
            new THREE.Vector3(x + w, y - 1.4, z - w),
            new THREE.Vector3(x - w, y - 1.4, z + w),
            new THREE.Vector3(x + w, y - 1.4, z + w),
            new THREE.Vector3(x - w, y - 0.8, z - w),
            new THREE.Vector3(x + w, y - 0.8, z - w),
            new THREE.Vector3(x - w, y - 0.8, z + w),
            new THREE.Vector3(x + w, y - 0.8, z + w),
            new THREE.Vector3(x, y + 0.1, z)
        ];

        for (const p of points) {
            if (world.checkCollision(p)) return true;
        }
        return false;
    }

    checkVerticalCollision(pos, world, isFalling) {
        const x = pos.x;
        const y = pos.y;
        const z = pos.z;
        const w = 0.3;

        const points = [];
        if (isFalling) {
            points.push(
                new THREE.Vector3(x - w, y - 1.5, z - w),
                new THREE.Vector3(x + w, y - 1.5, z - w),
                new THREE.Vector3(x - w, y - 1.5, z + w),
                new THREE.Vector3(x + w, y - 1.5, z + w)
            );
        } else {
            points.push(new THREE.Vector3(x, y + 0.1, z));
        }

        for (const p of points) {
            if (world.checkCollision(p)) return true;
        }
        return false;
    }
}
