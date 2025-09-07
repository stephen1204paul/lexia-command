import { __ } from '@wordpress/i18n';

/**
 * PluginItemRenderer - Renders plugin search result items
 * Used by BaseSearchResults for plugin-specific rendering
 */
export function PluginItemRenderer(plugin, index, { isCommandItem, installPlugin, activatePlugin, installingPlugin, activatingPlugin }) {
    // If this is being called from onSelect (not isCommandItem), execute the action
    if (!isCommandItem) {
        if (!plugin.installed) {
            installPlugin(plugin.slug);
        } else if (plugin.installed && !plugin.active) {
            activatePlugin(plugin.slug);
        }
        return;
    }

    // Render the actual item content
    return (
        <>
            <div className="lexia-command-plugin-result px-4 w-10">
                <span className="plugin-icon">🔌</span>
            </div>
            <div className="lexia-command-plugin-result-name w-30">
                <span className="lexia-command-result-title">{plugin.name}</span>
            </div>
            <div className="lexia-command-result-details w-50">
                <span className="lexia-command-plugin-description">
                    {plugin.short_description || plugin.description}
                </span>
            </div>
            <div className="lexia-command-result-meta w-10">
                <span className="lexia-command-plugin-status">
                    {installingPlugin === plugin.slug ? (
                        <span className="status-installing">{__('Installing...', 'lexia-command')}</span>
                    ) : activatingPlugin === plugin.slug ? (
                        <span className="status-activating">{__('Activating...', 'lexia-command')}</span>
                    ) : !plugin.installed ? (
                        <span className="status-install">{__('Install', 'lexia-command')}</span>
                    ) : plugin.installed && !plugin.active ? (
                        <span className="status-activate">{__('Activate', 'lexia-command')}</span>
                    ) : (
                        <span className="status-active">{__('Active', 'lexia-command')}</span>
                    )}
                </span>
            </div>
        </>
    );
}

/**
 * InstalledPluginItemRenderer - Renders installed plugin items
 * Used for plugin management interface
 */
export function InstalledPluginItemRenderer(plugin, index, { isCommandItem, onSelectPlugin }) {
    // If this is being called from onSelect, execute the action
    if (!isCommandItem) {
        onSelectPlugin(plugin);
        return;
    }

    // Render the actual item content
    return (
        <>
            <div className="lexia-command-plugin-result px-4 w-10">
                <span className="plugin-icon">🔌</span>
            </div>
            <div className="lexia-command-plugin-result-name w-20">
                <span className="lexia-command-result-title">{plugin.name}</span>
            </div>
            <div className="lexia-command-result-details w-65">
                <span className="lexia-command-plugin-status">
                    {plugin.active ? 
                        <span className="status-active">✅ {__('Active', 'lexia-command')}</span> : 
                        <span className="status-inactive">⚠️ {__('Inactive', 'lexia-command')}</span>
                    }
                </span>
            </div>
            <div className="lexia-command-result-meta w-5">
                <span className="lexia-command-shortcut">{__('Enter for actions', 'lexia-command')}</span>
            </div>
        </>
    );
}