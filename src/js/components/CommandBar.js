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
import PluginActionMenu from './PluginActionMenu';
import InstalledPluginsResults from './InstalledPluginsResults';
import SearchResults from './SearchResults';
import NoCommandSuggestion from './NoCommandSuggestion';
import { useFocusTrap, announceToScreenReader, isHighContrastEnabled, toggleHighContrast, addFocusStyles } from '../utils/accessibility';
import { manageFocus, addAriaAttributes, setupAccessibilityShortcuts, toggleReducedMotion, isReducedMotionEnabled, toggleLargerFontSize, isLargerFontSizeEnabled } from '../utils/accessibilityEnhanced';
import { initializeTheme, isDarkModeEnabled } from '../utils/theme';
import AccessibilityMenu from './AccessibilityMenu';
import CommandTooltips from './CommandTooltips';
import CopyResults from './CopyResults';
import ShortcutSettings from './ShortcutSettings';
import '../css/command-bar.css';
import '../css/accessibility-menu.css';
import '../css/dark-mode.css';
import '../css/command-tooltips.css';
import '../css/copy-results.css';
import '../css/shortcut-settings.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [isPluginSearch, setIsPluginSearch] = useState(false);
    const [isInstalledPlugins, setIsInstalledPlugins] = useState(false);
    const [isPageSearch, setIsPageSearch] = useState(false);
    const [isPostSearch, setIsPostSearch] = useState(false);
    const [isPageActionMenu, setIsPageActionMenu] = useState(false);
    const [isPostActionMenu, setIsPostActionMenu] = useState(false);
    const [isPluginActionMenu, setIsPluginActionMenu] = useState(false);
    const [pluginResults, setPluginResults] = useState([]);
    const [installedPlugins, setInstalledPlugins] = useState([]);
    const [pageResults, setPageResults] = useState([]);
    const [postResults, setPostResults] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [selectedPlugin, setSelectedPlugin] = useState(null);
    const [highContrast, setHighContrast] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [largerFontSize, setLargerFontSize] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [previouslyFocusedElement, setPreviouslyFocusedElement] = useState(null);
    const [isShortcutSettingsOpen, setIsShortcutSettingsOpen] = useState(false);
    
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
        setupScrollHandler,
        fuzzySearchCommands,
        fuzzySearchWithHighlight
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

    // Load accessibility preferences and theme on mount
    useEffect(() => {
        console.log('🚀 CommandBar: Initializing on mount');
        console.log('🚀 CommandBar: window.lexiaCommandData:', window.lexiaCommandData);
        
        // Initialize theme
        initializeTheme();
        
        // Load high contrast preference
        setHighContrast(isHighContrastEnabled());
        
        // Load reduced motion preference
        setReducedMotion(isReducedMotionEnabled());
        
        // Load larger font size preference
        setLargerFontSize(isLargerFontSizeEnabled());
        
        // Load dark mode preference
        const initialDarkMode = isDarkModeEnabled();
        console.log('🚀 CommandBar: Initial dark mode from isDarkModeEnabled:', initialDarkMode);
        setDarkMode(initialDarkMode);
        
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
    
    // Listen for theme changes from other sources
    useEffect(() => {
        const handleThemeChange = () => {
            console.log('🎯 CommandBar: Received lexia-theme-change event');
            const newDarkMode = isDarkModeEnabled();
            console.log('🎯 CommandBar: isDarkModeEnabled returned:', newDarkMode);
            setDarkMode(newDarkMode);
            console.log('🎯 CommandBar: Called setDarkMode with:', newDarkMode);
        };
        
        window.addEventListener('lexia-theme-change', handleThemeChange);
        return () => window.removeEventListener('lexia-theme-change', handleThemeChange);
    }, []);
    
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
            const userCaps = window?.lexiaCommandData?.userCaps || {};
            
            if (command.category === COMMAND_CATEGORIES.PLUGINS && !userCaps.manage_options) {
                return false;
            }
            if (command.category === COMMAND_CATEGORIES.SETTINGS && !userCaps.manage_options) {
                // Special case for theme customization - allow if user has theme capabilities
                if (command.id === 'customize' && (userCaps.customize || userCaps.edit_theme_options)) {
                    // Allow access for users with theme capabilities
                } else {
                    return false;
                }
            }
            if (command.category === COMMAND_CATEGORIES.USERS && !userCaps.manage_options) {
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
            setIsInstalledPlugins(false);
            setIsPageSearch(false);
            setIsPostSearch(false);
            setIsPluginActionMenu(false);
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
    
    // Handle showing installed plugins
    useEffect(() => {
        const handleInstalledPlugins = async () => {
            setIsInstalledPlugins(true);
            setIsPluginSearch(false);
            setIsPageSearch(false);
            setIsPostSearch(false);
            setIsPluginActionMenu(false);
            resetSearch();
            setResults([]);
            
            // Fetch installed plugins
            setLoading(true);
            try {
                await fetchPluginStatuses();
                
                // Get the latest plugin statuses directly from the API
                const response = await apiFetch({
                    path: `/${window.lexiaCommandData.restNamespace}/get-plugin-statuses`,
                    method: 'GET'
                });
                
                const latestPluginStatuses = response.data || {};
                
                // Convert plugin statuses object to array of plugins
                const pluginsArray = Object.entries(latestPluginStatuses).map(([slug, status]) => ({
                    slug,
                    name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    active: status.active,
                    plugin_path: status.plugin_path
                }));
                
                setInstalledPlugins(pluginsArray);
                
                // Announce to screen readers
                announceToScreenReader(__('Installed plugins view activated', 'lexia-command'));
            } catch (error) {
                console.error('Failed to fetch installed plugins:', error);
            } finally {
                setLoading(false);
            }
        };

        window.addEventListener('lexiaCommand:showInstalledPlugins', handleInstalledPlugins);
        return () => window.removeEventListener('lexiaCommand:showInstalledPlugins', handleInstalledPlugins);
    }, [fetchPluginStatuses, resetSearch, setLoading]);
    
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
    
    // Handle plugin action menu
    useEffect(() => {
        const handlePluginActionMenu = (plugin) => {
            // First set the selected plugin
            setSelectedPlugin(plugin);
            // Then update the UI state to show the action menu
            setTimeout(() => {
                setIsPluginActionMenu(true);
                
                // Announce to screen readers
                announceToScreenReader(__('Plugin action menu opened', 'lexia-command'));
            }, 0);
        };

        // This is a function we'll pass to the InstalledPluginsResults component
        window.lexiaCommandHandlePluginActionMenu = handlePluginActionMenu;
        
        return () => {
            delete window.lexiaCommandHandlePluginActionMenu;
        };
    }, []);

    // Handle shortcut settings modal
    useEffect(() => {
        const handleOpenShortcutSettings = () => {
            setIsShortcutSettingsOpen(true);
            // Don't close the command bar, just show the settings in place
        };

        window.addEventListener('lexiaCommand:openShortcutSettings', handleOpenShortcutSettings);
        return () => window.removeEventListener('lexiaCommand:openShortcutSettings', handleOpenShortcutSettings);
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
                    
                    // Use fuzzy search for better command matching
                    const allCommands = getAvailableCommands();
                    const fuzzyResults = fuzzySearchCommands(allCommands, searchTerm, {
                        maxResults: 50,
                        scoreThreshold: 0.6
                    });
                    
                    // First set immediate results from fuzzy search
                    setResults(fuzzyResults);
                    
                    // Then fetch content search results with API call, passing all commands for fuzzy search
                    const searchResults = await searchCommandsAndContent(searchTerm, searchCommands, allCommands);
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
                    // Fallback to regular search if fuzzy search fails
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
        // Reset all states when opening command bar
        setIsOpen(true);
        setSelectedIndex(0);
        setIsShortcutSettingsOpen(false);
        resetSearch();
        setResults([]);
        setPluginResults([]);
        setPageResults([]);
        setIsPluginSearch(false);
        setIsPageSearch(false);
        setIsPostSearch(false);
        setIsPageActionMenu(false);
        setIsPostActionMenu(false);
        setIsPluginActionMenu(false);
        setIsInstalledPlugins(false);
        setSelectedPage(null);
        setSelectedPlugin(null);
    }, [setSelectedIndex, resetSearch]);

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
        setIsPluginActionMenu(false);
        setIsShortcutSettingsOpen(false);
        setSelectedPage(null);
        setSelectedPlugin(null);
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

    // Register keyboard shortcuts using the new mode
    const handleShortcutCommand = useCallback((command, event) => {
        console.log(`🔑 CommandBar: Handling shortcut command: ${command}, isOpen: ${isOpen}`);
        
        if (command === 'openCommand') {
            event.preventDefault();
            openCommandBar();
        } else if (command.startsWith('selectResult') && isOpen) {
            event.preventDefault();
            const resultNumber = parseInt(command.replace('selectResult', ''));
            const index = resultNumber - 1; // Convert to 0-based index
            
            // Get the appropriate results array based on current view
            let currentResults = [];
            if (isPluginSearch) {
                currentResults = pluginResults;
            } else if (isPageSearch) {
                currentResults = pageResults;
            } else if (isPostSearch) {
                currentResults = postResults;
            } else if (isInstalledPlugins) {
                currentResults = installedPlugins;
            } else {
                // If no specific search is active, use results or fall back to default commands
                currentResults = results.length > 0 ? results : getAvailableCommands();
            }
            
            console.log(`🔑 CommandBar: Trying to select result ${index + 1}, currentResults length: ${currentResults.length}`);
            console.log(`🔑 CommandBar: Current results:`, currentResults);
            
            // Execute the action for the selected result
            if (currentResults[index]) {
                console.log(`🔑 CommandBar: Executing action for result:`, currentResults[index]);
                const result = currentResults[index];
                
                // Handle different types of results
                if (isInstalledPlugins && window.lexiaCommandHandlePluginActionMenu) {
                    window.lexiaCommandHandlePluginActionMenu(result);
                } else if (isPageSearch && result.id) {
                    // Navigate to page
                    window.location.href = `${window.lexiaCommandData.adminUrl}post.php?post=${result.id}&action=edit`;
                } else if (isPostSearch && result.id) {
                    // Navigate to post
                    window.location.href = `${window.lexiaCommandData.adminUrl}post.php?post=${result.id}&action=edit`;
                } else if (isPluginSearch && result.slug) {
                    // Install or activate plugin
                    if (result.status === 'not-installed') {
                        installPlugin(result.slug);
                    } else if (result.status === 'inactive') {
                        activatePlugin(result.slug, result.plugin_path);
                    }
                } else if (result.action) {
                    // Execute command action
                    const shouldClose = result.action(closeCommandBar);
                    if (shouldClose !== false) {
                        closeCommandBar();
                    }
                }
            } else {
                console.log(`🔑 CommandBar: No result found at index ${index}`);
            }
        } else if (command.startsWith('selectResult')) {
            console.log(`🔑 CommandBar: selectResult shortcut triggered but command bar is not open`);
        }
    }, [isOpen, openCommandBar, closeCommandBar, isPluginSearch, isPageSearch, isPostSearch, 
        isInstalledPlugins, pluginResults, pageResults, postResults, installedPlugins, 
        results, installPlugin, activatePlugin]);

    // Register keyboard shortcuts with the new mode that loads custom shortcuts
    useKeyboardShortcut(handleShortcutCommand);

    // Handle navigation key shortcuts
    const handleNavigationKeyShortcut = useCallback((event) => {
        if (isOpen && !searchTerm) {
            if (isPluginSearch) {
                event.preventDefault();
                setIsPluginSearch(false);
            } else if (isInstalledPlugins && !isPluginActionMenu) {
                event.preventDefault();
                setIsInstalledPlugins(false);
            } else if (isPluginActionMenu) {
                event.preventDefault();
                setIsPluginActionMenu(false);
                setIsInstalledPlugins(true);
                setSelectedPlugin(null);
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
    }, [isOpen, isPluginSearch, isInstalledPlugins, isPluginActionMenu, isPageSearch, isPageActionMenu, isPostSearch, isPostActionMenu, searchTerm]);

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
        <>
        <div className="lexia-command-modal-overlay components-modal__screen-overlay">
            <div className="lexia-command-modal" ref={modalRef}>
                <div className="components-modal__header">
                    <div className="components-modal__header-heading" id="lexia-command-dialog-title">
                        {isShortcutSettingsOpen ? __('Keyboard Shortcuts Settings', 'lexia-command') :
                         isPluginSearch ? __('Search WordPress Plugins', 'lexia-command') : 
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
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
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
                
                <CommandTooltips commands={getAvailableCommands()} enabled={!isPluginSearch && !isPageSearch && !isPostSearch && !isShortcutSettingsOpen}>
                    {/* Conditionally render different screens based on state */}
                    {isPluginActionMenu && selectedPlugin ? (
                        // Render PluginActionMenu as a completely separate screen
                        <div className="lexia-command-container">
                            <PluginActionMenu
                                plugin={selectedPlugin}
                                closeCommandBar={closeCommandBar}
                                onBack={() => {
                                    setIsPluginActionMenu(false);
                                    setSelectedPlugin(null);
                                    setIsInstalledPlugins(true);
                                    announceToScreenReader(__('Installed plugins view activated', 'lexia-command'));
                                }}
                            />
                        </div>
                    ) : isPageActionMenu && selectedPage ? (
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
                        <Command 
                            className="lexia-command-content" 
                            label="Command Menu" 
                            filter={() => 1}
                            shouldFilter={false}
                        >
                            {!isShortcutSettingsOpen && (
                                <Command.Input 
                                    value={searchTerm}
                                    onValueChange={handleSearchTermChange}
                                    placeholder={isPluginSearch ? __('Search for plugins...', 'lexia-command') : 
                                              isInstalledPlugins ? __('Search installed plugins...', 'lexia-command') :
                                              isPageSearch ? __('Search for pages...', 'lexia-command') :
                                              __('Type a command or search...', 'lexia-command')}
                                    className="lexia-command-search"
                                    autoComplete="off"
                                    autoFocus
                                />
                            )}
                            
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
                                ) : isInstalledPlugins ? (
                                    <InstalledPluginsResults
                                        installedPlugins={installedPlugins}
                                        selectedIndex={selectedIndex}
                                        setSelectedIndex={setSelectedIndex}
                                        closeCommandBar={closeCommandBar}
                                        onSelectPlugin={window.lexiaCommandHandlePluginActionMenu}
                                    />
                                ) : isShortcutSettingsOpen ? (
                                    <ShortcutSettings
                                        onBack={() => {
                                            setIsShortcutSettingsOpen(false);
                                            announceToScreenReader(__('Returned to command bar', 'lexia-command'));
                                        }}
                                        closeCommandBar={closeCommandBar}
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
                            
                            {/* Copy Results functionality */}
                            {((isPluginSearch && pluginResults.length > 0) ||
                              (isPageSearch && pageResults.length > 0) ||
                              (isPostSearch && postResults.length > 0) ||
                              (results.length > 0 && searchTerm)) && (
                                <CopyResults 
                                    results={
                                        isPluginSearch ? pluginResults.map(p => ({ title: p.name, url: p.homepage || `https://wordpress.org/plugins/${p.slug}/` })) :
                                        isPageSearch ? pageResults.map(p => ({ title: p.title, url: p.link })) :
                                        isPostSearch ? postResults.map(p => ({ title: p.title, url: p.link })) :
                                        results.map(r => ({ title: r.title, description: r.description || '' }))
                                    }
                                    format="text"
                                    buttonText={
                                        isPluginSearch ? __('Copy Plugins', 'lexia-command') :
                                        isPageSearch ? __('Copy Pages', 'lexia-command') :
                                        isPostSearch ? __('Copy Posts', 'lexia-command') :
                                        __('Copy Results', 'lexia-command')
                                    }
                                />
                            )}
                        </Command>
                    )}
                </CommandTooltips>
            </div>
        </div>
        </>
    );
}

export default CommandBar;
