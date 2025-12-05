export class Settings {
    constructor() {
        this.defaults = {
            worldSizeX: 40,
            worldSizeZ: 40,
            randomTerrain: true,
            terrainThickness: 3,
            movementSpeed: 20,
            mouseSensitivity: 2,
            renderDistance: 100
        };

        // Load settings from localStorage or use defaults
        this.current = this.load();
    }

    load() {
        const stored = localStorage.getItem('spancraft-settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new settings
                return { ...this.defaults, ...parsed };
            } catch (e) {
                console.error('Failed to load settings:', e);
                return { ...this.defaults };
            }
        }
        return { ...this.defaults };
    }

    save(newSettings) {
        this.current = { ...this.current, ...newSettings };
        localStorage.setItem('spancraft-settings', JSON.stringify(this.current));
    }

    get(key) {
        return this.current[key];
    }

    getAll() {
        return { ...this.current };
    }

    reset() {
        this.current = { ...this.defaults };
        localStorage.removeItem('spancraft-settings');
    }
}

export function initSettingsUI(settings, onApply) {
    const modal = document.getElementById('settings-modal');
    const toggleBtn = document.getElementById('settings-toggle');
    const cancelBtn = document.getElementById('settings-cancel');
    const applyBtn = document.getElementById('settings-apply');

    // Get input elements
    const inputs = {
        worldSizeX: document.getElementById('setting-world-size-x'),
        worldSizeZ: document.getElementById('setting-world-size-z'),
        randomTerrain: document.getElementById('setting-random-terrain'),
        terrainThickness: document.getElementById('setting-terrain-thickness'),
        movementSpeed: document.getElementById('setting-movement-speed'),
        mouseSensitivity: document.getElementById('setting-mouse-sensitivity'),
        renderDistance: document.getElementById('setting-render-distance')
    };

    // Get value display elements
    const valueDisplays = {
        worldSizeX: document.getElementById('world-size-x-value'),
        worldSizeZ: document.getElementById('world-size-z-value')
    };

    // Update slider value displays
    inputs.worldSizeX.addEventListener('input', () => {
        valueDisplays.worldSizeX.textContent = inputs.worldSizeX.value;
    });
    inputs.worldSizeZ.addEventListener('input', () => {
        valueDisplays.worldSizeZ.textContent = inputs.worldSizeZ.value;
    });

    // Populate inputs with current settings
    function populateInputs() {
        const current = settings.getAll();
        inputs.worldSizeX.value = current.worldSizeX;
        inputs.worldSizeZ.value = current.worldSizeZ;
        valueDisplays.worldSizeX.textContent = current.worldSizeX;
        valueDisplays.worldSizeZ.textContent = current.worldSizeZ;
        inputs.randomTerrain.checked = current.randomTerrain;
        inputs.terrainThickness.value = current.terrainThickness;
        inputs.movementSpeed.value = current.movementSpeed;
        inputs.mouseSensitivity.value = current.mouseSensitivity;
        inputs.renderDistance.value = current.renderDistance;
    }

    // Open modal
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Release pointer lock if active
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        populateInputs();
        modal.classList.add('visible');
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('visible');
    }

    cancelBtn.addEventListener('click', closeModal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        } else {
            // Prevent clicks inside modal from propagating to document
            e.stopPropagation();
        }
    });

    // Apply settings
    applyBtn.addEventListener('click', () => {
        const newSettings = {
            worldSizeX: parseInt(inputs.worldSizeX.value),
            worldSizeZ: parseInt(inputs.worldSizeZ.value),
            randomTerrain: inputs.randomTerrain.checked,
            terrainThickness: parseInt(inputs.terrainThickness.value),
            movementSpeed: parseFloat(inputs.movementSpeed.value),
            mouseSensitivity: parseFloat(inputs.mouseSensitivity.value),
            renderDistance: parseFloat(inputs.renderDistance.value)
        };

        // Check if world settings changed (require reload)
        const current = settings.getAll();
        const needsReload = 
            newSettings.worldSizeX !== current.worldSizeX ||
            newSettings.worldSizeZ !== current.worldSizeZ ||
            newSettings.randomTerrain !== current.randomTerrain ||
            newSettings.terrainThickness !== current.terrainThickness;

        settings.save(newSettings);
        
        if (onApply) {
            onApply(newSettings);
        }

        closeModal();

        // Reload immediately if world settings changed
        if (needsReload) {
            window.location.reload();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('visible')) {
            closeModal();
        }
    });
}
