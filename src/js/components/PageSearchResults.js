import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useState } from '@wordpress/element';
import PageActionMenu from './PageActionMenu';

function PageSearchResults({ 
    pageResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    loadingMore,
    hasMorePages,
    closeCommandBar
}) {
    
    // Otherwise show the search results
    if (pageResults.length > 0) {
        return (
            <Command.Group>
                {pageResults.map((page, index) => (
                    <Command.Item
                        key={`search-page-`+page.id}
                        value={`search-page-`+page.id}
                        className="lexia-command-result"
                        onMouseEnter={() => setSelectedIndex(index)}
                        onSelect={() => {
                            // Dispatch an event to show the page action menu
                            const event = new CustomEvent('lexiaCommand:showPageActionMenu', { detail: { page } });
                            window.dispatchEvent(event);
                        }}
                        data-selected={index === selectedIndex}
                    >
                        <div className="lexia-command-page-result-name w-20">
                            <span className="lexia-command-result-title">{page.title}</span>
                        </div>
                        <div className="lexia-command-result-details w-65">
                            <span className="lexia-command-result-status">{page.status}</span>
                        </div>
                        <div className="lexia-command-result-meta w-15">
                            <span className="lexia-command-shortcut">
                                {__('Enter for options', 'lexia-command')}
                            </span>
                        </div>
                    </Command.Item>
                ))}
                {loadingMore && (
                    <Command.Item className="lexia-command-loading-more" value="loading-more">
                        <div className="lexia-command-loading-indicator">
                            {__('Loading more pages...', 'lexia-command')}
                        </div>
                    </Command.Item>
                )}
                {!loadingMore && hasMorePages && (
                    <Command.Item className="lexia-command-scroll-hint" value="scroll-hint">
                        <div className="lexia-command-scroll-hint-text">
                            {__('Scroll for more results', 'lexia-command')}
                        </div>
                    </Command.Item>
                )}
            </Command.Group>
        );
    } else if (searchTerm) {
        return (
            <Command.Empty className="lexia-command-no-results">
                {__('No pages found', 'lexia-command')}
            </Command.Empty>
        );
    } else {
        return (
            <Command.Empty className="lexia-command-empty-state">
                {__('Search for pages...', 'lexia-command')}
            </Command.Empty>
        );
    }
}

export default PageSearchResults;