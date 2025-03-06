import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';

function PageSearchResults({ 
    pageResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    loadingMore,
    hasMorePages,
    closeCommandBar
}) {
    if (pageResults.length > 0) {
        return (
            <Command.Group>
                {pageResults.map((page, index) => (
                    <Command.Item
                        key={page.id}
                        value={page.id}
                        className="lexia-command-result"
                        onMouseEnter={() => setSelectedIndex(index)}
                        onSelect={() => {
                            if(page.status === 'publish'){
                                window.location.href = page.url;
                                closeCommandBar();
                            }else{
                                window.location.href = `${window.lexiaCommandData.adminUrl}post.php?post=${page.id}&action=edit`;
                                closeCommandBar();
                            }
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
                                {page.status === 'publish' ? __('Enter to view', 'lexia-command') : __('Enter to edit', 'lexia-command')}
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