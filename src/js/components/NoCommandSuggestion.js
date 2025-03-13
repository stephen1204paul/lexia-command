import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';

function NoCommandSuggestion({ searchTerm }) {
    const handlePostSearchClick = () => {
        const event = new CustomEvent('lexiaCommand:showPostSearch', {
            detail: { searchTerm }
        });
        window.dispatchEvent(event);
    };

    const handlePageSearchClick = () => {
        const event = new CustomEvent('lexiaCommand:showPageSearch', {
            detail: { searchTerm }
        });
        window.dispatchEvent(event);
    };

    return (
        <Command.Empty className="lexia-command-no-results">
            <div className="lexia-command-no-command-found">
                <p>{__('No Command Found', 'lexia-command')}</p>
                <p>{__('Were you trying to search for:', 'lexia-command')}</p>
                <div className="lexia-command-suggestion-buttons">
                    <button 
                        className="lexia-command-suggestion-button" 
                        onClick={handlePostSearchClick}
                    >
                        <span className="lexia-command-suggestion-icon">📝</span>
                        <span>{__('Posts', 'lexia-command')}</span>
                    </button>
                    <button 
                        className="lexia-command-suggestion-button" 
                        onClick={handlePageSearchClick}
                    >
                        <span className="lexia-command-suggestion-icon">📄</span>
                        <span>{__('Pages', 'lexia-command')}</span>
                    </button>
                </div>
            </div>
        </Command.Empty>
    );
}

export default NoCommandSuggestion;