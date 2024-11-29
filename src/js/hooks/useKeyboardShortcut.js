import { useEffect } from '@wordpress/element';

export function useKeyboardShortcut(shortcut, callback) {
    useEffect(() => {
        const handler = (event) => {
            const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
            const modifierKey = isMac ? event.metaKey : event.ctrlKey;

            if (modifierKey && event.key.toLowerCase() === shortcut.key.toLowerCase()) {
                callback(event);
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [shortcut, callback]);
} 