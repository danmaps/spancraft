export class ActionHistory {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 100; // Limit history to prevent memory issues
    }

    recordAction(action) {
        // Add action to undo stack
        this.undoStack.push(action);
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
        
        // Limit history size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
        
        // Log action
        this.logAction(action, 'RECORDED');
    }

    undo() {
        if (this.undoStack.length === 0) {
            console.log('[UNDO] Nothing to undo');
            return null;
        }
        
        const action = this.undoStack.pop();
        this.redoStack.push(action);
        
        this.logAction(action, 'UNDO');
        return action;
    }

    redo() {
        if (this.redoStack.length === 0) {
            console.log('[REDO] Nothing to redo');
            return null;
        }
        
        const action = this.redoStack.pop();
        this.undoStack.push(action);
        
        this.logAction(action, 'REDO');
        return action;
    }

    logAction(action, operation) {
        const posStr = action.position ? 
            `(${action.position.x}, ${action.position.y}, ${action.position.z})` : 
            'N/A';
        
        let logMessage = `[${operation}] ${action.type.toUpperCase()} `;
        
        switch (action.type) {
            case 'block-place':
                logMessage += `${action.blockType} at ${posStr}`;
                break;
            case 'block-remove':
                logMessage += `${action.blockType} from ${posStr}`;
                break;
            case 'conductor-place':
                logMessage += `from (${action.fromPos.x}, ${action.fromPos.y}, ${action.fromPos.z}) to (${action.toPos.x}, ${action.toPos.y}, ${action.toPos.z})`;
                break;
            case 'conductor-remove':
                logMessage += `from (${action.fromPos.x}, ${action.fromPos.y}, ${action.fromPos.z}) to (${action.toPos.x}, ${action.toPos.y}, ${action.toPos.z})`;
                break;
            default:
                logMessage += `at ${posStr}`;
        }
        
        logMessage += ` | Undo: ${this.undoStack.length} | Redo: ${this.redoStack.length}`;
        console.log(logMessage);
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }

    getStackStatus() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            totalActions: this.undoStack.length + this.redoStack.length
        };
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        console.log('[HISTORY] Cleared undo/redo history');
    }
}
