/**
 * Enhanced Accessibility utilities for Lexia Command
 */

import { announceToScreenReader, useFocusTrap, toggleHighContrast, isHighContrastEnabled, addFocusStyles } from './accessibility';

/**
 * Manages focus when command bar opens and closes
 * @param {boolean} isOpen - Whether the command bar is open
 * @param {React.RefObject} modalRef - Reference to the modal container
 * @param {HTMLElement} previouslyFocusedElement - Element that had focus before opening
 */
export const manageFocus = (isOpen, modalRef, previouslyFocusedElement) => {
  if (isOpen && modalRef.current) {
    // When opening, focus the first focusable element in the modal
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  } else if (previouslyFocusedElement) {
    // When closing, return focus to the element that had focus before opening
    previouslyFocusedElement.focus();
  }
};

/**
 * Adds necessary ARIA attributes to command bar elements
 * @param {HTMLElement} container - The command bar container
 */
export const addAriaAttributes = (container) => {
  if (!container) return;
  
  // Set appropriate ARIA roles and attributes
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-modal', 'true');
  container.setAttribute('aria-labelledby', 'lexia-command-dialog-title');
  
  // Find the search input and add appropriate attributes
  const searchInput = container.querySelector('.lexia-command-search');
  if (searchInput) {
    searchInput.setAttribute('aria-autocomplete', 'list');
    searchInput.setAttribute('aria-controls', 'lexia-command-results');
    searchInput.setAttribute('aria-expanded', 'true');
  }
  
  // Find the results container and add appropriate attributes
  const resultsContainer = container.querySelector('.lexia-command-results');
  if (resultsContainer) {
    resultsContainer.setAttribute('role', 'listbox');
    resultsContainer.setAttribute('id', 'lexia-command-results');
    resultsContainer.setAttribute('aria-label', 'Command results');
  }
  
  // Find all result items and add appropriate attributes
  const resultItems = container.querySelectorAll('.lexia-command-result');
  resultItems.forEach((item, index) => {
    item.setAttribute('role', 'option');
    item.setAttribute('id', `lexia-command-result-${index}`);
    
    // Check if this item is selected
    const isSelected = item.getAttribute('data-selected') === 'true';
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
};

/**
 * Adds keyboard shortcuts for accessibility features
 * @param {Function} toggleHighContrastCallback - Function to toggle high contrast mode
 * @param {Function} toggleReducedMotionCallback - Function to toggle reduced motion
 * @param {Function} toggleFontSizeCallback - Function to toggle larger font size
 */
export const setupAccessibilityShortcuts = (toggleHighContrastCallback, toggleReducedMotionCallback, toggleFontSizeCallback) => {
  const handleKeyDown = (e) => {
    // Only handle keyboard shortcuts when command bar is open
    if (!document.querySelector('.lexia-command-modal')) {
      return;
    }
    
    // Alt+H: Toggle high contrast mode
    if (e.altKey && e.key === 'h') {
      e.preventDefault();
      toggleHighContrastCallback();
    }
    
    // Alt+M: Toggle reduced motion
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      toggleReducedMotionCallback();
    }
    
    // Alt+F: Toggle larger font size
    if (e.altKey && e.key === 'f') {
      e.preventDefault();
      toggleFontSizeCallback();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Toggles reduced motion mode
 * @param {boolean} enabled - Whether reduced motion mode should be enabled
 */
export const toggleReducedMotion = (enabled) => {
  const id = 'lexia-command-reduced-motion-styles';
  let styleElement = document.getElementById(id);
  
  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = id;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .lexia-command-modal-overlay {
        transition: none !important;
      }
      
      .lexia-command-modal {
        animation: none !important;
      }
      
      .lexia-command-result {
        transition: none !important;
      }
    `;
  } else if (styleElement) {
    styleElement.remove();
  }
  
  // Save preference to localStorage
  localStorage.setItem('lexiaCommandReducedMotion', enabled ? 'true' : 'false');
  
  // Announce to screen readers
  announceToScreenReader(enabled ? 'Reduced motion mode enabled' : 'Reduced motion mode disabled');
};

/**
 * Check if reduced motion mode is enabled
 * @returns {boolean} Whether reduced motion mode is enabled
 */
export const isReducedMotionEnabled = () => {
  // Check user preference first
  const userPreference = localStorage.getItem('lexiaCommandReducedMotion');
  if (userPreference !== null) {
    return userPreference === 'true';
  }
  
  // If no user preference is set, check system preference
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Toggles larger font size mode
 * @param {boolean} enabled - Whether larger font size mode should be enabled
 */
export const toggleLargerFontSize = (enabled) => {
  const id = 'lexia-command-larger-font-styles';
  let styleElement = document.getElementById(id);
  
  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = id;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .lexia-command-modal {
        font-size: 1.2em !important;
      }
      
      .lexia-command-search {
        font-size: 1.2em !important;
      }
      
      .lexia-command-result-title {
        font-size: 1.2em !important;
      }
      
      .lexia-command-suggestion-button {
        font-size: 1.2em !important;
      }
    `;
  } else if (styleElement) {
    styleElement.remove();
  }
  
  // Save preference to localStorage
  localStorage.setItem('lexiaCommandLargerFont', enabled ? 'true' : 'false');
  
  // Announce to screen readers
  announceToScreenReader(enabled ? 'Larger font size enabled' : 'Larger font size disabled');
};

/**
 * Check if larger font size mode is enabled
 * @returns {boolean} Whether larger font size mode is enabled
 */
export const isLargerFontSizeEnabled = () => {
  return localStorage.getItem('lexiaCommandLargerFont') === 'true';
};

/**
 * Creates an accessibility menu with various options
 * @param {Object} options - Configuration options
 * @param {boolean} options.highContrast - Whether high contrast mode is enabled
 * @param {Function} options.toggleHighContrast - Function to toggle high contrast mode
 * @param {boolean} options.reducedMotion - Whether reduced motion mode is enabled
 * @param {Function} options.toggleReducedMotion - Function to toggle reduced motion
 * @param {boolean} options.largerFontSize - Whether larger font size mode is enabled
 * @param {Function} options.toggleLargerFontSize - Function to toggle larger font size
 * @returns {HTMLElement} The created accessibility menu element
 */
export const createAccessibilityMenu = (options) => {
  const menu = document.createElement('div');
  menu.className = 'lexia-accessibility-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Accessibility options');
  
  // Create menu button
  const menuButton = document.createElement('button');
  menuButton.className = 'lexia-accessibility-button';
  menuButton.setAttribute('aria-haspopup', 'true');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.innerHTML = `
    <span class="dashicons dashicons-universal-access"></span>
    <span class="screen-reader-text">Accessibility options</span>
  `;
  
  // Create menu content
  const menuContent = document.createElement('div');
  menuContent.className = 'lexia-accessibility-options';
  menuContent.setAttribute('role', 'menu');
  menuContent.style.display = 'none';
  
  // Add high contrast option
  const highContrastOption = createMenuOption(
    'High Contrast Mode',
    options.highContrast,
    () => options.toggleHighContrast(!options.highContrast),
    'Alt+H'
  );
  
  // Add reduced motion option
  const reducedMotionOption = createMenuOption(
    'Reduced Motion',
    options.reducedMotion,
    () => options.toggleReducedMotion(!options.reducedMotion),
    'Alt+M'
  );
  
  // Add larger font size option
  const largerFontOption = createMenuOption(
    'Larger Font Size',
    options.largerFontSize,
    () => options.toggleLargerFontSize(!options.largerFontSize),
    'Alt+F'
  );
  
  // Add options to menu content
  menuContent.appendChild(highContrastOption);
  menuContent.appendChild(reducedMotionOption);
  menuContent.appendChild(largerFontOption);
  
  // Toggle menu when button is clicked
  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
    menuContent.style.display = !isExpanded ? 'block' : 'none';
    
    if (!isExpanded) {
      // Announce menu opened to screen readers
      announceToScreenReader('Accessibility options menu opened');
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && menuContent.style.display === 'block') {
      menuButton.setAttribute('aria-expanded', 'false');
      menuContent.style.display = 'none';
    }
  });
  
  // Add button and content to menu
  menu.appendChild(menuButton);
  menu.appendChild(menuContent);
  
  return menu;
};

