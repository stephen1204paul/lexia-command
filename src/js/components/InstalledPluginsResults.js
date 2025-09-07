import { __ } from '@wordpress/i18n';
import BaseSearchResults from './BaseSearchResults';
import { InstalledPluginItemRenderer } from './renderers/PluginItemRenderer';

function InstalledPluginsResults({ 
    installedPlugins, 
    selectedIndex, 
    setSelectedIndex, 
    closeCommandBar,
    onSelectPlugin
}) {
    return (
        <BaseSearchResults
            results={installedPlugins}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            renderItem={(plugin, index, context) => 
                InstalledPluginItemRenderer(plugin, index, { 
                    ...context, 
                    onSelectPlugin, 
                    closeCommandBar 
                })
            }
            emptyMessage={__('No plugins installed', 'lexia-command')}
            emptySearchMessage={__('Search installed plugins...', 'lexia-command')}
        />
    );
}

export default InstalledPluginsResults;