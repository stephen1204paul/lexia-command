import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Command } from 'cmdk';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { searchCommands } from '../commands';
import '../css/command-bar.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPluginSearch, setIsPluginSearch] = useState(false);
    const [pluginResults, setPluginResults] = useState([]);
    const [installingPlugin, setInstallingPlugin] = useState(null);
    const [activatingPlugin, setActivatingPlugin] = useState(null);
    const [pluginStatuses, setPluginStatuses] = useState({});

    // Fetch plugin statuses when plugin search is initiated
    useEffect(() => {
        const fetchPluginStatuses = async () => {
            try {
                const response = await apiFetch({
                    path: `/${window.lexiaCommandData.restNamespace}/get-plugin-statuses`,
                    method: 'GET'
                });
                setPluginStatuses(response.data || {});
            } catch (error) {
                console.error('Failed to fetch plugin statuses:', error);
            }
        };

        const handlePluginSearch = () => {
            setIsPluginSearch(true);
            setSearchTerm('');
            setResults([]);
            fetchPluginStatuses();
        };

        window.addEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
        return () => window.removeEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
    }, []);

    // Remove the I and A keyboard shortcuts as they're causing problems
    // The Enter key will now be used for both installation and activation

    const installPlugin = async (slug) => {
        setInstallingPlugin(slug);
        try {
            await apiFetch({
                path: `${window.lexiaCommandData.restNamespace}/install-plugin`,
                method: 'POST',
                data: { slug }
            });
            // Update the plugin status in the results
            setPluginResults(prevResults =>
                prevResults.map(plugin =>
                    plugin.slug === slug ? { ...plugin, installed: true } : plugin
                )
            );
            // Update plugin statuses
            setPluginStatuses(prev => ({
                ...prev,
                [slug]: { ...prev[slug], installed: true }
            }));
        } catch (error) {
            console.error('Plugin installation failed:', error);
        } finally {
            setInstallingPlugin(null);
        }
    };

    const activatePlugin = async (slug) => {
        setActivatingPlugin(slug);
        try {
            await apiFetch({
                path: `${window.lexiaCommandData.restNamespace}/activate-plugin`,
                method: 'POST',
                data: { slug }
            });
            // Update the plugin status in the results
            setPluginResults(prevResults =>
                prevResults.map(plugin =>
                    plugin.slug === slug ? { ...plugin, installed: true, active: true } : plugin
                )
            );
            // Update plugin statuses
            setPluginStatuses(prev => ({
                ...prev,
                [slug]: { ...prev[slug], installed: true, active: true }
            }));
        } catch (error) {
            console.error('Plugin activation failed:', error);
        } finally {
            setActivatingPlugin(null);
        }
    };

    // Search handler
    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            setPluginResults([]);
            setSelectedIndex(0);
            return;
        }

        const searchTimer = setTimeout(async () => {
            setLoading(true);
            try {
                if (isPluginSearch) {
                    // Search WordPress plugin repository
                    const response = await fetch(`https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&per_page=10&search=${encodeURIComponent(searchTerm)}`);
                    const data = await response.json();
                    
                    // Merge plugin data with local status information
                    const plugins = data.plugins || [];
                    const enhancedPlugins = plugins.map(plugin => {
                        const status = pluginStatuses[plugin.slug] || {};
                        return {
                            ...plugin,
                            installed: status.installed || false,
                            active: status.active || false
                        };
                    });
                    
                    setPluginResults(enhancedPlugins);
                } else {
                    // Regular command and content search
                    const commandResults = searchCommands(searchTerm);
                    const queryString = new URLSearchParams({ query: searchTerm }).toString();
                    const response = await apiFetch({
                        path: `/${window.lexiaCommandData.restNamespace}/search?${queryString}`,
                        method: 'GET'
                    });
                    setResults([
                        ...commandResults,
                        ...response.data.map(item => ({
                            ...item,
                            icon: '📝',
                            action: () => {
                                window.location.href = item.url;
                            }
                        }))
                    ]);
                }
            } catch (error) {
                console.error('Search failed:', error);
                if (!isPluginSearch) {
                    setResults(searchCommands(searchTerm) || []);
                }
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchTerm, isPluginSearch, pluginStatuses]);

    const openCommandBar = useCallback(() => {
        setIsOpen(true);
        setSelectedIndex(0);
    }, []);

    const closeCommandBar = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
        setSelectedIndex(0);
        setIsPluginSearch(false);
    }, []);

    // Register keyboard shortcut
    useKeyboardShortcut(
        { key: 'k', metaKey: true },
        (event) => {
            event.preventDefault();
            openCommandBar();
        }
    );

    // Add keyboard shortcut for Backspace/Delete to return to main search from plugin search
    useKeyboardShortcut(
        { key: 'Backspace' },
        (event) => {
            if (isOpen && isPluginSearch && !searchTerm) {
                event.preventDefault();
                setIsPluginSearch(false);
            }
        }
    );

    // Also handle Delete key the same way
    useKeyboardShortcut(
        { key: 'Delete' },
        (event) => {
            if (isOpen && isPluginSearch && !searchTerm) {
                event.preventDefault();
                setIsPluginSearch(false);
            }
        }
    );

    if (!isOpen) {
        return null;
    }

    return (
        <div className="lexia-command-modal-overlay components-modal__screen-overlay">
            <Command className="lexia-command-modal" label="Command Menu">
                <div className="components-modal__header">
                    <div className="components-modal__header-heading">
                        {isPluginSearch ? __('Search WordPress Plugins', 'lexia-command') : __('LexiaCommand', 'lexia-command')}
                    </div>
                    <button 
                        type="button" 
                        className="components-button has-icon" 
                        onClick={closeCommandBar}
                        aria-label={__('Close dialog', 'lexia-command')}
                    >
                        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path>
                        </svg>
                    </button>
                </div>
                
                <div className="lexia-command-container">
                    <Command.Input 
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder={isPluginSearch ? __('Search for plugins...', 'lexia-command') : __('Type a command or search...', 'lexia-command')}
                        className="lexia-command-search"
                        autoComplete="off"
                        autoFocus
                    />
                    
                    <Command.List className="lexia-command-results">
                        {loading && !installingPlugin && !activatingPlugin ? (
                            <Command.Empty className="lexia-command-loading">
                                {__('Searching...', 'lexia-command')}
                            </Command.Empty>
                        ) : isPluginSearch ? (
                            pluginResults.length > 0 ? (
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
                            ) : searchTerm ? (
                                <Command.Empty className="lexia-command-no-results">
                                    {__('No plugins found', 'lexia-command')}
                                </Command.Empty>
                            ) : (
                                <Command.Empty className="lexia-command-empty-state">
                                    {__('Search for WordPress plugins...', 'lexia-command')}
                                </Command.Empty>
                            )
                        ) : results.length > 0 ? (
                            <Command.Group>
                                {results.map((result, index) => (
                                    <Command.Item
                                        key={result.id || index}
                                        value={result.id || String(index)}
                                        className="lexia-command-result"
                                        onSelect={() => {
                                            const shouldClose = result.action(closeCommandBar);
                                            if (shouldClose !== false) {
                                                closeCommandBar();
                                            }
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        data-selected={index === selectedIndex}
                                    >
                                        <span className="lexia-command-result-icon">{result.icon}</span>
                                        <span className="lexia-command-result-title">{result.title}</span>
                                    </Command.Item>
                                ))}
                            </Command.Group>
                        ) : searchTerm ? (
                            <Command.Empty className="lexia-command-no-results">
                                {__('No results found', 'lexia-command')}
                            </Command.Empty>
                        ) : (
                            <Command.Empty className="lexia-command-empty-state">
                                {__('Start typing to search...', 'lexia-command')}
                            </Command.Empty>
                        )}
                    </Command.List>
                </div>
            </Command>
        </div>
    );
}

export default CommandBar;