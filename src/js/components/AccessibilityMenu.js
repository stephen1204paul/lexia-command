import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { 
    isDarkModeEnabled, 
    toggleDarkMode as toggleDarkModeUtil,
    getThemePreference,
    setThemePreference 
} from '../utils/theme';
import { announceToScreenReader } from '../utils/accessibility';

/**
 * AccessibilityMenu component provides accessibility options for the command bar
 * 
 * @param {Object} props Component props
 * @param {boolean} props.highContrast Whether high contrast mode is enabled
 * @param {Function} props.setHighContrast Function to set high contrast mode
 * @param {boolean} props.reducedMotion Whether reduced motion mode is enabled
 * @param {Function} props.setReducedMotion Function to set reduced motion mode
 * @param {boolean} props.largerFontSize Whether larger font size mode is enabled
 * @param {Function} props.setLargerFontSize Function to set larger font size mode
 * @param {boolean} props.darkMode Whether dark mode is enabled
 * @param {Function} props.setDarkMode Function to set dark mode
 * @param {boolean} props.showAdvanced Whether to show advanced options
 */
function AccessibilityMenu({ 
    highContrast, 
    setHighContrast, 
    reducedMotion, 
    setReducedMotion, 
    largerFontSize, 
    setLargerFontSize,
    darkMode,
    setDarkMode,
    showAdvanced = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [themePreference, setThemePref] = useState(getThemePreference());

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const menu = document.querySelector('.lexia-accessibility-menu');
            if (menu && !menu.contains(event.target) && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Update theme preference when it changes
    useEffect(() => {
        setThemePref(getThemePreference());
    }, [darkMode]);

    // Setup keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey) {
                switch(e.key.toLowerCase()) {
                    case 'd':
                        e.preventDefault();
                        handleDarkModeToggle();
                        break;
                    case 'h':
                        e.preventDefault();
                        handleHighContrastToggle();
                        break;
                    case 'm':
                        e.preventDefault();
                        handleReducedMotionToggle();
                        break;
                    case 'f':
                        e.preventDefault();
                        handleLargerFontSizeToggle();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [highContrast, reducedMotion, largerFontSize, darkMode]);

    // Toggle dark mode
    const handleDarkModeToggle = async () => {
        console.log('🌙 AccessibilityMenu: Dark mode toggle clicked');
        console.log('🌙 AccessibilityMenu: Current darkMode state:', darkMode);
        
        const newState = await toggleDarkModeUtil();
        console.log('🌙 AccessibilityMenu: toggleDarkModeUtil returned:', newState);
        
        setDarkMode(newState);
        console.log('🌙 AccessibilityMenu: Called setDarkMode with:', newState);
        
        announceToScreenReader(newState ? __('Dark mode enabled', 'lexia-command') : __('Dark mode disabled', 'lexia-command'));
    };

    // Toggle high contrast mode
    const handleHighContrastToggle = () => {
        setHighContrast(!highContrast);
        announceToScreenReader(!highContrast ? __('High contrast mode enabled', 'lexia-command') : __('High contrast mode disabled', 'lexia-command'));
    };

    // Toggle reduced motion mode
    const handleReducedMotionToggle = () => {
        setReducedMotion(!reducedMotion);
        announceToScreenReader(!reducedMotion ? __('Reduced motion enabled', 'lexia-command') : __('Reduced motion disabled', 'lexia-command'));
    };

    // Toggle larger font size mode
    const handleLargerFontSizeToggle = () => {
        setLargerFontSize(!largerFontSize);
        announceToScreenReader(!largerFontSize ? __('Larger font size enabled', 'lexia-command') : __('Larger font size disabled', 'lexia-command'));
    };

    // Handle theme preference change
    const handleThemePreferenceChange = (e) => {
        const newTheme = e.target.value;
        setThemePref(newTheme);
        setThemePreference(newTheme);
        announceToScreenReader(__(`Theme preference set to ${newTheme}`, 'lexia-command'));
    };

    return (
        <div className="lexia-accessibility-menu" role="menu" aria-label={__('Accessibility options', 'lexia-command')}>
            <button 
                className="lexia-accessibility-button" 
                aria-haspopup="true" 
                aria-expanded={isOpen ? 'true' : 'false'}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={__('Accessibility options', 'lexia-command')}
            >
                <span className="dashicons dashicons-universal-access"></span>
                <span className="screen-reader-text">{__('Accessibility options', 'lexia-command')}</span>
            </button>
            
            {isOpen && (
                <div 
                    className="lexia-accessibility-options" 
                    role="group"
                    aria-label={__('Accessibility settings', 'lexia-command')}
                >
                    <div 
                        className="lexia-accessibility-option" 
                        role="menuitem" 
                        tabIndex="0"
                        onClick={handleDarkModeToggle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleDarkModeToggle();
                            }
                        }}
                    >
                        <div className="lexia-accessibility-option-label">
                            <span>{__('Dark Mode', 'lexia-command')}</span>
                        </div>
                        <label className="lexia-accessibility-toggle" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox"
                                checked={darkMode}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleDarkModeToggle();
                                }}
                                aria-label={__('Dark Mode', 'lexia-command')}
                            />
                            <span className="lexia-accessibility-slider"></span>
                        </label>
                        <span className="lexia-accessibility-shortcut">Alt+D</span>
                    </div>

                    {showAdvanced && (
                        <div className="lexia-accessibility-option lexia-theme-selector">
                            <label htmlFor="theme-preference">
                                <span>{__('Theme Preference', 'lexia-command')}</span>
                            </label>
                            <select 
                                id="theme-preference"
                                value={themePreference}
                                onChange={handleThemePreferenceChange}
                                aria-label={__('Theme Preference', 'lexia-command')}
                            >
                                <option value="light">{__('Light', 'lexia-command')}</option>
                                <option value="dark">{__('Dark', 'lexia-command')}</option>
                                <option value="system">{__('System', 'lexia-command')}</option>
                            </select>
                        </div>
                    )}
                    
                    <div 
                        className="lexia-accessibility-option" 
                        role="menuitem" 
                        tabIndex="0"
                        onClick={handleHighContrastToggle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleHighContrastToggle();
                            }
                        }}
                    >
                        <div className="lexia-accessibility-option-label">
                            <span>{__('High Contrast Mode', 'lexia-command')}</span>
                        </div>
                        <label className="lexia-accessibility-toggle" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox" 
                                checked={highContrast} 
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleHighContrastToggle();
                                }}
                                aria-label={__('High Contrast', 'lexia-command')}
                            />
                            <span className="lexia-accessibility-slider"></span>
                        </label>
                        <span className="lexia-accessibility-shortcut">Alt+H</span>
                    </div>
                    
                    <div 
                        className="lexia-accessibility-option" 
                        role="menuitem" 
                        tabIndex="0"
                        onClick={handleReducedMotionToggle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleReducedMotionToggle();
                            }
                        }}
                    >
                        <div className="lexia-accessibility-option-label">
                            <span>{__('Reduced Motion', 'lexia-command')}</span>
                        </div>
                        <label className="lexia-accessibility-toggle" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox" 
                                checked={reducedMotion} 
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleReducedMotionToggle();
                                }}
                                aria-label={__('Reduced Motion', 'lexia-command')}
                            />
                            <span className="lexia-accessibility-slider"></span>
                        </label>
                        <span className="lexia-accessibility-shortcut">Alt+M</span>
                    </div>
                    
                    <div 
                        className="lexia-accessibility-option" 
                        role="menuitem" 
                        tabIndex="0"
                        onClick={handleLargerFontSizeToggle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleLargerFontSizeToggle();
                            }
                        }}
                    >
                        <div className="lexia-accessibility-option-label">
                            <span>{__('Larger Font Size', 'lexia-command')}</span>
                        </div>
                        <label className="lexia-accessibility-toggle" onClick={(e) => e.stopPropagation()}>
                            <input 
                                type="checkbox" 
                                checked={largerFontSize} 
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleLargerFontSizeToggle();
                                }}
                                aria-label={__('Larger Text', 'lexia-command')}
                            />
                            <span className="lexia-accessibility-slider"></span>
                        </label>
                        <span className="lexia-accessibility-shortcut">Alt+F</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AccessibilityMenu;