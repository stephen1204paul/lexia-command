/**
 * OptimizedCommandBar
 * Simplified, fast command bar with hybrid loading approach
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useSmartSearch, SEARCH_CATEGORIES } from '../hooks/useSmartSearch';
import { useCommandCache } from '../hooks/useCommandCache';
import { performanceTracker, startPerformanceSession, endPerformanceSession, measureOperation, OPERATION_TYPES } from '../utils/performanceMonitor';
import { useFocusTrap, announceToScreenReader } from '../utils/accessibility';
import { initializeTheme, isDarkModeEnabled } from '../utils/theme';
import AccessibilityMenu from './AccessibilityMenu';
import CommandTooltips from './CommandTooltips';
import ShortcutSettings from './ShortcutSettings';
import '../css/command-bar.css';
import '../css/accessibility-menu.css';
import '../css/dark-mode.css';
import '../css/command-tooltips.css';
import '../css/shortcut-settings.css';

/**
 * Command execution handler
 */
const executeCommand = (command, closeCommandBar, trackUsage) => {
    measureOperation(OPERATION_TYPES.USER_INTERACTION, 'command_execute', () => {
        console.log('🚀 Executing command:', command.id, command);
        
        // Track usage for popularity
        trackUsage(command.id);
        
        // Execute the command action
        if (command.action && typeof command.action === 'function') {
            const result = command.action();
            
            // If action returns false, don't close command bar
            if (result === false) {
                return;
            }
        } else if (command.url) {
            // Navigate to URL
            window.location.href = window.lexiaCommandData?.adminUrl + command.url;
        } else if (command.data) {
            // Handle data-based commands (like edit post/page)
            if (command.data.id && command.category === 'content') {
                const editUrl = `post.php?post=${command.data.id}&action=edit`;
                window.location.href = window.lexiaCommandData?.adminUrl + editUrl;
            }
        }
        
        // Close command bar after execution
        closeCommandBar();
    });
};

/**
 * Main OptimizedCommandBar Component
 */
