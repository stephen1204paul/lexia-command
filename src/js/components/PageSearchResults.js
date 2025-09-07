import { __ } from '@wordpress/i18n';
import BaseSearchResults from './BaseSearchResults';

// Enhanced page item renderer for search results
function PageSearchItemRenderer(page, index, { isCommandItem }) {
    // If this is being called from onSelect (not isCommandItem), execute the action
    if (!isCommandItem) {
        // Dispatch an event to show the page action menu
        const event = new CustomEvent('lexiaCommand:showPageActionMenu', { detail: { page } });
        window.dispatchEvent(event);
        return;
    }

    // Render the actual item content
    return (
        <>
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
        </>
    );
}

function PageSearchResults({ 
    pageResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    loadingMore,
    hasMorePages,
    closeCommandBar
}) {
    return (
        <BaseSearchResults
            results={pageResults}
            searchTerm={searchTerm}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            renderItem={(page, index, context) => 
                PageSearchItemRenderer(page, index, { 
                    ...context
                })
            }
            emptyMessage={__('No pages found', 'lexia-command')}
            emptySearchMessage={__('Search for pages...', 'lexia-command')}
            loadingMessage={__('Loading more pages...', 'lexia-command')}
            loadingMore={loadingMore}
            hasMorePages={hasMorePages}
        />
    );
}

export default PageSearchResults;