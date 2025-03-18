import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useState } from '@wordpress/element';

function InstalledPluginsResults({ 
    installedPlugins, 
    selectedIndex, 
    setSelectedIndex, 
    closeCommandBar,
    onSelectPlugin
}) {
    const [hoverIndex, setHoverIndex] = useState(null);

    if (installedPlugins.length > 0) {
        return (
            <Command.Group>
                {installedPlugins.map((plugin, index) => (
                    <Command.Item
                        key={plugin.slug}
                        value={plugin.slug}
                        className="lexia-command-result"
                        onMouseEnter={() => setHoverIndex(index)}
                        onMouseLeave={() => setHoverIndex(null)}
                        onSelect={() => onSelectPlugin(plugin)}
                        data-selected={index === selectedIndex || index === hoverIndex}
                    >
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
                    </Command.Item>
                ))}
            </Command.Group>
        );
    } else {
        return (
            <Command.Empty className="lexia-command-no-results">
                {__('No plugins installed', 'lexia-command')}
            </Command.Empty>
        );
    }
}

export default InstalledPluginsResults;