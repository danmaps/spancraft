# Spancraft Feature Roadmap & Prioritization

**Project Vision:** An engaging Minecraft-inspired electrical grid planning game that combines creative building with realistic power infrastructure challenges.

**Last Updated:** December 4, 2025

---

## Priority Matrix Legend
- **Impact:** How much this improves player engagement (1-5)
- **Feasibility:** Technical ease of implementation (1-5, higher = easier)
- **Value Add:** Strategic importance to core gameplay (1-5)
- **Effort:** Development time estimate (S=Small, M=Medium, L=Large, XL=Extra Large)

---

## 🔴 HIGH PRIORITY - Core Gameplay Polish

### 1. Enhanced Challenge Mode Budget System
**Current State:** ✅ IMPLEMENTED - Dynamic pricing with stars rating system

**Impact:** 5/5 | **Feasibility:** 4/5 | **Value Add:** 5/5 | **Effort:** M

**Features Implemented:**
- **Dynamic Pricing Model** ✅
  - Pole height affects cost (exponential penalty for tall poles)
  - Terrain difficulty multipliers (slope-based pricing)
  - Span length cost curves (optimal spans cheaper than extreme spans)
  
- **Cost Breakdown UI** ✅
  - Real-time cost calculator showing spent/remaining
  - Budget usage percentage display
  - Color-coded budget warnings (green/orange/red)
  - Cost refunds on block/conductor removal
  
- **Stars Rating System** ✅
  - 3 stars: Stay under or at budget (0-100% usage)
  - 2 stars: Go over budget slightly (100-150% usage)
  - 1 star: Significantly over budget (>150% usage)
  
- **Completion Screen** ✅
  - Shows final star rating (★★★ format)
  - Displays budget status and usage percentage
  - "Try Again" and "Exit" buttons for challenge restart

**Implementation Details:**
- `calculateBlockCost(position)`: Calculates individual block costs based on height and terrain slope
- `calculateConductorCost(fromPos, toPos)`: Prices conductors based on span distance efficiency
- `calculateStars()`: Determines star rating based on budget usage percentage
- `showCompletionScreen()`: Displays completion UI with star rating and options
- Real-time UI updates with spent/remaining display
- Challenge completes when grid is powered (substation to customer connection established)

---

### 2. Diverse Challenge Scenarios
**Current State:** Single substation-to-customer challenge

**Impact:** 5/5 | **Feasibility:** 4/5 | **Value Add:** 5/5 | **Effort:** L

**Challenge Types:**
1. **Point-to-Point** (Tutorial)
   - Single span, flat terrain
   - Teaches basic wire placement

2. **Valley Crossing** 
   - Substation and customer on opposite hilltops
   - Requires tall mid-span pole or creative routing

3. **Urban Grid**
   - Multiple customers (3-5 houses)
   - Must power all within budget
   - Teaches distribution planning

4. **Obstacle Course**
   - Pre-placed buildings/trees to route around
   - Cannot demolish existing structures
   - Tests pathfinding and creativity

5. **River Crossing**
   - Water terrain blocks (cannot place poles in water)
   - Long spans with clearance requirements
   - Introduces transmission tower concepts

6. **Mountain Pass**
   - Extreme elevation changes
   - Ice/snow terrain types affecting costs
   - Weather effects (wind sway visualization)

7. **Storm Damage Repair**
   - Pre-existing grid with broken connections
   - Repair under strict budget
   - Time pressure element

8. **Efficiency Challenge**
   - Unlimited budget but scored on cost
   - Leaderboard for optimal solutions
   - Multiple valid solutions possible

**Implementation Notes:**
- Create `challenges/` directory with JSON scenario definitions
- Each scenario includes: terrain seed, start positions, win conditions, budget, obstacles
- Challenge selector UI menu
- Progress tracking and unlock system
- Star rating system (1-3 stars based on efficiency)

---

### 3. Terrain Types & Biomes
**Current State:** Simple perlin noise terrain, single material (dirt)

**Impact:** 4/5 | **Feasibility:** 5/5 | **Value Add:** 4/5 | **Effort:** M

**Biome Types:**

**Urban**
- Concrete/asphalt surface textures
- Pre-placed building obstacles (houses, shops, warehouses)
- Street grid layout hints
- Higher pole placement costs (permits, complexity)
- Cannot place poles inside buildings
- Aesthetic: Gray/blue color palette

**Rural**
- Grass and farmland textures
- Rolling hills, open spaces
- Lower pole costs
- Tree obstacles (see Tree System below)
- Aesthetic: Green/brown natural colors

**Industrial**
- Factory buildings and warehouses
- High power demand customers
- Wider pole spacing allowed
- Metal/concrete textures
- Aesthetic: Dark grays, steel tones

