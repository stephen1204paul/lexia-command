import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

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
 */
function AccessibilityMenu({ 
    highContrast, 
    setHighContrast, 
    reducedMotion, 
    setReducedMotion, 
    largerFontSize, 
    setLargerFontSize 
}) {
    const [isOpen, setIsOpen] = useState(false);

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

    // Toggle high contrast mode
    const handleHighContrastToggle = () => {
        setHighContrast(!highContrast);
    };

    // Toggle reduced motion mode
    const handleReducedMotionToggle = () => {
        setReducedMotion(!reducedMotion);
    };

    // Toggle larger font size mode
    const handleLargerFontSizeToggle = () => {
        setLargerFontSize(!largerFontSize);
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
                    role="menu"
                >
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