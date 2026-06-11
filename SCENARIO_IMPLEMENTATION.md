# Lightning Strike Scenario Implementation Summary

## Overview
Implemented a scenario system for SpanCraft that allows players to choose from different challenge scenarios, starting with the "Lightning Strike Pole Replacement" scenario alongside the existing basic connection challenge.

## Files Created

### `js/scenarios.js`
New module containing:
- **SCENARIOS object**: Defines all available scenarios (basic, lightningStrike)
- **ScenarioManager class**: Manages scenario lifecycle, timing, scoring, and power outage tracking
- **generateLightningStrikeGrid()**: Creates pre-built grid with damaged pole for repair scenarios
- **createScenarioPickerUI()**: Displays scenario selection menu

## Files Modified

### `js/challengeMode.js`
- Added `currentScenario` and `prebuiltGrid` properties
- Updated `start()` to accept optional scenario parameter
- Added `setPrebuiltGrid()` to handle prebuilt grid structures
- Split building creation into `createSubstationBuilding()` and `createCustomerBuilding()`
- Updated `updateUI()` to accept `scenarioManager` parameter and display time remaining for timed scenarios

### `js/main.js`
- Imported scenario system modules
- Added `scenarioManager` global variable
- Updated challenge button to show scenario picker UI
- Updated `startChallengeMode()` to:
  - Accept `scenarioId` parameter
  - Load scenario configuration
  - Generate prebuilt grids for scenarios that need them
  - Show scenario briefing before starting
- Added `showScenarioBriefing()`: Displays scenario description, objectives, and start button
- Added `showTimeExpiredScreen()`: Handles time limit failures
- Updated animate loop to:
  - Update UI with current time for timed scenarios
  - Check for time expiration
  - Track power status changes for outage duration
  - Calculate stars using scenarioManager when scenario is active

## Features Implemented

### Scenario Selection System
- Players click "Challenge Mode" to see scenario picker
- Two scenarios available:
  1. **Basic Connection** (existing): Connect substation to customer
  2. **Lightning Strike Pole Replacement** (new): Repair damaged grid under time pressure

### Lightning Strike Scenario
- **Pre-built Grid**: 5 poles in a line (substation → 3 poles → customer)
- **Damaged Pole**: Middle pole is visually marked (red glow) and creates a break in the power line
- **Two Broken Connections**: The damaged pole breaks conductors on both sides
- **Budget**: $5,000 (half of basic scenario)
- **Time Limit**: 5 minutes (300 seconds)
- **Timer Display**: Shows remaining time in MM:SS format with color coding (green → yellow → red)

### Scenario Briefing
- Displays before scenario starts
- Shows:
  - Scenario name and description
  - List of objectives
  - Budget and time limit
  - Start button to begin

### Time-Based Scoring
- Lightning Strike uses combined time + budget scoring
- **3 stars**: Complete under 2 minutes + under 80% budget
- **2 stars**: Complete under 3 minutes + under 90% budget
- **1 star**: Complete under 4 minutes OR under 100% budget
- Time expired = automatic failure with retry option

### Outage Tracking
- ScenarioManager tracks when power is lost/restored
- Records total outage duration
- Foundation for future scenarios that penalize extended outages

## Game Flow

1. Player clicks "Challenge Mode" button
2. Scenario picker UI appears with cards for each scenario
3. Player selects a scenario
4. Scenario briefing appears with objectives
5. Player clicks "Start" button
6. Grid loads (prebuilt for lightning strike, empty for basic)
7. Timer starts (for timed scenarios)
8. Player completes objectives
9. Completion screen shows stars and stats

## Technical Design

### Composition Over Inheritance
- ChallengeMode accepts scenario configurations rather than being subclassed
- Scenarios are data-driven (JSON-like objects)
- Easy to add new scenarios without modifying ChallengeMode

### Scenario Definition Structure
```javascript
{
  id: 'scenarioId',
  name: 'Display Name',
  description: 'Player-facing description',
  difficulty: 1-5, // Star rating
  category: 'Tutorial|Repair|etc',
  budget: 10000,
  timeLimit: 300, // Optional
  objectives: ['list', 'of', 'goals'],
  setup: {
    type: 'scenarioType',
    createPrebuiltGrid: true/false
  },
  scoring: { ... } // Optional custom scoring
}
```

### ScenarioManager Responsibilities
- Load scenario definitions
- Track elapsed time and remaining time
- Track power outage durations
- Calculate scenario-specific star ratings
- Provide completion data

## Future Extensibility

This implementation provides the foundation for all 8 planned scenarios:
1. ✅ Lightning Strike Pole Replacement (implemented)
2. Vegetation Clearance Inspection Failure
3. New Customer Substation (Growth)
4. Replace Conductor with Converted Conductor
5. Targeted Undergrounding After Fire
6. Emergency Backfeed During Upstream Failure
7. Temporary Service for Construction/Events
8. Audit and Compliance

Each new scenario requires:
1. Add definition to SCENARIOS object
2. Implement grid generation function (if prebuilt)
3. Add scenario-specific logic to ScenarioManager (if needed)
4. No changes to ChallengeMode required

## Testing Notes

To test the implementation:
1. Start local server: `python -m http.server 8000`
2. Open http://localhost:8000
3. Click "Challenge Mode" button
4. Verify scenario picker appears
5. Select "Lightning Strike Pole Replacement"
6. Verify briefing shows correct info
7. Click "Start" and verify:
   - Pre-built grid appears with damaged pole (red glow)
   - Timer counts down in top UI
   - Player can remove damaged pole and rebuild
   - Wires can be reconnected
   - Completion triggers when power restored
   - Stars awarded based on time + budget

## Known Limitations

1. Damaged pole is visually marked but not mechanically broken (can still conduct if wired)
2. No tutorial/hints for first-time players
3. No scenario progression/unlocking system
4. Completion screen doesn't show time-specific stats yet
5. No leaderboard or best time tracking

These can be addressed in future iterations.