**Forest**
- Dense tree coverage
- Requires clearing or routing around
- Increased pole costs (access difficulty)
- Rich green foliage textures
- Wildlife ambiance (audio)

**Mountain/Alpine**
- Rock and snow textures
- Extreme elevation changes
- Rock face obstacles
- Avalanche zones (restricted areas)
- Aesthetic: Whites, grays, ice blues

**Desert**
- Sand texture
- Flat terrain (easier spans)
- Extreme heat effect (visual distortion)
- Cacti and rock formations
- Aesthetic: Yellows, oranges, browns

**Implementation Notes:**
- Extend `World.js` getHeight() with biome selection
- Create biome-specific texture packs
- Add biome metadata to world generation
- Implement cost multipliers per biome
- Procedural building placement for urban zones

---

## 🟡 MEDIUM PRIORITY - Minecraft-Inspired Features

### 4. Tree Generation & Management
**Current State:** No vegetation

**Impact:** 4/5 | **Feasibility:** 4/5 | **Value Add:** 3/5 | **Effort:** M

**Features:**
- **Procedural Tree Generation**
  - Multiple tree types (oak, pine, birch matching biomes)
  - Trunk (brown log blocks) + Foliage (green leaf blocks)
  - Height variation (3-7 blocks tall)
  - Clustered placement in forests, sparse in rural
  
- **Tree Interaction**
  - Trees block conductor paths (collision detection)
  - Player can chop down trees (multiple clicks, Minecraft style)
  - Chopping costs time or resources in challenge mode
  - Tree removal yields wood blocks for building
  - Replanting mechanic (sapling items)

- **Visual Enhancement**
  - Billboard leaf sprites for performance
  - Swaying animation in wind
  - Seasonal color variation (fall leaves)
  - Shadow casting for atmosphere

**Implementation Notes:**
- Create `trees.js` module
- L-system or template-based generation
- Add to world generation after terrain
- Integrate with collision system
- Tree removal adds to player inventory

---

### 5. Player Hand & Inventory System
**Current State:** Block selection via number keys, infinite blocks

**Impact:** 3/5 | **Feasibility:** 4/5 | **Value Add:** 3/5 | **Effort:** M

**Features:**
- **First-Person Hand Model**
  - Visible hand holding current tool/block
  - Minecraft-style arm animation
  - Swing animation when placing/removing
  - Different models per block type
  
- **Inventory Management**
  - Limited inventory slots (Challenge Mode)
  - Must gather resources to build
  - Hotbar UI (1-9 keys)
  - Inventory screen (E key, Minecraft style)
  - Stack quantities displayed
  
- **Resource Gathering**
  - Breaking blocks adds to inventory
  - Pick up items from ground (drop physics)
  - Crafting system (e.g., 4 wood → 1 pole)
  - Storage chests for extra items

- **Tools System**
  - Pliers for wire work (faster conductor placement)
  - Axe for chopping trees
  - Shovel for terrain modification
  - Wrench for pole adjustment
  - Tool durability (repair/replace)

**Implementation Notes:**
- 3D hand model with rigged animations
- Inventory state management class
- UI overlay for inventory grid
- Item pickup collision detection
- Recipe system for crafting

**Challenge Mode Balance:**
- Free Build: Unlimited resources (current behavior)
- Challenge Mode: Limited starting inventory, must manage wisely

---

### 6. Advanced Block Mechanics
**Current State:** Basic block placement/removal

**Impact:** 3/5 | **Feasibility:** 3/5 | **Value Add:** 3/5 | **Effort:** L

**Features:**
- **Block Variants**
  - Slab blocks (half-height)
  - Stair blocks (angled)
  - Fence blocks (thin connectors)
  - Platform blocks (walkable, no sides)
  
- **Redstone-Inspired Power System**
  - Visual power flow through wires
  - Powered vs unpowered pole indicators (LED lights)
  - Power switches and circuit breakers
  - Power meter blocks showing load
  - Fuse blocks that break on overload
  
- **Structural Integrity**
  - Poles need support (cannot float)
  - Span tension limits (max distance without mid-support)
  - Guy-wire supports for tall poles
  - Foundation blocks for soft terrain

**Implementation Notes:**
- Extend block type system significantly
- Physics simulation for structural checks
- Particle effects for power visualization
- Warning system for unstable structures

---

## 🟢 LOWER PRIORITY - Advanced Features

### 7. GIS Data Integration
**Current State:** Procedural terrain only

**Impact:** 4/5 | **Feasibility:** 2/5 | **Value Add:** 5/5 | **Effort:** XL