function OptimizedCommandBar() {
    // Core state
    const [isOpen, setIsOpen] = useState(false);
    const [currentView, setCurrentView] = useState('default'); // default, shortcut_settings, accessibility_menu
    const [previouslyFocusedElement, setPreviouslyFocusedElement] = useState(null);
    
    // Accessibility state
    const [highContrast, setHighContrast] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [largerFontSize, setLargerFontSize] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    
    // Refs
    const modalRef = useRef(null);
    const inputRef = useRef(null);
    const sessionRef = useRef(null);
    
    // Hooks
    const commandCache = useCommandCache();
    const smartSearch = useSmartSearch({
        category: SEARCH_CATEGORIES.ALL,
        enablePredictive: true,
        enableHighlights: true,
        groupResults: false
    });
    
    // Focus trap
    useFocusTrap(modalRef, isOpen);
    
    /**
     * Open command bar with performance tracking
     */
    const openCommandBar = useCallback(() => {
        measureOperation(OPERATION_TYPES.USER_INTERACTION, 'command_bar_open', () => {
            console.log('🚀 Opening command bar');
            
            // Start performance session
            sessionRef.current = startPerformanceSession(`commandbar-${Date.now()}`);
            
            // Store previously focused element
            setPreviouslyFocusedElement(document.activeElement);
            
            // Reset to default view
            setCurrentView('default');
            
            // Clear any previous search
            smartSearch.clearSearch();
            
            // Open the modal
            setIsOpen(true);
            
            // Announce to screen readers
            announceToScreenReader(__('Command bar opened', 'lexia-command'));
        });
    }, [smartSearch]);
    
    /**
     * Close command bar with performance tracking
     */
    const closeCommandBar = useCallback(() => {
        measureOperation(OPERATION_TYPES.USER_INTERACTION, 'command_bar_close', () => {
            console.log('🚀 Closing command bar');
            
            setIsOpen(false);
            setCurrentView('default');
            smartSearch.clearSearch();
            
            // End performance session
            if (sessionRef.current) {
                const session = endPerformanceSession();
                console.log('📊 Session performance:', session?.analysis);
            }
            
            // Restore focus
            if (previouslyFocusedElement && previouslyFocusedElement.focus) {
                setTimeout(() => {
                    previouslyFocusedElement.focus();
                    setPreviouslyFocusedElement(null);
                }, 100);
            }
            
            // Announce to screen readers
            announceToScreenReader(__('Command bar closed', 'lexia-command'));
        });
    }, [smartSearch, previouslyFocusedElement]);
    
    /**
     * Handle search input changes
     */
    const handleSearchChange = useCallback((value) => {
        measureOperation(OPERATION_TYPES.SEARCH, 'search_input', async () => {
            console.log('🔍 Search input changed:', value);
            await smartSearch.search(value);
        });
    }, [smartSearch]);
    
    /**
     * Handle command selection
     */
    const handleCommandSelect = useCallback((commandId) => {
        const command = smartSearch.results.find(cmd => 
            cmd.id === commandId || `command-${cmd.id}` === commandId
        );
        
        if (command) {
            executeCommand(command, closeCommandBar, commandCache.trackCommandUsage);
        }
    }, [smartSearch.results, closeCommandBar, commandCache]);
    
    /**
     * Handle keyboard shortcuts
     */
    const handleKeyDown = useCallback((event) => {
        // Close with Escape
        if (event.key === 'Escape') {
            event.preventDefault();
            closeCommandBar();
            return;
        }
        
        // Handle numbered shortcuts (1-9)
        if (event.key >= '1' && event.key <= '9') {
            const index = parseInt(event.key) - 1;
            if (index < smartSearch.results.length) {
                event.preventDefault();
                const command = smartSearch.results[index];
                executeCommand(command, closeCommandBar, commandCache.trackCommandUsage);
            }
        }
    }, [smartSearch.results, closeCommandBar, commandCache]);
    
    /**
     * Setup keyboard shortcuts for opening command bar
     */
    useKeyboardShortcut(['cmd+k', 'ctrl+k'], openCommandBar);
    useKeyboardShortcut(['alt+cmd+k', 'alt+ctrl+k'], openCommandBar);
    
    /**
     * Setup custom event listeners
     */
    useEffect(() => {
        const handleShortcutSettings = () => {
            setCurrentView('shortcut_settings');
        };
        
        const handleAccessibilityMenu = () => {
            setCurrentView('accessibility_menu');
        };
        
        const handleBackToMain = () => {
            setCurrentView('default');
        };
        
        window.addEventListener('lexiaCommand:openShortcutSettings', handleShortcutSettings);
        window.addEventListener('lexiaCommand:openAccessibilityMenu', handleAccessibilityMenu);
        window.addEventListener('lexiaCommand:backToMain', handleBackToMain);
        
        return () => {
            window.removeEventListener('lexiaCommand:openShortcutSettings', handleShortcutSettings);
            window.removeEventListener('lexiaCommand:openAccessibilityMenu', handleAccessibilityMenu);
            window.removeEventListener('lexiaCommand:backToMain', handleBackToMain);
        };
    }, []);
    
    /**
     * Initialize accessibility settings
     */
    useEffect(() => {
        const initializeAccessibility = () => {
            measureOperation(OPERATION_TYPES.CACHE_ACCESS, 'accessibility_init', () => {
                // Initialize theme
                initializeTheme();
                setDarkMode(isDarkModeEnabled());
                
                // Load accessibility preferences
                const savedHighContrast = localStorage.getItem('lexia-high-contrast') === 'true';
                const savedReducedMotion = localStorage.getItem('lexia-reduced-motion') === 'true';
                const savedLargerFont = localStorage.getItem('lexia-larger-font') === 'true';
                
                setHighContrast(savedHighContrast);
                setReducedMotion(savedReducedMotion);
                setLargerFontSize(savedLargerFont);
            });
        };
        
        initializeAccessibility();
    }, []);
    
    /**
     * Focus input when command bar opens
     */
    useEffect(() => {
        if (isOpen && currentView === 'default' && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, currentView]);
    
    /**
     * Render command results
     */
    const renderResults = () => {
        if (smartSearch.isSearching) {
            return (
                <Command.Empty className="lexia-command-loading">
                    {__('Searching...', 'lexia-command')} ⚡
                </Command.Empty>
            );
        }
        
        if (smartSearch.results.length === 0) {
            return (
                <Command.Empty className="lexia-command-no-results">
                    {smartSearch.query 
                        ? __('No results found', 'lexia-command')
                        : __('Type to search commands...', 'lexia-command')
                    }
                </Command.Empty>
            );
        }
        
        return (
            <Command.Group>
                {smartSearch.results.slice(0, 10).map((command, index) => (
                    <Command.Item
                        key={command.id}
                        value={`command-${command.id}`}
                        onSelect={handleCommandSelect}
                        className="lexia-command-result"
                        data-index={index}
                    >
                        <div className="lexia-command-result-icon">
                            {command.icon || '⚡'}
                        </div>
                        <div className="lexia-command-result-content">
                            <div className="lexia-command-result-title">
                                {command.title}
                            </div>
                            {command.description && (
                                <div className="lexia-command-result-description">
                                    {command.description}
                                </div>
                            )}
                        </div>
                        <div className="lexia-command-result-meta">
                            <span className="lexia-command-shortcut">
                                {index < 9 ? `⌘${index + 1}` : ''}
                            </span>
                        </div>
                    </Command.Item>
                ))}
                
                {smartSearch.hasMore && (
                    <Command.Item 
                        className="lexia-command-more-hint" 
                        value="more-results"
                    >
                        <div className="lexia-command-more-hint-text">
                            {__('Continue typing for more results...', 'lexia-command')}
                        </div>
                    </Command.Item>
                )}
            </Command.Group>
        );
    };
    
    /**
     * Render current view content
     */
    const renderViewContent = () => {
        switch (currentView) {
            case 'shortcut_settings':
                return (
                    <div className="lexia-command-container">
                        <ShortcutSettings onBack={() => setCurrentView('default')} />
                    </div>
                );
                
            case 'accessibility_menu':
                return (
                    <div className="lexia-command-container">
                        <AccessibilityMenu
                            highContrast={highContrast}
                            setHighContrast={setHighContrast}
                            reducedMotion={reducedMotion}
                            setReducedMotion={setReducedMotion}
                            largerFontSize={largerFontSize}
                            setLargerFontSize={setLargerFontSize}
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                            onBack={() => setCurrentView('default')}
                        />
                    </div>
                );
                
            default:
                return (
                    <CommandTooltips commands={smartSearch.results.slice(0, 10)} enabled={true}>
                        <Command 
                            className="lexia-command-content" 
                            label="Command Menu"
                            filter={() => 1} // Disable cmdk filtering (we handle it)
                            shouldFilter={false}
                            onKeyDown={handleKeyDown}
                        >
                            <Command.Input 
                                ref={inputRef}
                                value={smartSearch.query}
                                onValueChange={handleSearchChange}
                                placeholder={__('Search commands, content, and more...', 'lexia-command')}
                                className="lexia-command-search"
                                autoComplete="off"
                                autoFocus
                            />
                            
                            <Command.List className="lexia-command-results">
                                {renderResults()}
                            </Command.List>
                            
                            {/* Performance indicator in development */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="lexia-command-perf-indicator">
                                    ⚡ {smartSearch.searchTime?.toFixed(1)}ms | 
                                    📊 {smartSearch.resultCount} results |
                                    💾 {commandCache.cacheStats?.searchCache || 0} cached
                                </div>
                            )}
                        </Command>
                    </CommandTooltips>
                );
        }
    };
    
    // Don't render if not open
    if (!isOpen) {
        return null;
    }
    
    return (
        <div className="lexia-command-modal-overlay" onClick={closeCommandBar}>
            <div 
                ref={modalRef}
                className="lexia-command-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="lexia-command-title"
                aria-describedby="lexia-command-description"
                data-high-contrast={highContrast}
                data-reduced-motion={reducedMotion}
                data-larger-font={largerFontSize}
            >
                {/* Header */}
                <div className="lexia-command-header">
                    <div className="lexia-command-title-section">
                        <h2 id="lexia-command-title" className="lexia-command-title">
                            {currentView === 'shortcut_settings' 
                                ? __('Keyboard Shortcuts', 'lexia-command')
                                : currentView === 'accessibility_menu'
                                ? __('Accessibility Settings', 'lexia-command')
                                : __('Command Bar', 'lexia-command')
                            }
                        </h2>
                        <div className="lexia-command-status">
                            {commandCache.loadingPhase === 'background' && '🔄 Loading...'}
                            {commandCache.isReady && '✅ Ready'}
                            {smartSearch.isSearching && '🔍 Searching...'}
                        </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="lexia-command-quick-actions">
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
                </div>
                
                {/* Content */}
                {renderViewContent()}
                
                <div id="lexia-command-description" className="sr-only">
                    {__('Use this command bar to quickly search and execute actions. Type to search, use arrow keys to navigate, and press Enter to execute.', 'lexia-command')}
                </div>
            </div>
        </div>
    );
}

export default OptimizedCommandBar;