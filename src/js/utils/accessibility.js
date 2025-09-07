/**
 * Accessibility utilities for Lexia Command
 */

/**
 * Announces messages to screen readers
 * @param {string} message - The message to announce
 */
export const announceToScreenReader = (message) => {
  const announcer = document.getElementById('lexia-command-live-region');
  
  // Create the live region if it doesn't exist
  if (!announcer) {
    const newAnnouncer = document.createElement('div');
    newAnnouncer.id = 'lexia-command-live-region';
    newAnnouncer.className = 'screen-reader-text';
    newAnnouncer.setAttribute('aria-live', 'polite');
    newAnnouncer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(newAnnouncer);
    return announceToScreenReader(message); // Retry with the new element
  }
  
  // Set the message
  announcer.textContent = message;
};

/**
 * Focus trap for modal dialogs
 * @param {HTMLElement} container - The container to trap focus within
 * @param {Function} onEscape - Callback when Escape key is pressed
 * @returns {Function} Cleanup function to remove event listeners
 */
export const useFocusTrap = (container, onEscape) => {
  if (!container) return () => {};
  
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return () => {};
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  // Set initial focus - prioritize search input if it exists
  const searchInput = container.querySelector('.lexia-command-search, [cmdk-input]');
  if (searchInput) {
    // Use setTimeout to ensure the focus happens after the component is fully rendered
    setTimeout(() => {
      searchInput.focus();
    }, 50);
  } else {
    firstElement.focus();
  }
  
  const handleKeyDown = (e) => {
    // Handle Escape key
    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }
    
    // Handle Tab key for focus trapping
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Creates a high contrast style element and toggles it
 * @param {boolean} enabled - Whether high contrast mode should be enabled
 * @returns {void}
 */
export const toggleHighContrast = (enabled) => {
  const id = 'lexia-command-high-contrast-styles';
  let styleElement = document.getElementById(id);
  
  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = id;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .lexia-command-modal {
        background: #000 !important;
        border: 2px solid #fff !important;
      }
      
      .lexia-command-search {
        background: #000 !important;
        border: 2px solid #fff !important;
        color: #fff !important;
      }
      
      .lexia-command-result[data-selected="true"] {
        background-color: #fff !important;
        color: #000 !important;
      }
      
      .lexia-command-suggestion-button {
        background-color: #000 !important;
        border: 2px solid #fff !important;
        color: #fff !important;
      }
      
      .lexia-command-suggestion-button:focus {
        outline: 2px solid #fff !important;
        outline-offset: 2px !important;
      }
    `;
  } else if (styleElement) {
    // Use cross-browser compatible removal method
    if (styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  }
  
  // Save preference to localStorage
  localStorage.setItem('lexiaCommandHighContrast', enabled ? 'true' : 'false');
  
  // Announce to screen readers
  announceToScreenReader(enabled ? 'High contrast mode enabled' : 'High contrast mode disabled');
};

/**
 * Check if high contrast mode is enabled
 * @returns {boolean} Whether high contrast mode is enabled
 */
export const isHighContrastEnabled = () => {
  return localStorage.getItem('lexiaCommandHighContrast') === 'true';
};

/**
 * Add focus styles to an element
 * @param {string} selector - CSS selector to apply focus styles to
 */
export const addFocusStyles = () => {
  const id = 'lexia-command-focus-styles';
  let styleElement = document.getElementById(id);
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = id;
    document.head.appendChild(styleElement);
    
    styleElement.textContent = `
      .lexia-command-result:focus,
      .lexia-command-search:focus,
      .lexia-command-suggestion-button:focus,
      .components-button:focus {
        outline: 2px solid #007cba !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 1px #007cba !important;
      }
    `;
  }
};