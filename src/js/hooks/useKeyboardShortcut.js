import { useEffect } from '@wordpress/element';

export function useKeyboardShortcut(shortcut, callback) {
    useEffect(() => {
        const handler = (event) => {
            const isArrowKey = shortcut.key === 'ArrowUp' || shortcut.key === 'ArrowDown';
            const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
            const modifierKey = isMac ? event.metaKey : event.ctrlKey;
            const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

            // For arrow keys, only check if the key matches
            if (isArrowKey && keyMatches) {
                callback(event);
                return;
            }

            // For other shortcuts, check if both the key and modifier match
            if (!isArrowKey && keyMatches && ((shortcut.metaKey && modifierKey) || !shortcut.metaKey)) {
                callback(event);
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcut, callback]);
}