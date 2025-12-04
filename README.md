# Spancraft

A Minecraft-inspired voxel world builder with power line engineering tools, built with Three.js.

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
- Coming soon: Conductor wires with catenary physics


## Controls

### Movement
- **WASD** or **Arrow Keys** - Move around
- **Mouse** - Look around (click to lock pointer)
- **Space** - Jump (or fly up when in flying mode)
- **Shift** - Fly down (when in flying mode)
- **F** - Toggle flying mode

### Building
- **Left Click** - Remove block/pole
- **Right Click** - Place block/pole
- **1-8 Keys** - Select block type
  - 1: Dirt
  - 2: Stone
  - 3: Wood Planks
  - 4: Cobblestone
  - 5: Brick
  - 6: Grass Block
  - 7: Wood Pole
  - 8: Metal Pole

### Utility Poles
- **Press 7** for wood poles, **Press 8** for metal poles
- Right-click to place pole blocks (single block height)
- Stack poles vertically by placing on top of each other
- Left-click to remove individual pole blocks
- Thin profile (0.3 blocks) for realistic appearance

## How to Run

1. Run `python3 -m http.server` in the root directory
2. Open http://localhost:8000 in your browser
3. Click to lock the pointer and start building!
