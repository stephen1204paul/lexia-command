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
import PostSearchResults from './PostSearchResults';
import PageActionMenu from './PageActionMenu';
import PostActionMenu from './PostActionMenu';
import SearchResults from './SearchResults';
import NoCommandSuggestion from './NoCommandSuggestion';
import { useFocusTrap, announceToScreenReader, isHighContrastEnabled, toggleHighContrast, addFocusStyles } from '../utils/accessibility';
import { manageFocus, addAriaAttributes, setupAccessibilityShortcuts, toggleReducedMotion, isReducedMotionEnabled, toggleLargerFontSize, isLargerFontSizeEnabled } from '../utils/accessibilityEnhanced';
import AccessibilityMenu from './AccessibilityMenu';
import '../css/command-bar.css';
import '../css/accessibility-menu.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [isPluginSearch, setIsPluginSearch] = useState(false);
    const [isPageSearch, setIsPageSearch] = useState(false);
    const [isPostSearch, setIsPostSearch] = useState(false);
    const [isPageActionMenu, setIsPageActionMenu] = useState(false);
    const [isPostActionMenu, setIsPostActionMenu] = useState(false);
    const [pluginResults, setPluginResults] = useState([]);
    const [pageResults, setPageResults] = useState([]);
    const [postResults, setPostResults] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [highContrast, setHighContrast] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [largerFontSize, setLargerFontSize] = useState(false);
    const [previouslyFocusedElement, setPreviouslyFocusedElement] = useState(null);
    
    // Reference to the modal container for focus trapping
    const modalRef = useRef(null);
    
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
        searchPosts,
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

    // Load accessibility preferences on mount
    useEffect(() => {
        // Load high contrast preference
        setHighContrast(isHighContrastEnabled());
        
        // Load reduced motion preference
        setReducedMotion(isReducedMotionEnabled());
        
        // Load larger font size preference
        setLargerFontSize(isLargerFontSizeEnabled());
        
        // Add focus styles
        addFocusStyles();
    }, []);
    
    // Apply high contrast mode when preference changes
    useEffect(() => {
        toggleHighContrast(highContrast);
    }, [highContrast]);
    
    // Apply reduced motion mode when preference changes
    useEffect(() => {
        toggleReducedMotion(reducedMotion);
    }, [reducedMotion]);
    
    // Apply larger font size mode when preference changes
    useEffect(() => {
        toggleLargerFontSize(largerFontSize);
    }, [largerFontSize]);
    
    // Setup keyboard shortcuts for accessibility features
    useEffect(() => {
        const cleanup = setupAccessibilityShortcuts(
            () => setHighContrast(prev => !prev),
            () => setReducedMotion(prev => !prev),
            () => setLargerFontSize(prev => !prev)
        );
        
        return cleanup;
    }, []);
    
    // Manage focus when command bar opens/closes
    useEffect(() => {
        if (isOpen) {
            // Store the currently focused element before opening
            setPreviouslyFocusedElement(document.activeElement);
        } else if (previouslyFocusedElement) {
            // Return focus when closing
            manageFocus(false, modalRef, previouslyFocusedElement);
        }
    }, [isOpen, previouslyFocusedElement]);
    
    // Add ARIA attributes to command bar elements
    useEffect(() => {
        if (isOpen && modalRef.current) {
            addAriaAttributes(modalRef.current);
        }
    }, [isOpen, results, pluginResults, pageResults, postResults]);

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
        if (isOpen && !isPluginSearch && !isPageSearch && !isPostSearch && !searchTerm) {
            setResults(getAvailableCommands());
        }
    }, [isOpen, isPluginSearch, isPageSearch, isPostSearch, searchTerm, getAvailableCommands]);

    // Fetch plugin statuses when plugin search is initiated
    useEffect(() => {
        const handlePluginSearch = () => {
            setIsPluginSearch(true);
            setIsPageSearch(false);
            setIsPostSearch(false);
            resetSearch();
            setResults([]);
            setPluginResults([]);
            fetchPluginStatuses();
            
            // Announce to screen readers
            announceToScreenReader(__('Plugin search mode activated', 'lexia-command'));
        };

        window.addEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
        return () => window.removeEventListener('lexiaCommand:showPluginSearch', handlePluginSearch);
    }, [fetchPluginStatuses, resetSearch]);
    
    // Handle page search
    useEffect(() => {
        const handlePageSearch = async (event) => {
            setIsPageSearch(true);
            setIsPluginSearch(false);
            setIsPostSearch(false);
            setIsPageActionMenu(false);
            setIsPostActionMenu(false);
            setSelectedPage(null);
            resetSearch();
            setResults([]);
            
            // Get search term from event if available
            const initialSearchTerm = event?.detail?.searchTerm || '';
            if (initialSearchTerm) {
                setSearchTerm(initialSearchTerm);
            }
            
            // Fetch pages with the search term if provided
            setLoading(true);
            try {
                const pages = await searchPages(initialSearchTerm);
                setPageResults(pages);
                
                // Announce to screen readers
                announceToScreenReader(__('Page search mode activated', 'lexia-command'));
            } catch (error) {
                console.error('Failed to fetch pages:', error);
            } finally {
                setLoading(false);
            }
        };

        window.addEventListener('lexiaCommand:showPageSearch', handlePageSearch);
        return () => window.removeEventListener('lexiaCommand:showPageSearch', handlePageSearch);
    }, [resetSearch, searchPages, setLoading, setSearchTerm]);
    
    // Handle post search
    useEffect(() => {
        const handlePostSearch = async (event) => {
            setIsPostSearch(true);
            setIsPageSearch(false);
            setIsPluginSearch(false);
            resetSearch();
            setResults([]);
            
            // Get search term from event if available
            const initialSearchTerm = event?.detail?.searchTerm || '';
            if (initialSearchTerm) {
                setSearchTerm(initialSearchTerm);
            }
            
            // Fetch posts with the search term if provided
            setLoading(true);
            try {
                const posts = await searchPosts(initialSearchTerm);
                setPostResults(posts);
                
                // Announce to screen readers
                announceToScreenReader(__('Post search mode activated', 'lexia-command'));
            } catch (error) {
                console.error('Failed to fetch posts:', error);
            } finally {
                setLoading(false);
            }
        };

        window.addEventListener('lexiaCommand:showPostSearch', handlePostSearch);
        return () => window.removeEventListener('lexiaCommand:showPostSearch', handlePostSearch);
    }, [resetSearch, searchPosts, setLoading]);
    
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
                
                // Announce to screen readers
                announceToScreenReader(__('Page action menu opened', 'lexia-command'));
            }, 0);
        };

        window.addEventListener('lexiaCommand:showPageActionMenu', handlePageActionMenu);
        return () => window.removeEventListener('lexiaCommand:showPageActionMenu', handlePageActionMenu);
    }, []);

    // Handle post action menu
    useEffect(() => {
        const handlePostActionMenu = (event) => {
            const { post } = event.detail;
            // First set the selected page
            setSelectedPage(post);
            // Then update the UI state to show the action menu
            // This ensures the page data is available when the menu renders
            setTimeout(() => {
                setIsPostActionMenu(true);
                
                // Announce to screen readers
                announceToScreenReader(__('Post action menu opened', 'lexia-command'));
            }, 0);
        };

        window.addEventListener('lexiaCommand:showPostActionMenu', handlePostActionMenu);
        return () => window.removeEventListener('lexiaCommand:showPostActionMenu', handlePostActionMenu);
    }, []);

    // Search handler
    useEffect(() => {
        // Skip search if we're currently loading more results via infinite scroll
        if (isLoadingMoreRef.current) {
            return;
        }
        
        if (!searchTerm) {
            if (!isPluginSearch && !isPageSearch && !isPostSearch) {
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
            } else if (isPostSearch) {
                // When search term is cleared in post search, fetch all posts
                setLoading(true);
                searchPosts('').then(posts => {
                    setPostResults(posts);
                    setLoading(false);
                }).catch(error => {
                    console.error('Failed to fetch posts:', error);
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

        // For command search (not plugin, page, or post search), execute immediately
        if (!isPluginSearch && !isPageSearch && !isPostSearch) {
            setLoading(true);
            (async () => {
                try {
                    // Set search context to 'commands' for command search
                    window.lexiaCommandData.searchContext = 'commands';
                    
                    // First set immediate results from local command search
                    const commandResults = searchCommands(searchTerm) || [];
                    setResults(commandResults);
                    
                    // Then fetch content search results with API call
                    const searchResults = await searchCommandsAndContent(searchTerm, searchCommands);
                    setResults(searchResults);
                    
                    // Announce search results to screen readers
                    const resultCount = searchResults.length;
                    announceToScreenReader(
                        resultCount > 0 
                            ? __(`Found ${resultCount} results for ${searchTerm}`, 'lexia-command')
                            : __(`No results found for ${searchTerm}`, 'lexia-command')
                    );
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
                    
                    // Announce plugin search results to screen readers
                    const resultCount = enhancedPlugins.length;
                    announceToScreenReader(
                        resultCount > 0 
                            ? __(`Found ${resultCount} plugins for ${searchTerm}`, 'lexia-command')
                            : __(`No plugins found for ${searchTerm}`, 'lexia-command')
                    );
                } else if (isPageSearch) {
                    // Search for pages
                    const pages = await searchPages(searchTerm);
                    setPageResults(pages);
                    
                    // Announce page search results to screen readers
                    const resultCount = pages.length;
                    announceToScreenReader(
                        resultCount > 0 
                            ? __(`Found ${resultCount} pages for ${searchTerm}`, 'lexia-command')
                            : __(`No pages found for ${searchTerm}`, 'lexia-command')
                    );
                } else if (isPostSearch) {
                    // Search for posts
                    const posts = await searchPosts(searchTerm);
                    setPostResults(posts);
                    
                    // Announce post search results to screen readers
                    const resultCount = posts.length;
                    announceToScreenReader(
                        resultCount > 0 
                            ? __(`Found ${resultCount} posts for ${searchTerm}`, 'lexia-command')
                            : __(`No posts found for ${searchTerm}`, 'lexia-command')
                    );
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchTerm, isPluginSearch, isPageSearch, isPostSearch, pluginStatuses, currentPage, getAvailableCommands, 
        searchPlugins, searchPages, searchPosts, searchCommandsAndContent, isLoadingMoreRef, setCurrentPage, 
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
        setIsPostSearch(false);
        setIsPageActionMenu(false);
        setIsPostActionMenu(false);
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
    
    // Function to load more post results
    const loadMorePosts = async () => {
        if (loadingMore || !isPostSearch) {
            return;
        }
        
        await loadMore(async (nextPage) => {
            const posts = await searchPosts(searchTerm);
            
            // Check for duplicates before adding new results
            const existingPostIds = new Set(postResults.map(p => p.id));
            const uniqueNewPosts = posts.filter(post => !existingPostIds.has(post.id));
            
            // Update results without triggering the main search effect
            setPostResults(prevResults => [...prevResults, ...uniqueNewPosts]);
        });
    };
    
    // Handle scroll event to implement infinite scroll
    useEffect(() => {
        if (isPluginSearch) {
            return setupScrollHandler(isOpen, isPluginSearch, loadMorePlugins);
        } else if (isPageSearch) {
            return setupScrollHandler(isOpen, isPageSearch, loadMorePages);
        } else if (isPostSearch) {
            return setupScrollHandler(isOpen, isPostSearch, loadMorePosts);
        }
        return () => {};
    }, [isOpen, isPluginSearch, isPageSearch, isPostSearch, currentPage, totalPages, loadingMore, searchTerm, setupScrollHandler, loadMorePlugins, loadMorePages, loadMorePosts]);

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
            } else if (isPostSearch && !isPostActionMenu) {
                event.preventDefault();
                setIsPostSearch(false);
            } else if (isPostActionMenu) {
                event.preventDefault();
                setIsPostActionMenu(false);
                setSelectedPage(null);
            }
        }
    }, [isOpen, isPluginSearch, isPageSearch, isPageActionMenu, isPostSearch, isPostActionMenu, searchTerm]);

    // Add keyboard shortcut for Backspace/Delete to return to main search from plugin search
    useKeyboardShortcut({ key: 'Backspace' }, handleNavigationKeyShortcut);

    // Also handle Delete key the same way
    useKeyboardShortcut({ key: 'Delete' }, handleNavigationKeyShortcut);

    // Set up focus trap when command bar is open
    useEffect(() => {
        if (isOpen && modalRef.current) {
            return useFocusTrap(modalRef.current, closeCommandBar);
        }
        return () => {};
    }, [isOpen, closeCommandBar]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="lexia-command-modal-overlay components-modal__screen-overlay">
            <Command className="lexia-command-modal" label="Command Menu" ref={modalRef}>
                <div className="components-modal__header">
                    <div className="components-modal__header-heading" id="lexia-command-dialog-title">
                        {isPluginSearch ? __('Search WordPress Plugins', 'lexia-command') : 
                         isPageSearch && !isPageActionMenu ? __('Search Pages', 'lexia-command') :
                         isPageActionMenu ? __('Page Actions', 'lexia-command') :
                         isPostSearch && !isPostActionMenu ? __('Search Posts', 'lexia-command') :
                         isPostActionMenu ? __('Post Actions', 'lexia-command') :
                         __('LexiaCommand', 'lexia-command')}
                    </div>
                    
                    {/* Add accessibility menu */}
                    <AccessibilityMenu
                        highContrast={highContrast}
                        setHighContrast={setHighContrast}
                        reducedMotion={reducedMotion}
                        setReducedMotion={setReducedMotion}
                        largerFontSize={largerFontSize}
                        setLargerFontSize={setLargerFontSize}
                    />
                    
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
                                announceToScreenReader(__('Page search mode activated', 'lexia-command'));
                            }}
                            />
                        </div>
                    ) : isPostActionMenu && selectedPage ? (
                        // Render PostActionMenu as a completely separate screen
                        <div className="lexia-command-container">
                            <PostActionMenu
                                post={selectedPage}
                                closeCommandBar={closeCommandBar}
                                onBack={() => {
                                    setIsPostActionMenu(false);
                                    setSelectedPage(null);
                                announceToScreenReader(__('Post search mode activated', 'lexia-command'));
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
                                ) : isPostSearch ? (
                                    <PostSearchResults
                                        postResults={postResults}
                                        searchTerm={searchTerm}
                                        selectedIndex={selectedIndex}
                                        setSelectedIndex={setSelectedIndex}
                                        loadingMore={loadingMore}
                                        hasMorePosts={currentPage < totalPages}
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
                                    <NoCommandSuggestion searchTerm={searchTerm} />
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
