import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Command } from 'cmdk';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { usePluginManager } from '../hooks/usePluginManager';
import { useSearchManager } from '../hooks/useSearchManager';
import { searchCommands, commands } from '../commands';
import { COMMAND_CATEGORIES } from '../commands/types';
import PluginSearchResults from './PluginSearchResults';
import PageSearchResults from './PageSearchResults';
import SearchResults from './SearchResults';
import '../css/command-bar.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [isPluginSearch, setIsPluginSearch] = useState(false);
    const [isPageSearch, setIsPageSearch] = useState(false);
    const [pluginResults, setPluginResults] = useState([]);
    const [pageResults, setPageResults] = useState([]);
    
    // Use the search manager hook for common search functionality
    const {
        searchTerm,
        loading,
        currentPage,
        totalPages,
        loadingMore,
        selectedIndex,
        isLoadingMoreRef,
        setSearchTerm,
        setLoading,
        setCurrentPage,
        setTotalPages,
        setLoadingMore,
        setSelectedIndex,
        resetSearch,
        handleSearchTermChange,
        searchPlugins,
        searchPages,
        searchCommandsAndContent,
        loadMore,
        setupScrollHandler
    } = useSearchManager();
    
    // Use the plugin manager hook
    const { 
        installingPlugin, 
        activatingPlugin, 
        pluginStatuses, 
        fetchPluginStatuses, 
        installPlugin, 
        activatePlugin 
    } = usePluginManager();

    // Filter available commands based on user capabilities
    const getAvailableCommands = useCallback(() => {
        return commands.filter(command => {
            // Check if user has required capabilities
            if (command.category === COMMAND_CATEGORIES.PLUGINS && !window.lexiaCommandData.userCaps.manage_options) {
                return false;
            }
            if (command.category === COMMAND_CATEGORIES.SETTINGS && !window.lexiaCommandData.userCaps.manage_options) {
                return false;
            }
            if (command.category === COMMAND_CATEGORIES.USERS && !window.lexiaCommandData.userCaps.manage_options) {
                return false;
            }
            return true;
        });
    }, []);

    // Load initial commands when command bar opens
    useEffect(() => {
        if (isOpen && !isPluginSearch && !isPageSearch && !searchTerm) {
            setResults(getAvailableCommands());
        }
    }, [isOpen, isPluginSearch, isPageSearch, searchTerm, getAvailableCommands]);

    // Fetch plugin statuses when plugin search is initiated
    useEffect(() => {
        const handlePluginSearch = () => {
            setIsPluginSearch(true);
            setIsPageSearch(false);
            resetSearch();
            setResults([]);
            setPluginResults([]);
            fetchPluginStatuses();
        };

        window.addEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
        return () => window.removeEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
    }, [fetchPluginStatuses, resetSearch]);
    
    // Handle page search
    useEffect(() => {
        const handlePageSearch = () => {
            setIsPageSearch(true);
            setIsPluginSearch(false);
            resetSearch();
            setResults([]);
            setPageResults([]);
        };

        window.addEventListener('lexiaCommand:showPageSearch', handlePageSearch);
        return () => window.removeEventListener('lexiaCommand:showPageSearch', handlePageSearch);
    }, [resetSearch]);

    // Search handler
    useEffect(() => {
        // Skip search if we're currently loading more results via infinite scroll
        if (isLoadingMoreRef.current) {
            return;
        }
        
        if (!searchTerm) {
            if (!isPluginSearch && !isPageSearch) {
                // Show all available commands when no search term
                setResults(getAvailableCommands());
            } else if (isPluginSearch) {
                setPluginResults([]);
            } else if (isPageSearch) {
                setPageResults([]);
            }
            setSelectedIndex(0);
            return;
        }

        // Reset to page 1 when search term changes
        if (isPluginSearch && currentPage !== 1) {
            setCurrentPage(1);
            return; // Let the effect run again with page 1
        }

        const searchTimer = setTimeout(async () => {
            setLoading(true);
            try {
                if (isPluginSearch) {
                    // Search WordPress plugin repository
                    const enhancedPlugins = await searchPlugins(searchTerm, currentPage, pluginStatuses);
                    setPluginResults(currentPage === 1 ? enhancedPlugins : prevResults => [...prevResults, ...enhancedPlugins]);
                } else if (isPageSearch) {
                    // Search for pages
                    const pages = await searchPages(searchTerm);
                    setPageResults(pages);
                } else {
                    // Regular command and content search
                    const searchResults = await searchCommandsAndContent(searchTerm, searchCommands);
                    setResults(searchResults);
                }
            } catch (error) {
                console.error('Search failed:', error);
                if (!isPluginSearch && !isPageSearch) {
                    setResults(searchCommands(searchTerm) || []);
                }
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchTerm, isPluginSearch, isPageSearch, pluginStatuses, currentPage, getAvailableCommands, 
        searchPlugins, searchPages, searchCommandsAndContent, isLoadingMoreRef, setCurrentPage, 
        setLoading, setSelectedIndex]);

    const openCommandBar = useCallback(() => {
        setIsOpen(true);
        setSelectedIndex(0);
    }, [setSelectedIndex]);

    const closeCommandBar = useCallback(() => {
        setIsOpen(false);
        resetSearch();
        setResults([]);
        setPluginResults([]);
        setPageResults([]);
        setIsPluginSearch(false);
        setIsPageSearch(false);
    }, [resetSearch]);
    
    // Function to load more plugin results
    const loadMorePlugins = async () => {
        if (loadingMore || !isPluginSearch || !searchTerm || currentPage >= totalPages) {
            return;
        }
        
        await loadMore(async (nextPage) => {
            const enhancedPlugins = await searchPlugins(searchTerm, nextPage, pluginStatuses);
            
            // Check for duplicates before adding new results
            const existingPluginSlugs = new Set(pluginResults.map(p => p.slug));
            const uniqueNewPlugins = enhancedPlugins.filter(plugin => !existingPluginSlugs.has(plugin.slug));
            
            // Update results without triggering the main search effect
            setPluginResults(prevResults => [...prevResults, ...uniqueNewPlugins]);
        });
    };
    
    // Handle scroll event to implement infinite scroll
    useEffect(() => {
        return setupScrollHandler(isOpen, isPluginSearch, loadMorePlugins);
    }, [isOpen, isPluginSearch, currentPage, totalPages, loadingMore, searchTerm, setupScrollHandler]);

    // Register keyboard shortcut
    useKeyboardShortcut(
        { key: 'k', metaKey: true },
        (event) => {
            event.preventDefault();
            openCommandBar();
        }
    );

    // Handle navigation key shortcuts
    const handleNavigationKeyShortcut = useCallback((event) => {
        if (isOpen && !searchTerm) {
            if (isPluginSearch) {
                event.preventDefault();
                setIsPluginSearch(false);
            } else if (isPageSearch) {
                event.preventDefault();
                setIsPageSearch(false);
            }
        }
    }, [isOpen, isPluginSearch, isPageSearch, searchTerm]);

    // Add keyboard shortcut for Backspace/Delete to return to main search from plugin search
    useKeyboardShortcut({ key: 'Backspace' }, handleNavigationKeyShortcut);

    // Also handle Delete key the same way
    useKeyboardShortcut({ key: 'Delete' }, handleNavigationKeyShortcut);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="lexia-command-modal-overlay components-modal__screen-overlay">
            <Command className="lexia-command-modal" label="Command Menu">
                <div className="components-modal__header">
                    <div className="components-modal__header-heading">
                        {isPluginSearch ? __('Search WordPress Plugins', 'lexia-command') : 
                         isPageSearch ? __('Search Pages', 'lexia-command') : 
                         __('LexiaCommand', 'lexia-command')}
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
                        onValueChange={handleSearchTermChange}
                        placeholder={isPluginSearch ? __('Search for plugins...', 'lexia-command') : 
                                   isPageSearch ? __('Search for pages...', 'lexia-command') : 
                                   __('Type a command or search...', 'lexia-command')}
                        className="lexia-command-search"
                        autoComplete="off"
                        autoFocus
                    />
                    
                    <Command.List className="lexia-command-results">
                        {loading && !loadingMore && !installingPlugin && !activatingPlugin ? (
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
                        ) : isPageSearch ? (
                            <PageSearchResults
                                pageResults={pageResults}
                                searchTerm={searchTerm}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                                loadingMore={loadingMore}
                                hasMorePages={currentPage < totalPages}
                                closeCommandBar={closeCommandBar}
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
                            <SearchResults 
                                results={getAvailableCommands()}
                                selectedIndex={selectedIndex}
                                setSelectedIndex={setSelectedIndex}
                                closeCommandBar={closeCommandBar}
                            />
                        )}
                    </Command.List>
                </div>
            </Command>
        </div>
    );
}

export default CommandBar;