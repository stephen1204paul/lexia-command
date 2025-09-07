import { render } from '@wordpress/element';
import CommandBar from './components/CommandBar';
import { searchCommands } from './commands';

// Render the CommandBar component
render(<CommandBar />, document.getElementById('lexia-command-root'));

// Expose LexiaCommand functions globally for debugging and external access
window.LexiaCommand = {
    searchCommands: searchCommands,
    openCommandBar: () => {
        // Trigger the keyboard shortcut event to open command bar
        const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
};