/**
 * Creates a menu option for the accessibility menu
 * @param {string} label - The option label
 * @param {boolean} isEnabled - Whether the option is enabled
 * @param {Function} onToggle - Function to call when option is toggled
 * @param {string} shortcut - Keyboard shortcut for the option
 * @returns {HTMLElement} The created menu option element
 */
function createMenuOption(label, isEnabled, onToggle, shortcut) {
  const option = document.createElement('div');
  option.className = 'lexia-accessibility-option';
  option.setAttribute('role', 'menuitem');
  option.setAttribute('tabindex', '0');
  
  // Create option label container
  const labelContainer = document.createElement('div');
  labelContainer.className = 'lexia-accessibility-option-label';
  
  // Create label text
  const labelText = document.createElement('span');
  labelText.textContent = label;
  labelContainer.appendChild(labelText);
  
  // Create toggle switch
  const toggleContainer = document.createElement('label');
  toggleContainer.className = 'lexia-accessibility-toggle';
  
  // Create checkbox input
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = isEnabled;
  checkbox.addEventListener('change', onToggle);
  
  // Create slider
  const slider = document.createElement('span');
  slider.className = 'lexia-accessibility-slider';
  
  // Create shortcut
  const shortcutEl = document.createElement('span');
  shortcutEl.className = 'lexia-accessibility-shortcut';
  shortcutEl.textContent = shortcut;
  
  // Add elements to toggle container
  toggleContainer.appendChild(checkbox);
  toggleContainer.appendChild(slider);
  
  // Add elements to option
  option.appendChild(labelContainer);
  option.appendChild(toggleContainer);
  option.appendChild(shortcutEl);
  
  // Add event listeners for keyboard navigation
  option.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      onToggle();
    }
  });
  
  return option;
}

// Export all functions from the original accessibility.js
export { announceToScreenReader, useFocusTrap, toggleHighContrast, isHighContrastEnabled, addFocusStyles };