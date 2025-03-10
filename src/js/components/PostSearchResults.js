import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useState } from '@wordpress/element';

function PostSearchResults({ 
    postResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    loadingMore,
    hasMorePosts,
    closeCommandBar
}) {
    
    // Show the search results if we have any
    if (postResults.length > 0) {
        return (
            <Command.Group>
                {postResults.map((post, index) => (
                    <Command.Item
                        key={`search-post-`+post.id}
                        value={`search-post-`+post.id}
                        className="lexia-command-result"
                        onMouseEnter={() => setSelectedIndex(index)}
                        onSelect={() => {
                            // Navigate to the post when selected
                            window.location.href = post.url;
                            closeCommandBar();
                        }}
                        data-selected={index === selectedIndex}
                    >
                        <div className="lexia-command-page-result-name w-20">
                            <span className="lexia-command-result-title">{post.title}</span>
                        </div>
                        <div className="lexia-command-result-details w-65">
                            <span className="lexia-command-result-status">{post.status}</span>
                        </div>
                        <div className="lexia-command-result-meta w-15">
                            <span className="lexia-command-shortcut">
                                {__('Enter to view', 'lexia-command')}
                            </span>
                        </div>
                    </Command.Item>
                ))}
                {loadingMore && (
                    <Command.Item className="lexia-command-loading-more" value="loading-more">
                        <div className="lexia-command-loading-indicator">
                            {__('Loading more posts...', 'lexia-command')}
                        </div>
                    </Command.Item>
                )}
                {!loadingMore && hasMorePosts && (
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
                {__('No posts found', 'lexia-command')}
            </Command.Empty>
        );
    } else {
        return (
            <Command.Empty className="lexia-command-empty-state">
                {__('Search for posts...', 'lexia-command')}
            </Command.Empty>
        );
    }
}

export default PostSearchResults;