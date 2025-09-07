import { useState, useEffect, useCallback, useRef } from '@wordpress/element';

/**
 * Default keyboard shortcuts for Lexia Command
 */
const getDefaultShortcuts = () => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    
    return {
        openCommand: { 
            key: 'k', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult1: { 
            key: '1', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult2: { 
            key: '2', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult3: { 
            key: '3', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult4: { 
            key: '4', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult5: { 
            key: '5', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult6: { 
            key: '6', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult7: { 
            key: '7', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult8: { 
            key: '8', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
        selectResult9: { 
            key: '9', 
            meta: true, 
            ctrl: true, 
            alt: false, 
            shift: false 
        },
    };
};

/**
 * Validates a shortcut object
 * @param {Object} shortcut - The shortcut to validate
 * @returns {boolean} - Whether the shortcut is valid
 */
const isValidShortcut = (shortcut) => {
    if (!shortcut || typeof shortcut !== 'object') {
        return false;
    }
    
    const { key, meta, ctrl, alt, shift } = shortcut;
    
    // Must have a key
    if (!key || typeof key !== 'string') {
        return false;
    }
    
    // Must have at least one modifier, unless it's a special key
    const specialKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Escape'];
    const hasModifier = meta || ctrl || alt || shift;
    
    if (!hasModifier && !specialKeys.includes(key)) {
        return false;
    }
    
    return true;
};

/**
 * Checks if two shortcuts are the same
 * @param {Object} shortcut1 - First shortcut
 * @param {Object} shortcut2 - Second shortcut
 * @returns {boolean} - Whether shortcuts are identical
 */
const shortcutsMatch = (shortcut1, shortcut2) => {
    if (!shortcut1 || !shortcut2) return false;
    
    return (
        shortcut1.key === shortcut2.key &&
        Boolean(shortcut1.meta) === Boolean(shortcut2.meta) &&
        Boolean(shortcut1.ctrl) === Boolean(shortcut2.ctrl) &&
        Boolean(shortcut1.alt) === Boolean(shortcut2.alt) &&
        Boolean(shortcut1.shift) === Boolean(shortcut2.shift)
    );
};

/**
 * Loads custom shortcuts from localStorage
 * @returns {Object} - Custom shortcuts object
 */
const loadCustomShortcuts = () => {
    try {
        const stored = localStorage.getItem('lexia-command-shortcuts');
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn('Failed to load custom shortcuts:', error);
        return {};
    }
};

/**
 * Saves custom shortcuts to localStorage
 * @param {Object} customShortcuts - Custom shortcuts to save
 */
const saveCustomShortcuts = (customShortcuts) => {
    try {
        localStorage.setItem('lexia-command-shortcuts', JSON.stringify(customShortcuts));
    } catch (error) {
        console.warn('Failed to save custom shortcuts:', error);
    }
};

/**
 * Enhanced custom hook for managing keyboard shortcuts
 * Supports both legacy single shortcut mode and new multi-shortcut mode
 * @param {Object|Function} shortcutOrCallback - Either shortcut object (legacy) or callback function (new)
 * @param {Function} [legacyCallback] - Callback function when using legacy mode
 * @returns {Object|undefined} - Hook interface with shortcut management functions (new mode only)
 */
export function useKeyboardShortcut(shortcutOrCallback, legacyCallback) {
    // Detect if we're in legacy mode (shortcut object + callback) or new mode (just callback)
    const isLegacyMode = typeof shortcutOrCallback === 'object' && legacyCallback;
    const callback = isLegacyMode ? legacyCallback : shortcutOrCallback;
    const legacyShortcut = isLegacyMode ? shortcutOrCallback : null;
    
    const [shortcuts, setShortcuts] = useState(() => {
        if (isLegacyMode) return null; // Don't load shortcuts in legacy mode
        
        const defaults = getDefaultShortcuts();
        const custom = loadCustomShortcuts();
        
        console.log('🔑 useKeyboardShortcut: Loading shortcuts');
        console.log('🔑 Default shortcuts:', defaults);
        console.log('🔑 Custom shortcuts from localStorage:', custom);
        
        // Merge custom shortcuts with defaults, validating each custom shortcut
        const merged = { ...defaults };
        Object.entries(custom).forEach(([command, shortcut]) => {
            if (isValidShortcut(shortcut)) {
                console.log(`🔑 Applying custom shortcut for ${command}:`, shortcut);
                merged[command] = shortcut;
            } else {
                console.warn(`🔑 Invalid custom shortcut for ${command}:`, shortcut);
            }
        });
        
        console.log('🔑 Final merged shortcuts:', merged);
        return merged;
    });
    
    const callbackRef = useRef(callback);
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    
    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
    
    // Legacy mode handler
    const handleLegacyKeyDown = useCallback((event) => {
        if (!legacyShortcut) return;
        
        const isArrowKey = legacyShortcut.key === 'ArrowUp' || legacyShortcut.key === 'ArrowDown';
        const modifierKey = isMac ? event.metaKey : event.ctrlKey;
        const keyMatches = event.key.toLowerCase() === legacyShortcut.key.toLowerCase();

        console.log(`🔑 LEGACY: Key ${event.key} pressed, checking against ${legacyShortcut.key}`);

        // For arrow keys, only check if the key matches
        if (isArrowKey && keyMatches) {
            console.log(`🔑 LEGACY: Arrow key match for ${legacyShortcut.key}`);
            if (callbackRef.current) {
                callbackRef.current(event);
            }
            return;
        }

        // For other shortcuts, check if both the key and modifier match
        if (!isArrowKey && keyMatches && ((legacyShortcut.metaKey && modifierKey) || !legacyShortcut.metaKey)) {
            console.log(`🔑 LEGACY: Key match for ${legacyShortcut.key}`);
            if (callbackRef.current) {
                callbackRef.current(event);
            }
        }
    }, [legacyShortcut, isMac]);
    
    // New mode handler
    const handleKeyDown = useCallback((event) => {
        if (!shortcuts) return;
        
        const { key, metaKey, ctrlKey, altKey, shiftKey } = event;
        
        console.log(`🔑 Key pressed: ${key}, meta: ${metaKey}, ctrl: ${ctrlKey}, alt: ${altKey}, shift: ${shiftKey}`);
        
        // Check each shortcut to see if it matches the current event
        for (const [command, shortcut] of Object.entries(shortcuts)) {
            const keyMatches = shortcut.key.toLowerCase() === key.toLowerCase();
            const metaMatches = Boolean(shortcut.meta) === metaKey;
            const ctrlMatches = Boolean(shortcut.ctrl) === ctrlKey;
            const altMatches = Boolean(shortcut.alt) === altKey;
            const shiftMatches = Boolean(shortcut.shift) === shiftKey;
            
            console.log(`🔑 Checking ${command}: key=${keyMatches}, meta=${metaMatches}, ctrl=${ctrlMatches}, alt=${altMatches}, shift=${shiftMatches}`);
            console.log(`🔑 Expected for ${command}:`, shortcut);
            
            // For shortcuts with both meta and ctrl set to true, allow either meta OR ctrl to match
            // to support both Mac (Cmd+K) and Windows/Linux (Ctrl+K)
            if (shortcut.meta && shortcut.ctrl && keyMatches && altMatches && shiftMatches) {
                if (metaKey || ctrlKey) {
                    console.log(`🔑 MATCH! Executing ${command} (meta/ctrl mode)`);
                    if (callbackRef.current) {
                        callbackRef.current(command, event);
                    }
                    return;
                }
            }
            
            // For other shortcuts, require exact match
            if (keyMatches && metaMatches && ctrlMatches && altMatches && shiftMatches) {
                console.log(`🔑 MATCH! Executing ${command} (exact mode)`);
                if (callbackRef.current) {
                    callbackRef.current(command, event);
                }
                return;
            }
        }
        
        console.log('🔑 No matching shortcuts found');
    }, [shortcuts]);
    
    // Set up event listener
    useEffect(() => {
        const handler = isLegacyMode ? handleLegacyKeyDown : handleKeyDown;
        console.log(`🔑 Setting up event listener for ${isLegacyMode ? 'legacy' : 'new'} mode`);
        document.addEventListener('keydown', handler);
        return () => {
            console.log(`🔑 Removing event listener for ${isLegacyMode ? 'legacy' : 'new'} mode`);
            document.removeEventListener('keydown', handler);
        };
    }, [isLegacyMode, handleLegacyKeyDown, handleKeyDown]);
    
    // Return early for legacy mode (no management interface)
    if (isLegacyMode) {
        return;
    }
    
    // Update a specific shortcut
    const updateShortcut = useCallback((command, newShortcut) => {
        if (!isValidShortcut(newShortcut)) {
            console.warn('🔑 Invalid shortcut provided:', newShortcut);
            return;
        }
        
        console.log(`🔑 Updating shortcut for ${command}:`, newShortcut);
        
        const custom = loadCustomShortcuts();
        custom[command] = newShortcut;
        saveCustomShortcuts(custom);
        
        console.log('🔑 Saved to localStorage:', custom);
        
        setShortcuts(prev => {
            const updated = {
                ...prev,
                [command]: newShortcut
            };
            console.log('🔑 Updated shortcuts state:', updated);
            return updated;
        });
    }, []);
    
    // Reset shortcuts to defaults
    const resetShortcuts = useCallback(() => {
        saveCustomShortcuts({});
        setShortcuts(getDefaultShortcuts());
    }, []);
    
    // Reset a specific shortcut to default
    const resetShortcut = useCallback((command) => {
        const defaults = getDefaultShortcuts();
        const custom = loadCustomShortcuts();
        
        if (custom[command]) {
            delete custom[command];
            saveCustomShortcuts(custom);
        }
        
        if (defaults[command]) {
            setShortcuts(prev => ({
                ...prev,
                [command]: defaults[command]
            }));
        }
    }, []);
    
    // Export current shortcuts configuration
    const exportShortcuts = useCallback(() => {
        return loadCustomShortcuts();
    }, []);
    
    // Import shortcuts configuration
    const importShortcuts = useCallback((config) => {
        if (!config || typeof config !== 'object') {
            console.warn('Invalid shortcuts configuration');
            return;
        }
        
        const validConfig = {};
        Object.entries(config).forEach(([command, shortcut]) => {
            if (isValidShortcut(shortcut)) {
                validConfig[command] = shortcut;
            }
        });
        
        saveCustomShortcuts(validConfig);
        
        const defaults = getDefaultShortcuts();
        setShortcuts({
            ...defaults,
            ...validConfig
        });
    }, []);
    
    // Detect conflicts between shortcuts
    const detectConflicts = useCallback(() => {
        const conflicts = [];
        const shortcutMap = new Map();
        
        Object.entries(shortcuts).forEach(([command, shortcut]) => {
            const key = JSON.stringify({
                key: shortcut.key,
                meta: Boolean(shortcut.meta),
                ctrl: Boolean(shortcut.ctrl),
                alt: Boolean(shortcut.alt),
                shift: Boolean(shortcut.shift)
            });
            
            if (shortcutMap.has(key)) {
                const existing = shortcutMap.get(key);
                const existingConflict = conflicts.find(c => 
                    shortcutsMatch(c.shortcut, shortcut)
                );
                
                if (existingConflict) {
                    existingConflict.commands.push(command);
                } else {
                    conflicts.push({
                        shortcut,
                        commands: [existing.command, command]
                    });
                }
            } else {
                shortcutMap.set(key, { command, shortcut });
            }
        });
        
        return conflicts;
    }, [shortcuts]);
    
    return {
        shortcuts,
        isMac,
        updateShortcut,
        resetShortcuts,
        resetShortcut,
        exportShortcuts,
        importShortcuts,
        detectConflicts,
        isValidShortcut
    };
}

// For backwards compatibility, support the legacy export
export default useKeyboardShortcut;