**Features:**
- **Import Real-World Terrain**
  - Load elevation data (GeoTIFF, DEM files)
  - Lat/Long to game coordinate conversion
  - Scale adjustment (1 block = X meters)
  - Real-world location selector (map interface)
  
- **Coordinate System**
  - Display lat/long on minimap
  - GPS-style navigation
  - Real elevation displayed in meters/feet
  - Compass with true north
  
- **Scenario Builder**
  - Import existing power line locations
  - Mark actual substation/customer positions
  - Historical storm damage scenarios
  - Real utility company data (anonymized)
  
- **Export Capabilities**
  - Export player designs to KML/GeoJSON
  - Generate BOM (Bill of Materials) with real-world specs
  - Cost estimates using real pricing data
  - Engineering reports (span charts, sag tables)

**Implementation Notes:**
- Requires GIS library integration (turf.js, proj4)
- Heightmap conversion algorithms
- File upload/download UI
- Data sanitization and processing
- Educational/professional mode toggle

**Use Cases:**
- **Educational:** Students practice on real terrain
- **Professional Training:** Utility workers learn planning
- **Disaster Response:** Model emergency repairs
- **Community Planning:** Visualize impact of new lines

**Challenges:**
- Large data processing (optimization needed)
- Coordinate system complexity
- Copyright/licensing of map data
- Accuracy vs gameplay balance

---

### 8. Multiplayer Collaboration
**Current State:** Single player only

**Impact:** 5/5 | **Feasibility:** 1/5 | **Value Add:** 4/5 | **Effort:** XL

**Features:**
- **Co-op Building**
  - 2-4 players in same world
  - Shared budget in challenge mode
  - Real-time synchronization
  - Player name tags and avatars
  
- **Competitive Mode**
  - Race to complete challenge first
  - Lowest cost wins
  - Sabotage prevention (block stealing disabled)
  - Leaderboards and rankings
  
- **Persistent Worlds**
  - Save shared world states
  - World hosting (peer-to-peer or server)
  - Permission system (build rights)
  - Chat and voice communication

**Implementation Notes:**
- WebRTC or WebSocket networking
- State synchronization protocol
- Conflict resolution (simultaneous edits)
- Hosting infrastructure costs
- Anti-cheat and moderation

---

### 9. Weather & Environmental Effects
**Current State:** Static environment

**Impact:** 3/5 | **Feasibility:** 3/5 | **Value Add:** 2/5 | **Effort:** M

**Features:**
- **Dynamic Weather**
  - Rain (conductor clearance reduced)
  - Snow (weight on wires, increased sag)
  - Wind (wire sway animation)
  - Fog (visibility reduction)
  - Lightning (hazard in storms)
  
- **Day/Night Cycle**
  - Sun position affects shadows
  - Nighttime reduces visibility
  - Pole lights activate at night
  - Wildlife sounds (ambient)
  
- **Seasonal Changes**
  - Spring: Green, rainy
  - Summer: Bright, dry
  - Fall: Orange leaves, moderate
  - Winter: Snow, ice loading on wires

**Implementation Notes:**
- Skybox shader system
- Particle systems for precipitation
- Dynamic lighting adjustments
- Audio system for ambiance

---

### 10. Tutorial & Learning System
**Current State:** No in-game guidance

**Impact:** 5/5 | **Feasibility:** 4/5 | **Value Add:** 4/5 | **Effort:** M

**Features:**
- **Interactive Tutorial**
  - Step-by-step challenge introduction
  - Tooltips and highlights
  - Practice mode with guided tasks
  - Achievement system (gamification)
  
- **Educational Content**
  - Popup info cards (clearance rules, safety codes)
  - Mini-lessons on electrical engineering
  - Real-world examples and case studies
  - Links to NESC (National Electrical Safety Code)
  
- **Hints System**
  - Optional hints in challenges
  - Show optimal solution after failure
  - Cost-saving tips
  - Best practices guidance

**Implementation Notes:**
- Tooltip UI system
- State tracking for tutorial progress
- Modal dialogs for lessons
- Gamification point system

---

## 🔵 POLISH & UX IMPROVEMENTS

### 11. Enhanced UI/UX
**Impact:** 4/5 | **Feasibility:** 4/5 | **Value Add:** 3/5 | **Effort:** M

**Features:**
- **Better Minimap**
  - Zoom levels
  - Objective markers
  - Topographic lines showing elevation
  - Clickable waypoint setting
  
- **Build Mode UI**
  - Measurement tool (show span distance)
  - Angle measurement (wire approach angle)
  - Clearance preview (before placement)
  - Undo/Redo stack (Ctrl+Z)
  
