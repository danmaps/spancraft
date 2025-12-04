# Spancraft

A Minecraft-inspired voxel world builder with power line engineering tools, built with Three.js.

**[Play Spancraft on GitHub Pages](https://danmaps.github.io/spancraft/)**

## Features

### Building & Exploration
- Voxel-based world generation with varied terrain
- First-person controls (WASD + Mouse)
- **Flying mode** - Press F to toggle creative flight
- Multiple block types: Dirt, Stone, Wood, Cobblestone, Brick, Grass
- **Utility Poles** - Tall vertical structures for power line construction
- Block placement and removal (Right click / Left click)
- Jumping, collision detection, and realistic physics
- Dynamic lighting and shadows

### Power Line Engineering
- **Utility Pole System** - Two types of pole blocks for building power line structures
  - **Wood Poles** (key 7) - Traditional utility poles with brown wood texture
  - **Metal Poles** (key 8) - Modern steel poles with metallic finish
  - Single-block height - stack vertically to build tall structures
  - Thin profile (0.3 blocks wide) for realistic appearance
  - Place and remove like regular blocks
- **Conductor Wire System** (key 9) - Realistic power line spans with true catenary physics
  - Click on first pole, then click on second pole to create wire connection
  - Wires exhibit natural catenary sag (hyperbolic cosine curve)
  - Sag amount automatically calculated at 10% of horizontal span length
  - Physics-based curve uses Newton-Raphson solver for tension parameter
  - Red glow indicates clearance violation (wire intersecting terrain/poles)
  - Walkable wires - player passes through conductor without collision


## Controls

### Movement
- **WASD** or **Arrow Keys** - Move around
- **Mouse** - Look around (click to lock pointer)
- **Space** - Jump (or fly up when in flying mode)
- **Shift** - Fly down (when in flying mode)
- **F** - Toggle flying mode

### Building
- **Left Click** - Remove block/pole/wire
- **Right Click** - Place block/pole or select pole for wiring
- **Scroll Wheel** - Select block type

### Utility Poles
- Scroll to select wood poles or metal poles
- Right-click to place pole blocks (single block height)
- Stack poles vertically by placing on top of each other
- Left-click to remove individual pole blocks
- Thin profile (0.3 blocks) for realistic appearance

### Conductor Wires
- Scroll to select conductor wire mode
- **Right-click first pole** to start wire connection
- **Right-click second pole** to complete connection
- Wire automatically forms realistic catenary curve between poles
- Red glow warns of clearance violations
- Left-click wire to remove connection

## How to Run

1. Run `python3 -m http.server` in the root directory
2. Open http://localhost:8000 in your browser
3. Click to lock the pointer and start building!
