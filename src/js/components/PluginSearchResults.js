import { __ } from '@wordpress/i18n';
import BaseSearchResults from './BaseSearchResults';

// Enhanced plugin item renderer for search results
function PluginSearchItemRenderer(plugin, index, { isCommandItem, installPlugin, activatePlugin, installingPlugin, activatingPlugin }) {
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
                <img 
                    className="install-plugin-icon w-100"
                    src={plugin.icons && (plugin.icons["1x"] || plugin.icons["default"] || plugin.icons["svg"] || plugin.icons["2x"])}
                    alt={`${plugin.name} icon`}
                />
            </div>
            <div className="lexia-command-plugin-result-name w-20">
                <span className="lexia-command-result-title">{plugin.name}</span>
            </div>
            <div className="lexia-command-result-details w-65">
                <p className="lexia-command-result-description">{plugin.short_description}</p>
                <br/>
                <span className="lexia-command-result-rating">
                    {"⭐".repeat(Math.round(plugin.rating / 20))} {(plugin.rating / 20).toFixed(1)} 
                </span>
                <br/>
                <span className="lexia-command-result-installs">
                    {new Intl.NumberFormat().format(plugin.active_installs)}+ active installs
                </span>
            </div>
            <div className="lexia-command-result-meta w-5">
                {!plugin.installed && (
                    <span>
                        {installingPlugin === plugin.slug ? (
                            <span className="loading-spinner">⌛</span>
                        ) : (
                            <span className="lexia-command-shortcut">Enter to install</span>
                        )}
                    </span>
                )}
                {plugin.installed && !plugin.active && (
                    <span>
                        {activatingPlugin === plugin.slug ? (
                            <span className="loading-spinner">⌛</span>
                        ) : (
                            <span className="lexia-command-shortcut">Enter to activate</span>
                        )}
                    </span>
                )}
            </div>
        </>
    );
}

function PluginSearchResults({ 
    pluginResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    installPlugin, 
    activatePlugin, 
    installingPlugin, 
    activatingPlugin,
    loadingMore,
    hasMorePages
}) {
    return (
        <BaseSearchResults
            results={pluginResults}
            searchTerm={searchTerm}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            renderItem={(plugin, index, context) => 
                PluginSearchItemRenderer(plugin, index, { 
                    ...context,
                    installPlugin,
                    activatePlugin,
                    installingPlugin,
                    activatingPlugin
                })
            }
            emptyMessage={__('No plugins found', 'lexia-command')}
            emptySearchMessage={__('Search for WordPress plugins...', 'lexia-command')}
            loadingMessage={__('Searching plugins...', 'lexia-command')}
            loadingMore={loadingMore}
            hasMorePages={hasMorePages}
        />
    );
}

export default PluginSearchResults;