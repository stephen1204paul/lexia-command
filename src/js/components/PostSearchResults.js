import { __ } from '@wordpress/i18n';
import BaseSearchResults from './BaseSearchResults';

// Enhanced post item renderer for search results
function PostSearchItemRenderer(post, index, { isCommandItem }) {
    // If this is being called from onSelect (not isCommandItem), execute the action
    if (!isCommandItem) {
        // Dispatch an event to show the post action menu
        const event = new CustomEvent('lexiaCommand:showPostActionMenu', { detail: { post } });
        window.dispatchEvent(event);
        return;
    }

    // Render the actual item content
    return (
        <>
            <div className="lexia-command-post-result-name w-20">
                <span className="lexia-command-result-title">{post.title}</span>
            </div>
            <div className="lexia-command-result-details w-65">
                <span className="lexia-command-result-status">{post.status}</span>
            </div>
            <div className="lexia-command-result-meta w-15">
                <span className="lexia-command-shortcut">
                    {__('Enter for options', 'lexia-command')}
                </span>
            </div>
        </>
    );
}

function PostSearchResults({ 
    postResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    loadingMore,
    hasMorePosts,
    closeCommandBar
}) {
    return (
        <BaseSearchResults
            results={postResults}
            searchTerm={searchTerm}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            renderItem={(post, index, context) => 
                PostSearchItemRenderer(post, index, { 
                    ...context
                })
            }
            emptyMessage={__('No posts found', 'lexia-command')}
            emptySearchMessage={__('Search for posts...', 'lexia-command')}
            loadingMessage={__('Loading more posts...', 'lexia-command')}
            loadingMore={loadingMore}
            hasMorePages={hasMorePosts}
        />
    );
}

export default PostSearchResults;