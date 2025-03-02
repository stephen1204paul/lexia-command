import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';

function PluginSearchResults({ 
    pluginResults, 
    searchTerm, 
    selectedIndex, 
    setSelectedIndex, 
    installPlugin, 
    activatePlugin, 
    installingPlugin, 
    activatingPlugin 
}) {
    if (pluginResults.length > 0) {
        return (
            <Command.Group>
                {pluginResults.slice(0, 10).map((plugin, index) => (
                    <Command.Item
                        key={plugin.slug}
                        value={plugin.slug}
                        className="lexia-command-result"
                        onMouseEnter={() => setSelectedIndex(index)}
                        onSelect={() => {
                            if (!plugin.installed) {
                                installPlugin(plugin.slug);
                            } else if (plugin.installed && !plugin.active) {
                                activatePlugin(plugin.slug);
                            }
                        }}
                        data-selected={index === selectedIndex}
                    >
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
                    </Command.Item>
                ))}
            </Command.Group>
        );
    } else if (searchTerm) {
        return (
            <Command.Empty className="lexia-command-no-results">
                {__('No plugins found', 'lexia-command')}
            </Command.Empty>
        );
    } else {
        return (
            <Command.Empty className="lexia-command-empty-state">
                {__('Search for WordPress plugins...', 'lexia-command')}
            </Command.Empty>
        );
    }
}

export default PluginSearchResults;