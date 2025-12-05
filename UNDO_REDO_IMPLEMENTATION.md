# Undo/Redo System Implementation

## Overview
A complete undo/redo system has been implemented for Spancraft with full action tracking, keyboard shortcuts, and console logging of all operations.

## Features

### Keyboard Shortcuts
- **Ctrl-Z** (or Cmd-Z on Mac): Undo last action
- **Ctrl-Y** (or Cmd-Y on Mac): Redo last undone action

### Tracked Actions
The system tracks the following operations:
1. **block-place** - When a block/pole is placed
   - Records: position (x, y, z), block type
   - Undo: Removes the block from the scene and world
   - Redo: Re-places the block

2. **block-remove** - When a block/pole is removed
   - Records: position (x, y, z), block type
   - Undo: Restores the block to its original position
   - Redo: Re-removes the block

3. **conductor-place** - When a wire/conductor is placed
   - Records: from position, to position
   - Undo: Removes the conductor wire
   - Redo: Re-creates the conductor wire

4. **conductor-remove** - When a wire/conductor is removed
   - Records: from position, to position
   - Undo: Re-creates the conductor wire
   - Redo: Re-removes the conductor wire

## Console Logging

When you press Ctrl-Z or Ctrl-Y, the browser console displays:
```
[RECORDED] ACTION_TYPE details | Undo: X | Redo: Y
[UNDO] Reversing action: {type, position, ...}
[UNDO] Removed block-place at (x, y, z)
[REDO] Re-placed block-place TYPE at (x, y, z)
```

Examples:
```
[RECORDED] block-place details | Undo: 1 | Redo: 0
[RECORDED] conductor-place details | Undo: 2 | Redo: 0
[UNDO] Removed block-place at (0, 5, -3)
[UNDO] Restored conductor-place from (2, 4, 1) to (5, 4, -2)
[REDO] Re-removed conductor-remove from (2, 4, 1) to (5, 4, -2)
```

## Technical Implementation

### Files Modified

**js/main.js**
- Added `import { ActionHistory }` at the top
- Added `let actionHistory` variable initialization
- Initialize ActionHistory in `init()` function
- Added Ctrl-Z and Ctrl-Y keyboard event listeners
- Added `executeUndo(action)` function - reverses world state changes
- Added `executeRedo(action)` function - reapplies world state changes
- Added 5 `actionHistory.recordAction()` calls in `setupInteraction()`:
  1. Conductor removal (line 264)
  2. Block removal (line 311)
  3. Conductor placement (line 376)
  4. Pole placement (line 444)
  5. Regular block placement (line 461)

**js/actionHistory.js** (Created)
- `ActionHistory` class with full undo/redo support
- Max history size: 100 items (prevents memory issues)
- Methods: `recordAction()`, `undo()`, `redo()`, `logAction()`
- All operations logged to browser console with coordinates and stack info

### Action Object Structure
```javascript
// Block placement/removal
{
  type: 'block-place' | 'block-remove',
  blockType: 'wood_pole' | 'metal_pole' | 'dirt' | etc.,
  position: Vector3 {x, y, z}
}

// Conductor placement/removal
{
  type: 'conductor-place' | 'conductor-remove',
  fromPos: Vector3 {x, y, z},
  toPos: Vector3 {x, y, z}
}
```

## Testing

### How to Test
1. Open the game in your browser at http://localhost:8000
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the Console tab
4. Place some blocks and wires
5. Press Ctrl-Z to undo - watch blocks/wires disappear
6. Press Ctrl-Y to redo - watch them reappear
7. Check console for detailed logging of each action

### Expected Console Output
```
[RECORDED] block-place details | Undo: 1 | Redo: 0
[RECORDED] conductor-place details | Undo: 2 | Redo: 0
[UNDO] Removed block-place at (0, 5, -3)
[UNDO] Removed conductor-place from (2, 4, 1) to (5, 4, -2)
[REDO] Re-placed block-place dirt at (0, 5, -3)
[REDO] Re-placed conductor-place from (2, 4, 1) to (5, 4, -2)
```

## Limitations & Future Enhancements

### Current Limitations
- Challenge Mode costs are NOT automatically adjusted during undo/redo (intentional - preserves challenge state)
- Undo/redo cannot be performed during Challenge Mode completion screen
- History is cleared when you start a new game

### Potential Future Enhancements
1. Visual undo/redo indicator on screen (e.g., "Undo: 5 actions available")
2. Action grouping (e.g., undo multiple rapid clicks as one action)
3. Action labels in console showing what was modified ("Built tower at X, Y, Z")
4. Integration with Challenge Mode to adjust budgets during undo/redo
5. Persistent action history (saved to browser localStorage)
6. Undo/redo for other operations (e.g., challenge setup changes)

## Troubleshooting

### Undo/redo not working?
1. Check browser console (F12) for any error messages
2. Verify Ctrl-Z and Ctrl-Y are not intercepted by your browser extensions
3. Ensure you've placed at least one block or wire (empty history can't undo)

### Blocks/wires not appearing after redo?
1. Check browser console for JavaScript errors
2. Verify the World and Scene objects are being updated correctly
3. Try pressing F5 to refresh and start over

### Performance degradation?
1. The history is limited to 100 items - this prevents excessive memory usage
2. If experiencing lag, clear history by refreshing the page