- **Settings Menu**
  - Graphics quality (LOD settings)
  - Control remapping
  - Audio volume sliders
  - Accessibility options (colorblind modes)
  
- **Achievement Notifications**
  - Toast notifications for milestones
  - Progress bars for challenges
  - Stat tracking (total poles placed, wires run)

---

### 12. Audio System
**Impact:** 3/5 | **Feasibility:** 5/5 | **Value Add:** 2/5 | **Effort:** S

**Features:**
- **Sound Effects**
  - Block placement/removal sounds
  - Footsteps (terrain-specific)
  - Wire "snap" connection sound
  - Electrical hum near powered lines
  - Ambient environment noises
  
- **Music**
  - Calm background music (free build)
  - Tension music (challenge mode)
  - Victory jingle (challenge complete)
  - Volume controls

---

### 13. Performance Optimization
**Impact:** 4/5 | **Feasibility:** 3/5 | **Value Add:** 4/5 | **Effort:** M-L

**Features:**
- **Rendering Optimizations**
  - Frustum culling (don't render off-screen)
  - Level-of-detail (LOD) system
  - Occlusion culling (hidden blocks)
  - Instanced rendering for repeated objects
  
- **World Streaming**
  - Load/unload terrain chunks dynamically
  - Larger world sizes possible
  - Reduce memory footprint
  
- **Mobile Support**
  - Touch controls
  - Reduced polygon counts
  - Lower resolution textures
  - Battery optimization

---

## 📊 Recommended Implementation Order

### Phase 1: Gameplay Foundation (1-2 months)
1. **Enhanced Budget System** - Makes current challenge mode actually engaging
2. **Diverse Challenge Scenarios** - Provides progression and replayability
3. **Terrain Types & Biomes** - Visual variety and strategic depth

### Phase 2: Minecraft Feel (1-2 months)
4. **Tree System** - Obstacles and resource gathering
5. **Player Hand & Inventory** - Tactile feedback and resource management
6. **Tutorial System** - Onboarding for new players

### Phase 3: Advanced Features (2-3 months)
7. **Audio System** - Quick win for immersion
8. **UI/UX Improvements** - Quality of life
9. **Weather & Environmental Effects** - Atmosphere and challenge variety
10. **Advanced Block Mechanics** - Depth for advanced players

### Phase 4: Professional/Educational (3-6 months)
11. **GIS Data Integration** - Opens educational/professional market
12. **Performance Optimization** - Support larger worlds and more players
13. **Multiplayer** - Community building (if resources allow)

---

## 🎯 Quick Wins (Implement First)

1. **Better Budget Display** (1 day)
   - Add cost breakdown panel
   - Real-time spent/remaining display
   - Simple impact, high value

2. **Valley Challenge** (2 days)
   - Reuse existing terrain gen with different seed
   - Place substation/customer on hills
   - Tests existing mechanics

3. **Grass Texture** (1 day)
   - Replace dirt with grass on top layer
   - Instant visual improvement
   - Easy texture swap

4. **Sound Effects** (2-3 days)
   - Find free SFX library
   - Add to placement/removal
   - Major immersion boost

5. **Minimap Improvements** (2 days)
   - Add objective markers
   - Show player facing direction
   - Better visual clarity

---

## 💡 Innovation Ideas (Future Exploration)

- **VR Support** - Immersive pole climbing, wire installation
- **Drone View** - Survey mode for planning
- **Time-Lapse Mode** - Watch construction progress
- **Damage Simulation** - Storm/earthquake effects on grid
- **Load Balancing Mini-Game** - Manage power flow in real-time
- **Substation Management** - Transformer configuration puzzle
- **Crew Management** - Hire AI workers, assign tasks
- **Permit System** - Navigate bureaucracy (regulatory education)
- **Environmental Impact** - Tree removal penalties, wildlife considerations
- **Community Feedback** - NPC reactions to pole placement (NIMBY simulation)

---

## 📈 Success Metrics

**Engagement:**
- Average session length > 15 minutes
- Challenge completion rate > 60%
- Return player rate > 40%

**Educational Value:**
- Players learn basic clearance requirements
- Understand cost-benefit tradeoffs
- Can explain span/sag relationships

**Technical:**
- 60 FPS on mid-range hardware
- < 3 second load times
- Zero critical bugs in challenge mode

---

## 🤝 Community & Feedback

**Potential User Testing:**
- Utility company training departments
- Engineering students
- Minecraft community (crossover appeal)
- Game jam showcases

**Feedback Channels:**
- GitHub Issues for bug reports
- Discord server for community
- In-game feedback form
- YouTube devlog series

---

*This roadmap is a living document. Priorities may shift based on user feedback, technical discoveries, and available development time.*
