import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';

function SearchResults({ results, selectedIndex, setSelectedIndex, closeCommandBar }) {
    if (results.length > 0) {
        return (
            <Command.Group>
                {results.map((result, index) => {
                    return (
                        <Command.Item
                            key={result.id || index}
                            value={result.id || String(index)}
                            className="lexia-command-result"
                            onSelect={() => {
                                const shouldClose = result.action(closeCommandBar);
                                if (shouldClose !== false) {
                                    closeCommandBar();
                                }
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            data-selected={index === selectedIndex}
                            data-command-id={result.id}
                        >
                            <span className="lexia-command-result-icon">{result.icon}</span>
                            <span className="lexia-command-result-title">{result.title}</span>
                        </Command.Item>
                    );
                })}
            </Command.Group>
        );
    } else {
        return (
            <Command.Empty className="lexia-command-no-results">
                {__('No results found', 'lexia-command')}
            </Command.Empty>
        );
    }
}

export default SearchResults;