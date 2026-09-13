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

### Challenge Mode - Scenario System
- **Multiple Scenarios** - Different challenges teaching various aspects of grid management
  - **Basic Connection** - Connect substation to customer (tutorial)
  - **Lightning Strike Pole Replacement** - Repair damaged infrastructure under time pressure
  - More scenarios coming soon (see CHALLENGE_SCENARIOS.md)
- **Dynamic Budget System** - Costs vary based on terrain difficulty, pole height, and span length
- **Star Rating System** - Earn 1-3 stars based on efficiency (time and budget)
- **Time-Limited Challenges** - Race against the clock in repair scenarios
- **Power Flow Simulation** - Complete circuits to energize customers

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
- **Mobile-sized viewport or coarse pointer device** - Left joystick moves, right side drags to look, **Jump** jumps, **Inspect** triggers context-sensitive field interaction

### Building
- **Left Click** - Remove block/pole/wire
- **Right Click** - Place block/pole or select pole for wiring
- **Scroll Wheel** - Select block type

## Mobile Field Mode Prototype

Spancraft now includes a mobile-sized first-person Field Mode prototype layered onto the existing free-roam scene without changing desktop keyboard/mouse play.

### Action map

- **Move zone:** lower-left translucent virtual joystick drives the same player movement state used by keyboard input
- **Look zone:** the right side of the screen is a dedicated drag region for first-person camera look
- **Jump:** lower-right jump button
- **Interact:** lower-right context button that only enables when the centered raycast can inspect the prototype field object
- **Status:** top-left Field Mode chip plus the currently selected tool/block indicator
- **Tutorial:** first-use callout for move, look, jump, and inspect

### Touch zones and responsive layout

- The mobile HUD appears automatically on mobile-sized viewports and coarse pointers
- Controls respect `env(safe-area-inset-*)` so they stay clear of notches and home indicators
- The center of the screen stays clear except for the existing crosshair and contextual inspect prompt
- Portrait, landscape, and tablet widths share the same HUD, with the right-side look region expanding across the non-joystick play area

### Current prototype assumptions

- “Field Mode” currently maps to the existing first-person free-roam scene
- Desktop pointer-lock building controls remain unchanged
- The prototype interaction target is a nearby survey marker used to validate touch targeting and inspect/use flow before deeper field-object mechanics are added

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
3. On desktop, click to lock the pointer and start building
4. On a mobile-sized viewport, the touch HUD appears automatically for joystick/look/jump/inspect play
