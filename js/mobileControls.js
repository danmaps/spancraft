import * as THREE from 'three';

const MOBILE_BREAKPOINT = 1024;
const TUTORIAL_STORAGE_KEY = 'spancraft-mobile-field-tutorial-seen';

export class MobileFieldControls {
    constructor({ player, camera, settings, onInteract, onVisibilityChange }) {
        this.player = player;
        this.camera = camera;
        this.settings = settings;
        this.onInteract = onInteract;
        this.onVisibilityChange = onVisibilityChange;

        this.hud = document.getElementById('mobile-field-hud');
        this.lookRegion = document.getElementById('mobile-look-region');
        this.joystick = document.getElementById('mobile-joystick');
        this.joystickThumb = document.getElementById('mobile-joystick-thumb');
        this.jumpButton = document.getElementById('mobile-jump-btn');
        this.interactButton = document.getElementById('mobile-interact-btn');
        this.interactPrompt = document.getElementById('mobile-interact-prompt');
        this.toolIndicator = document.getElementById('mobile-tool-indicator');
        this.statusIndicator = document.getElementById('mobile-status-indicator');
        this.tutorial = document.getElementById('mobile-tutorial');
        this.dismissTutorialButton = document.getElementById('mobile-tutorial-dismiss');

        this.isVisible = false;
        this.joystickPointerId = null;
        this.lookPointerId = null;
        this.maxJoystickDistance = 44;
        this.lastLookX = 0;
        this.lastLookY = 0;
        this.currentToolText = '';
        this.currentInteractionSignature = '';

        this.setupEvents();
        this.updateVisibility();
        window.addEventListener('resize', () => this.updateVisibility());
        window.addEventListener('orientationchange', () => this.updateVisibility());
    }

    isMobileViewport() {
        return window.innerWidth <= MOBILE_BREAKPOINT || window.matchMedia('(pointer: coarse)').matches;
    }

    updateVisibility() {
        this.isVisible = this.isMobileViewport();
        document.body.classList.toggle('mobile-field-mode', this.isVisible);
        this.hud.setAttribute('aria-hidden', String(!this.isVisible));
        if (this.isVisible) {
            this.hud.removeAttribute('inert');
        } else {
            this.hud.setAttribute('inert', '');
        }
        this.player.setTouchControlsEnabled(this.isVisible);

        if (!this.isVisible) {
            this.resetJoystick();
            this.lookPointerId = null;
            this.jumpButton.classList.remove('pressed');
            this.player.setTouchJumpPressed(false);
            this.interactPrompt.textContent = '';
            this.interactButton.disabled = true;
            this.interactButton.classList.remove('available');
            this.hideTutorial();
        } else if (!localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
            this.tutorial.classList.add('visible');
        }

        if (this.onVisibilityChange) {
            this.onVisibilityChange(this.isVisible);
        }
    }

