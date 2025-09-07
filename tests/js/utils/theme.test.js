/**
 * @jest-environment jsdom
 */

import { 
    isDarkModeEnabled, 
    toggleDarkMode, 
    enableDarkMode, 
    disableDarkMode,
    applyTheme,
    getThemePreference,
    setThemePreference
} from '../../../src/js/utils/theme';

describe('Theme Utilities', () => {
    beforeEach(() => {
        // Clear localStorage mock and document classes before each test
        jest.clearAllMocks();
        localStorage.getItem.mockReturnValue(null);
        localStorage.setItem.mockImplementation(() => {});
        localStorage.clear.mockImplementation(() => {});
        
        document.body.className = '';
        document.documentElement.className = '';
        
        // Mock localStorage behavior
        const storage = {};
        localStorage.getItem.mockImplementation((key) => storage[key] || null);
        localStorage.setItem.mockImplementation((key, value) => {
            storage[key] = value;
        });
    });

    describe('isDarkModeEnabled', () => {
        it('should return false when dark mode is not enabled', () => {
            expect(isDarkModeEnabled()).toBe(false);
        });

        it('should return true when dark mode is enabled in localStorage', () => {
            localStorage.setItem('lexia-command-dark-mode', 'true');
            expect(isDarkModeEnabled()).toBe(true);
        });

        it('should return false for invalid localStorage values', () => {
            localStorage.setItem('lexia-command-dark-mode', 'invalid');
            expect(isDarkModeEnabled()).toBe(false);
        });
    });

    describe('enableDarkMode', () => {
        it('should add dark mode class to document', () => {
            enableDarkMode();
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(true);
        });

        it('should save preference to localStorage', () => {
            enableDarkMode();
            expect(localStorage.getItem('lexia-command-dark-mode')).toBe('true');
        });

        it('should trigger custom event', () => {
            const mockHandler = jest.fn();
            window.addEventListener('lexia-theme-change', mockHandler);
            
            enableDarkMode();
            
            expect(mockHandler).toHaveBeenCalled();
            expect(mockHandler.mock.calls[0][0].detail).toEqual({ theme: 'dark' });
        });
    });

    describe('disableDarkMode', () => {
        it('should remove dark mode class from document', () => {
            document.documentElement.classList.add('lexia-command-dark-mode');
            disableDarkMode();
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(false);
        });

        it('should save preference to localStorage', () => {
            disableDarkMode();
            expect(localStorage.getItem('lexia-command-dark-mode')).toBe('false');
        });

        it('should trigger custom event', () => {
            const mockHandler = jest.fn();
            window.addEventListener('lexia-theme-change', mockHandler);
            
            disableDarkMode();
            
            expect(mockHandler).toHaveBeenCalled();
            expect(mockHandler.mock.calls[0][0].detail).toEqual({ theme: 'light' });
        });
    });

    describe('toggleDarkMode', () => {
        it('should enable dark mode when currently disabled', () => {
            toggleDarkMode();
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(true);
            expect(localStorage.getItem('lexia-command-dark-mode')).toBe('true');
        });

        it('should disable dark mode when currently enabled', () => {
            enableDarkMode();
            toggleDarkMode();
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(false);
            expect(localStorage.getItem('lexia-command-dark-mode')).toBe('false');
        });

        it('should return the new state', () => {
            expect(toggleDarkMode()).toBe(true); // Enabled
            expect(toggleDarkMode()).toBe(false); // Disabled
        });
    });

    describe('applyTheme', () => {
        it('should apply dark theme', () => {
            applyTheme('dark');
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(true);
        });

        it('should apply light theme', () => {
            document.documentElement.classList.add('lexia-command-dark-mode');
            applyTheme('light');
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(false);
        });

        it('should handle system theme based on media query', () => {
            // Mock matchMedia
            const mockMatchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }));
            
            window.matchMedia = mockMatchMedia;
            
            applyTheme('system');
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(true);
        });
    });

    describe('getThemePreference', () => {
        it('should return stored theme preference', () => {
            setThemePreference('dark');
            expect(getThemePreference()).toBe('dark');
        });

        it('should return light as default when no preference is stored', () => {
            expect(getThemePreference()).toBe('light');
        });

        it('should return system if set', () => {
            setThemePreference('system');
            expect(getThemePreference()).toBe('system');
        });
    });

    describe('setThemePreference', () => {
        it('should store theme preference in localStorage', () => {
            setThemePreference('dark');
            expect(localStorage.getItem('lexia-command-theme')).toBe('dark');
        });

        it('should apply the theme immediately', () => {
            setThemePreference('dark');
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(true);
        });

        it('should validate theme values', () => {
            setThemePreference('invalid');
            expect(localStorage.getItem('lexia-command-theme')).toBe('light');
        });
    });

    describe('Integration', () => {
        it('should persist theme preference across page loads', () => {
            // Simulate setting theme
            enableDarkMode();
            
            // Simulate page reload by clearing classes
            document.documentElement.className = '';
            
            // Apply stored theme
            if (isDarkModeEnabled()) {
                enableDarkMode();
            }
            
            expect(document.documentElement.classList.contains('lexia-command-dark-mode')).toBe(true);
        });

        it('should handle rapid toggles correctly', () => {
            for (let i = 0; i < 10; i++) {
                toggleDarkMode();
            }
            
            // After even number of toggles, should be in original state (disabled)
            expect(isDarkModeEnabled()).toBe(false);
        });
    });
});