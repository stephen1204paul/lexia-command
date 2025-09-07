import { __ } from '@wordpress/i18n';

/**
 * PageItemRenderer - Renders page search result items
 * Used by BaseSearchResults for page-specific rendering
 */
export function PageItemRenderer(page, index, { isCommandItem, closeCommandBar }) {
    // If this is being called from onSelect (not isCommandItem), execute the action
    if (!isCommandItem) {
        // Navigate to page edit screen
        window.location.href = `${window.lexiaCommandData.adminUrl}post.php?post=${page.id}&action=edit`;
        closeCommandBar?.();
        return;
    }

    // Render the actual item content
    return (
        <>
            <div className="lexia-command-plugin-result px-4 w-10">
                <span className="page-icon">📄</span>
            </div>
            <div className="lexia-command-plugin-result-name w-30">
                <span className="lexia-command-result-title">{page.title}</span>
            </div>
            <div className="lexia-command-result-details w-50">
                <span className="lexia-command-page-status">
                    {page.status === 'publish' ? (
                        <span className="status-published">✅ {__('Published', 'lexia-command')}</span>
                    ) : page.status === 'draft' ? (
                        <span className="status-draft">📝 {__('Draft', 'lexia-command')}</span>
                    ) : page.status === 'private' ? (
                        <span className="status-private">🔒 {__('Private', 'lexia-command')}</span>
                    ) : (
                        <span className="status-other">{page.status}</span>
                    )}
                </span>
            </div>
            <div className="lexia-command-result-meta w-10">
                <span className="lexia-command-shortcut">{__('Enter to edit', 'lexia-command')}</span>
            </div>
        </>
    );
}