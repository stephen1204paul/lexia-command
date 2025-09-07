import { __ } from '@wordpress/i18n';

/**
 * PostItemRenderer - Renders post search result items  
 * Used by BaseSearchResults for post-specific rendering
 */
export function PostItemRenderer(post, index, { isCommandItem, closeCommandBar }) {
    // If this is being called from onSelect (not isCommandItem), execute the action
    if (!isCommandItem) {
        // Navigate to post edit screen
        window.location.href = `${window.lexiaCommandData.adminUrl}post.php?post=${post.id}&action=edit`;
        closeCommandBar?.();
        return;
    }

    // Render the actual item content
    return (
        <>
            <div className="lexia-command-plugin-result px-4 w-10">
                <span className="post-icon">📝</span>
            </div>
            <div className="lexia-command-plugin-result-name w-30">
                <span className="lexia-command-result-title">{post.title}</span>
            </div>
            <div className="lexia-command-result-details w-40">
                <span className="lexia-command-post-meta">
                    {post.date && (
                        <span className="post-date">
                            {new Date(post.date).toLocaleDateString()}
                        </span>
                    )}
                </span>
            </div>
            <div className="lexia-command-result-details w-10">
                <span className="lexia-command-post-status">
                    {post.status === 'publish' ? (
                        <span className="status-published">✅ {__('Published', 'lexia-command')}</span>
                    ) : post.status === 'draft' ? (
                        <span className="status-draft">📝 {__('Draft', 'lexia-command')}</span>
                    ) : post.status === 'private' ? (
                        <span className="status-private">🔒 {__('Private', 'lexia-command')}</span>
                    ) : (
                        <span className="status-other">{post.status}</span>
                    )}
                </span>
            </div>
            <div className="lexia-command-result-meta w-10">
                <span className="lexia-command-shortcut">{__('Enter to edit', 'lexia-command')}</span>
            </div>
        </>
    );
}