    setupEvents() {
        this.hud.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        this.dismissTutorialButton.addEventListener('click', () => {
            this.markTutorialSeen();
        });

        this.joystick.addEventListener('pointerdown', (event) => {
            if (!this.isVisible) return;
            event.preventDefault();
            event.stopPropagation();
            this.joystickPointerId = event.pointerId;
            this.joystick.setPointerCapture(event.pointerId);
            this.joystick.classList.add('active');
            this.updateJoystickFromEvent(event);
        });

        this.joystick.addEventListener('pointermove', (event) => {
            if (event.pointerId !== this.joystickPointerId) return;
            event.preventDefault();
            this.updateJoystickFromEvent(event);
        });

        this.joystick.addEventListener('pointerup', (event) => {
            if (event.pointerId !== this.joystickPointerId) return;
            event.preventDefault();
            this.resetJoystick();
        });

        this.joystick.addEventListener('pointercancel', () => {
            this.resetJoystick();
        });

        this.lookRegion.addEventListener('pointerdown', (event) => {
            if (!this.isVisible) return;
            event.preventDefault();
            event.stopPropagation();
            this.lookPointerId = event.pointerId;
            this.lastLookX = event.clientX;
            this.lastLookY = event.clientY;
            this.lookRegion.setPointerCapture(event.pointerId);
            this.lookRegion.classList.add('active');
        });

        this.lookRegion.addEventListener('pointermove', (event) => {
            if (event.pointerId !== this.lookPointerId) return;
            event.preventDefault();
            this.applyLookDelta(event.clientX - this.lastLookX, event.clientY - this.lastLookY);
            this.lastLookX = event.clientX;
            this.lastLookY = event.clientY;
        });

        this.lookRegion.addEventListener('pointerup', (event) => {
            if (event.pointerId !== this.lookPointerId) return;
            event.preventDefault();
            this.lookPointerId = null;
            this.lookRegion.classList.remove('active');
        });

        this.lookRegion.addEventListener('pointercancel', () => {
            this.lookPointerId = null;
            this.lookRegion.classList.remove('active');
        });

        this.jumpButton.addEventListener('pointerdown', (event) => {
            if (!this.isVisible) return;
            event.preventDefault();
            event.stopPropagation();
            this.jumpButton.setPointerCapture(event.pointerId);
            this.jumpButton.classList.add('pressed');
            this.player.setTouchJumpPressed(true);
        });

        const releaseJump = (event) => {
            event.preventDefault();
            this.jumpButton.classList.remove('pressed');
            this.player.setTouchJumpPressed(false);
        };

        const clearJumpState = () => {
            this.jumpButton.classList.remove('pressed');
            this.player.setTouchJumpPressed(false);
        };

        this.jumpButton.addEventListener('pointerup', releaseJump);
        this.jumpButton.addEventListener('pointercancel', releaseJump);
        this.jumpButton.addEventListener('lostpointercapture', clearJumpState);

        this.interactButton.addEventListener('pointerdown', (event) => {
            if (!this.isVisible || this.interactButton.disabled) return;
            event.preventDefault();
            event.stopPropagation();
            this.interactButton.classList.add('pressed');
        });

        this.interactButton.addEventListener('pointerup', (event) => {
            if (!this.isVisible) return;
            event.preventDefault();
            this.interactButton.classList.remove('pressed');
            if (!this.interactButton.disabled && this.onInteract) {
                this.onInteract();
                this.markTutorialSeen();
            }
        });

        this.interactButton.addEventListener('pointercancel', (event) => {
            event.preventDefault();
            this.interactButton.classList.remove('pressed');
        });
    }

    updateJoystickFromEvent(event) {
        const rect = this.joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offsetX = event.clientX - centerX;
        const offsetY = event.clientY - centerY;
        const distance = Math.min(Math.hypot(offsetX, offsetY), this.maxJoystickDistance);
        const angle = Math.atan2(offsetY, offsetX);
        const joystickX = Math.cos(angle) * distance;
        const joystickY = Math.sin(angle) * distance;
        const strafe = THREE.MathUtils.clamp(joystickX / this.maxJoystickDistance, -1, 1);
        const forward = THREE.MathUtils.clamp(-joystickY / this.maxJoystickDistance, -1, 1);

        this.joystickThumb.style.transform = `translate(${joystickX}px, ${joystickY}px)`;
        this.player.setTouchMovement(strafe, forward);
    }

    resetJoystick() {
        this.joystickPointerId = null;
        this.joystick.classList.remove('active');
        this.joystickThumb.style.transform = 'translate(0px, 0px)';
        this.player.setTouchMovement(0, 0);
    }

    applyLookDelta(deltaX, deltaY) {
        const lookSpeed = 0.002 * (this.settings.get('mouseSensitivity') / 2);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y -= deltaX * lookSpeed;
        this.camera.rotation.x -= deltaY * lookSpeed;
        this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x, -Math.PI / 2, Math.PI / 2);
    }

    updateToolIndicator(label) {
        const nextText = label ? `Tool: ${label}` : 'Tool: Free look';
        if (nextText === this.currentToolText) return;
        this.currentToolText = nextText;
        this.toolIndicator.textContent = nextText;
    }

    updateInteractionState(interaction) {
        if (!this.isVisible) return;

        const isAvailable = Boolean(interaction?.available);
        const prompt = interaction?.prompt || '';
        const actionLabel = interaction?.actionLabel || 'Interact';
        const statusLabel = interaction?.statusLabel || 'FIELD MODE';
        const nextSignature = `${isAvailable}|${prompt}|${actionLabel}|${statusLabel}`;

        if (nextSignature === this.currentInteractionSignature) return;

        this.currentInteractionSignature = nextSignature;
        this.interactButton.disabled = !isAvailable;
        this.interactButton.classList.toggle('available', isAvailable);
        this.interactPrompt.textContent = prompt;
        this.interactButton.textContent = actionLabel;
        this.statusIndicator.textContent = statusLabel;
    }

    markTutorialSeen() {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
        this.hideTutorial();
    }

    hideTutorial() {
        this.tutorial.classList.remove('visible');
    }
}
