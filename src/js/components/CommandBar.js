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
import PageActionMenu from './PageActionMenu';
import SearchResults from './SearchResults';
import '../css/command-bar.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [isPluginSearch, setIsPluginSearch] = useState(false);
    const [isPageSearch, setIsPageSearch] = useState(false);
    const [isPageActionMenu, setIsPageActionMenu] = useState(false);
    const [pluginResults, setPluginResults] = useState([]);
    const [pageResults, setPageResults] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    
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
        const handlePageSearch = async () => {
            setIsPageSearch(true);
            setIsPluginSearch(false);
            setIsPageActionMenu(false);
            setSelectedPage(null);
            resetSearch();
            setResults([]);
            
            // Immediately fetch all pages when page search is opened
            setLoading(true);
            try {
                const pages = await searchPages('');
                setPageResults(pages);
            } catch (error) {
                console.error('Failed to fetch pages:', error);
            } finally {
                setLoading(false);
            }
        };

        window.addEventListener('lexiaCommand:showPageSearch', handlePageSearch);
        return () => window.removeEventListener('lexiaCommand:showPageSearch', handlePageSearch);
    }, [resetSearch, searchPages, setLoading]);
    
    // Handle page action menu
    useEffect(() => {
        const handlePageActionMenu = (event) => {
            const { page } = event.detail;
            // First set the selected page
            setSelectedPage(page);
            // Then update the UI state to show the action menu
            // This ensures the page data is available when the menu renders
            setTimeout(() => {
                setIsPageActionMenu(true);
            }, 0);
        };

        window.addEventListener('lexiaCommand:showPageActionMenu', handlePageActionMenu);
        return () => window.removeEventListener('lexiaCommand:showPageActionMenu', handlePageActionMenu);
    }, []);

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
                // When search term is cleared in page search, fetch all pages
                setLoading(true);
                searchPages('').then(pages => {
                    setPageResults(pages);
                    setLoading(false);
                }).catch(error => {
                    console.error('Failed to fetch pages:', error);
                    setLoading(false);
                });
            }
            setSelectedIndex(0);
            return;
        }

        // Reset to page 1 when search term changes
        if (isPluginSearch && currentPage !== 1) {
            setCurrentPage(1);
            return; // Let the effect run again with page 1
        }

        // For command search (not plugin or page search), execute immediately
        if (!isPluginSearch && !isPageSearch) {
            setLoading(true);
            (async () => {
                try {
                    // First set immediate results from local command search
                    const commandResults = searchCommands(searchTerm) || [];
                    setResults(commandResults);
                    
                    // Then fetch content search results with API call
                    const searchResults = await searchCommandsAndContent(searchTerm, searchCommands);
                    setResults(searchResults);
                } catch (error) {
                    console.error('Search failed:', error);
                    setResults(searchCommands(searchTerm) || []);
                } finally {
                    setLoading(false);
                }
            })();
            return () => {}; // No timer to clear for immediate execution
        }
        
        // For API-based searches (plugins and pages), use timeout to debounce
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
                }
            } catch (error) {
                console.error('Search failed:', error);
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
        setIsPageActionMenu(false);
        setSelectedPage(null);
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
    
    // Function to load more page results
    const loadMorePages = async () => {
        if (loadingMore || !isPageSearch) {
            return;
        }
        
        await loadMore(async (nextPage) => {
            const pages = await searchPages(searchTerm);
            
            // Check for duplicates before adding new results
            const existingPageIds = new Set(pageResults.map(p => p.id));
            const uniqueNewPages = pages.filter(page => !existingPageIds.has(page.id));
            
            // Update results without triggering the main search effect
            setPageResults(prevResults => [...prevResults, ...uniqueNewPages]);
        });
    };
    
    // Handle scroll event to implement infinite scroll
    useEffect(() => {
        if (isPluginSearch) {
            return setupScrollHandler(isOpen, isPluginSearch, loadMorePlugins);
        } else if (isPageSearch) {
            return setupScrollHandler(isOpen, isPageSearch, loadMorePages);
        }
        return () => {};
    }, [isOpen, isPluginSearch, isPageSearch, currentPage, totalPages, loadingMore, searchTerm, setupScrollHandler, loadMorePlugins, loadMorePages]);

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
            } else if (isPageSearch && !isPageActionMenu) {
                event.preventDefault();
                setIsPageSearch(false);
            } else if (isPageActionMenu) {
                event.preventDefault();
                setIsPageActionMenu(false);
                setSelectedPage(null);
            }
        }
    }, [isOpen, isPluginSearch, isPageSearch, isPageActionMenu, searchTerm]);

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
                         isPageSearch && !isPageActionMenu ? __('Search Pages', 'lexia-command') :
                         isPageActionMenu ? __('Page Actions', 'lexia-command') :
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
                
                {/* Conditionally render different screens based on state */}
                {isPageActionMenu && selectedPage ? (
                    // Render PageActionMenu as a completely separate screen
                    <div className="lexia-command-container">
                        <PageActionMenu
                            page={selectedPage}
                            closeCommandBar={closeCommandBar}
                            onBack={() => {
                                setIsPageActionMenu(false);
                                setSelectedPage(null);
                            }}
                        />
                    </div>
                ) : (
                    // Render the regular command bar content
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
                )}
            </Command>
        </div>
    );
}
export default CommandBar;
