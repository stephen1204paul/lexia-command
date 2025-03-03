import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Command } from 'cmdk';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { usePluginManager } from '../hooks/usePluginManager';
import { searchCommands } from '../commands';
import PluginSearchResults from './PluginSearchResults';
import SearchResults from './SearchResults';
import '../css/command-bar.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPluginSearch, setIsPluginSearch] = useState(false);
    const [pluginResults, setPluginResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Use the plugin manager hook
    const { 
        installingPlugin, 
        activatingPlugin, 
        pluginStatuses, 
        fetchPluginStatuses, 
        installPlugin, 
        activatePlugin 
    } = usePluginManager();

    // Fetch plugin statuses when plugin search is initiated
    useEffect(() => {
        const handlePluginSearch = () => {
            setIsPluginSearch(true);
            setSearchTerm('');
            setResults([]);
            setPluginResults([]);
            setCurrentPage(1);
            setTotalPages(0);
            fetchPluginStatuses();
        };

        window.addEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
        return () => window.removeEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
    }, [fetchPluginStatuses]);

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
                    const response = await fetch(`https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&per_page=10&page=${currentPage}&search=${encodeURIComponent(searchTerm)}`);
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
                    
                    setPluginResults(currentPage === 1 ? enhancedPlugins : prevResults => [...prevResults, ...enhancedPlugins]);
                    setTotalPages(Math.ceil(data.info?.results || 0) / 10);
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
    }, [searchTerm, isPluginSearch, pluginStatuses, currentPage]);

    const openCommandBar = useCallback(() => {
        setIsOpen(true);
        setSelectedIndex(0);
    }, []);

    const closeCommandBar = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
        setPluginResults([]);
        setSelectedIndex(0);
        setIsPluginSearch(false);
        setCurrentPage(1);
        setTotalPages(0);
    }, []);
    
    // Function to load more plugin results
    const loadMorePlugins = async () => {
        if (loadingMore || !isPluginSearch || !searchTerm || currentPage >= totalPages) {
            return;
        }
        
        setLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const response = await fetch(`https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&per_page=10&page=${nextPage}&search=${encodeURIComponent(searchTerm)}`);
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
            
            setPluginResults(prevResults => [...prevResults, ...enhancedPlugins]);
            setCurrentPage(nextPage);
        } catch (error) {
            console.error('Failed to load more plugins:', error);
        } finally {
            setLoadingMore(false);
        }
    };
    
    // Handle scroll event to implement infinite scroll
    useEffect(() => {
        if (!isOpen || !isPluginSearch) {
            return;
        }
        
        const handleScroll = (event) => {
            const element = event.target;
            if (element.scrollHeight - element.scrollTop <= element.clientHeight * 1.5) {
                loadMorePlugins();
            }
        };
        
        const resultsContainer = document.querySelector('.lexia-command-results');
        if (resultsContainer) {
            resultsContainer.addEventListener('scroll', handleScroll);
        }
        
        return () => {
            if (resultsContainer) {
                resultsContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isOpen, isPluginSearch, currentPage, totalPages, loadingMore, searchTerm]);

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
                            <PluginSearchResults
                                pluginResults={pluginResults}
                                searchTerm={searchTerm}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                                installPlugin={installPlugin}
                                activatePlugin={activatePlugin}
                                installingPlugin={installingPlugin}
                                activatingPlugin={activatingPlugin}
                                loadingMore={loadingMore}
                                hasMorePages={currentPage < totalPages}
                            />
                        ) : results.length > 0 ? (
                            <SearchResults 
                                results={results}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                                closeCommandBar={closeCommandBar}
                            />
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