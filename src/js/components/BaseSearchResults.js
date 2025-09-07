import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useState } from '@wordpress/element';

/**
 * BaseSearchResults - Generic component for all search result types
 * Eliminates code duplication across result components using render props pattern
 * 
 * @param {Array} results - Array of result items to display
 * @param {string} searchTerm - Current search term (for empty states)
 * @param {number} selectedIndex - Currently selected item index
 * @param {Function} setSelectedIndex - Function to update selected index
 * @param {Function} renderItem - Function to render each result item
 * @param {string} emptyMessage - Message to show when no results found
 * @param {string} emptySearchMessage - Message to show when no search term
 * @param {boolean} loading - Whether results are loading
 * @param {string} loadingMessage - Message to show while loading
 * @param {boolean} loadingMore - Whether loading more results
 * @param {boolean} hasMorePages - Whether more pages are available
 * @param {Function} onLoadMore - Function to load more results (optional)
 */
function BaseSearchResults({
    results,
    searchTerm,
    selectedIndex,
    setSelectedIndex,
    renderItem,
    emptyMessage,
    emptySearchMessage,
    loading = false,
    loadingMessage = __('Loading...', 'lexia-command'),
    loadingMore = false,
    hasMorePages = false,
    onLoadMore = null
}) {
    const [hoverIndex, setHoverIndex] = useState(null);

    // Loading state
    if (loading && results.length === 0) {
        return (
            <Command.Empty className="lexia-command-loading">
                {loadingMessage}
            </Command.Empty>
        );
    }

    // Results found
    if (results.length > 0) {
        return (
            <Command.Group>
                {results.map((item, index) => {
                    const isSelected = index === selectedIndex || index === hoverIndex;
                    
                    return (
                        <Command.Item
                            key={item.id || item.slug || index}
                            value={item.id || item.slug || String(index)}
                            className="lexia-command-result"
                            onMouseEnter={() => {
                                setHoverIndex(index);
                                setSelectedIndex?.(index);
                            }}
                            onMouseLeave={() => setHoverIndex(null)}
                            data-selected={isSelected}
                            onSelect={() => renderItem(item, index, { isSelected, searchTerm })}
                        >
                            {renderItem(item, index, { isSelected, searchTerm, isCommandItem: true })}
                        </Command.Item>
                    );
                })}
                
                {/* Load more indicator */}
                {loadingMore && (
                    <Command.Item disabled className="lexia-command-loading-more">
                        {__('Loading more...', 'lexia-command')}
                    </Command.Item>
                )}
                
                {/* Load more button */}
                {hasMorePages && !loadingMore && onLoadMore && (
                    <Command.Item 
                        className="lexia-command-load-more"
                        onSelect={onLoadMore}
                    >
                        {__('Load more results', 'lexia-command')}
                    </Command.Item>
                )}
            </Command.Group>
        );
    }
    
    // Empty states
    if (searchTerm) {
        return (
            <Command.Empty className="lexia-command-no-results">
                {emptyMessage}
            </Command.Empty>
        );
    } else {
        return (
            <Command.Empty className="lexia-command-empty-state">
                {emptySearchMessage}
            </Command.Empty>
        );
    }
}

export default BaseSearchResults;