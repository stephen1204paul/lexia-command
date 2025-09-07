/**
 * Theme management utilities for Lexia Command
 */

import apiFetch from '@wordpress/api-fetch';

const DARK_MODE_CLASS = 'lexia-command-dark-mode';

/**
 * Check if dark mode is currently enabled
 * @returns {boolean} True if dark mode is enabled
 */
export function isDarkModeEnabled() {
    console.log('🔍 theme.js: isDarkModeEnabled called');
    
    // Check if user data is available from WordPress
    if (window?.lexiaCommandData?.userPreferences?.darkMode !== undefined) {
        const dbValue = window.lexiaCommandData.userPreferences.darkMode;
        const result = dbValue === 'true' || dbValue === true;
        console.log('🔍 theme.js: Using DB value:', dbValue, '-> result:', result);
        return result;
    }
    
    // Fallback to localStorage for immediate responses
    try {
        const stored = localStorage.getItem('lexia-command-dark-mode');
        const result = stored === 'true';
        console.log('🔍 theme.js: Using localStorage value:', stored, '-> result:', result);
        return result;
    } catch (e) {
        console.log('🔍 theme.js: localStorage error, returning false');
        return false;
    }
}

/**
 * Enable dark mode
 */
export async function enableDarkMode() {
    console.log('🌙 theme.js: enableDarkMode called');
    document.documentElement.classList.add(DARK_MODE_CLASS);
    console.log('🌙 theme.js: Added CSS class to documentElement');
    
    // Update localStorage for immediate response
    try {
        localStorage.setItem('lexia-command-dark-mode', 'true');
        console.log('🌙 theme.js: Updated localStorage to true');
    } catch (e) {
        console.log('🌙 theme.js: localStorage error:', e);
    }
    
    // Save to WordPress database and wait for completion
    await saveUserPreference('darkMode', 'true');
    console.log('🌙 theme.js: Database save completed');
    
    // Dispatch custom event for components to react to theme change
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lexia-theme-change', { 
            detail: { theme: 'dark' } 
        }));
        console.log('🌙 theme.js: Dispatched lexia-theme-change event');
    }
}

/**
 * Disable dark mode
 */
export async function disableDarkMode() {
    console.log('🌕 theme.js: disableDarkMode called');
    console.trace('🌕 theme.js: Call stack for disableDarkMode:');
    document.documentElement.classList.remove(DARK_MODE_CLASS);
    console.log('🌕 theme.js: Removed CSS class from documentElement');
    
    // Update localStorage for immediate response
    try {
        localStorage.setItem('lexia-command-dark-mode', 'false');
        console.log('🌕 theme.js: Updated localStorage to false');
    } catch (e) {
        console.log('🌕 theme.js: localStorage error:', e);
    }
    
    // Save to WordPress database and wait for completion
    await saveUserPreference('darkMode', 'false');
    console.log('🌕 theme.js: Database save completed');
    
    // Dispatch custom event for components to react to theme change
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lexia-theme-change', { 
            detail: { theme: 'light' } 
        }));
        console.log('🌕 theme.js: Dispatched lexia-theme-change event');
    }
}

/**
 * Toggle dark mode on/off
 * @returns {boolean} The new state (true if enabled, false if disabled)
 */
export async function toggleDarkMode() {
    console.log('🔄 theme.js: toggleDarkMode called');
    const isEnabled = isDarkModeEnabled();
    console.log('🔄 theme.js: Current state is enabled:', isEnabled);
    
    if (isEnabled) {
        console.log('🔄 theme.js: Disabling dark mode');
        await disableDarkMode();
        return false;
    } else {
        console.log('🔄 theme.js: Enabling dark mode');
        await enableDarkMode();
        return true;
    }
}

/**
 * Apply a specific theme
 * @param {string} theme - 'light', 'dark', or 'system'
 */
export function applyTheme(theme) {
    if (theme === 'dark') {
        enableDarkMode();
    } else if (theme === 'light') {
        disableDarkMode();
    } else if (theme === 'system') {
        // Check system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    }
}

/**
 * Get the current theme preference
 * @returns {string} 'light', 'dark', or 'system'
 */
export function getThemePreference() {
    // Check if user data is available from WordPress
    if (window?.lexiaCommandData?.userPreferences?.theme !== undefined) {
        return window.lexiaCommandData.userPreferences.theme || 'light';
    }
    
    // Fallback to localStorage
    try {
        const stored = localStorage.getItem('lexia-command-theme');
        return stored || 'light';
    } catch (e) {
        return 'light';
    }
}

/**
 * Set and apply theme preference
 * @param {string} theme - 'light', 'dark', or 'system'
 */
export function setThemePreference(theme) {
    const validThemes = ['light', 'dark', 'system'];
    const validTheme = validThemes.includes(theme) ? theme : 'light';
    
    // Update localStorage for immediate response
    try {
        localStorage.setItem('lexia-command-theme', validTheme);
    } catch (e) {
        // Handle localStorage unavailable
    }
    
    // Save to WordPress database
    saveUserPreference('theme', validTheme);
    
    applyTheme(validTheme);
}

/**
 * Save user preference to WordPress database
 * @param {string} key - The preference key
 * @param {string} value - The preference value
 */
async function saveUserPreference(key, value) {
    try {
        await apiFetch({
            path: `/${window.lexiaCommandData.restNamespace}/save-user-preference`,
            method: 'POST',
            data: {
                key: key,
                value: value
            }
        });
        
        // Update the global user preferences object
        if (window.lexiaCommandData && window.lexiaCommandData.userPreferences) {
            window.lexiaCommandData.userPreferences[key] = value;
        }
    } catch (error) {
        console.error('Failed to save user preference:', error);
    }
}

/**
 * Initialize theme on page load
 */
export function initializeTheme() {
    console.log('🚀 theme.js: initializeTheme called');
    
    // Check if dark mode should be enabled based on saved preference
    const shouldBeEnabled = isDarkModeEnabled();
    console.log('🚀 theme.js: isDarkModeEnabled returned:', shouldBeEnabled);
    
    if (shouldBeEnabled) {
        document.documentElement.classList.add(DARK_MODE_CLASS);
        console.log('🚀 theme.js: Added dark mode class during init');
    } else {
        document.documentElement.classList.remove(DARK_MODE_CLASS);
        console.log('🚀 theme.js: Removed dark mode class during init');
    }
    
    // Don't call applyTheme here to avoid conflicts with darkMode preference
    // The individual darkMode preference takes precedence over theme preference
    
    // Listen for system theme changes only if using system preference
    const preference = getThemePreference();
    console.log('🚀 theme.js: theme preference:', preference);
    
    if (preference === 'system' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener((e) => {
            if (getThemePreference() === 'system') {
                if (e.matches) {
                    enableDarkMode();
                } else {
                    disableDarkMode();
                }
            }
        });
    }
}