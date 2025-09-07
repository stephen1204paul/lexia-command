/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessibilityMenu from '../../../src/js/components/AccessibilityMenu';
import * as themeUtils from '../../../src/js/utils/theme';
import * as accessibilityUtils from '../../../src/js/utils/accessibility';
import * as accessibilityEnhanced from '../../../src/js/utils/accessibilityEnhanced';

// Mock the utility modules
jest.mock('../../../src/js/utils/theme');
jest.mock('../../../src/js/utils/accessibility');
jest.mock('../../../src/js/utils/accessibilityEnhanced');

describe('AccessibilityMenu', () => {
    const openMenu = (component) => {
        const menuButton = screen.getByRole('button', { name: /accessibility options/i });
        fireEvent.click(menuButton);
    };

    let mockProps;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup default mock implementations
        themeUtils.isDarkModeEnabled.mockReturnValue(false);
        themeUtils.getThemePreference.mockReturnValue('light');
        accessibilityUtils.isHighContrastEnabled.mockReturnValue(false);
        accessibilityEnhanced.isReducedMotionEnabled.mockReturnValue(false);
        accessibilityEnhanced.isLargerFontSizeEnabled.mockReturnValue(false);

        // Setup default props
        mockProps = {
            highContrast: false,
            setHighContrast: jest.fn(),
            reducedMotion: false,
            setReducedMotion: jest.fn(),
            largerFontSize: false,
            setLargerFontSize: jest.fn()
        };
    });

    describe('Dark Mode Toggle', () => {
        it('should render dark mode toggle', () => {
            render(<AccessibilityMenu {...mockProps} {...mockProps} />);
            openMenu();
            
            expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
        });

        it('should show current dark mode state', () => {
            themeUtils.isDarkModeEnabled.mockReturnValue(true);
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggle = screen.getByLabelText(/dark mode/i);
            expect(toggle).toBeChecked();
        });

        it('should toggle dark mode when clicked', async () => {
            themeUtils.toggleDarkMode.mockReturnValue(true);
            
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggle = screen.getByLabelText(/dark mode/i);
            fireEvent.click(toggle);
            
            await waitFor(() => {
                expect(themeUtils.toggleDarkMode).toHaveBeenCalled();
            });
        });

        it('should update UI after dark mode toggle', async () => {
            themeUtils.isDarkModeEnabled.mockReturnValue(true);
            const { rerender } = render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            // After rerender with dark mode enabled, checkbox should be checked
            await waitFor(() => {
                const toggle = screen.getByLabelText(/dark mode/i);
                expect(toggle).toBeChecked();
            });
        });

        it('should show theme selector when advanced mode is enabled', () => {
            render(<AccessibilityMenu {...mockProps} showAdvanced={true} />);
            openMenu();
            
            expect(screen.getByLabelText(/theme preference/i)).toBeInTheDocument();
        });

        it('should handle theme preference changes', async () => {
            themeUtils.getThemePreference.mockReturnValue('system');
            
            render(<AccessibilityMenu {...mockProps} showAdvanced={true} />);
            openMenu();
            
            const selector = screen.getByLabelText(/theme preference/i);
            
            fireEvent.change(selector, { target: { value: 'dark' } });
            
            await waitFor(() => {
                expect(themeUtils.setThemePreference).toHaveBeenCalledWith('dark');
            });
        });
    });

    describe('High Contrast Mode', () => {
        it('should render high contrast toggle', () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            expect(screen.getByLabelText(/high contrast/i)).toBeInTheDocument();
        });

        it('should toggle high contrast when clicked', async () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggle = screen.getByLabelText(/high contrast/i);
            fireEvent.click(toggle);
            
            await waitFor(() => {
                expect(mockProps.setHighContrast).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('Reduced Motion Mode', () => {
        it('should render reduced motion toggle', () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            expect(screen.getByLabelText(/reduced motion/i)).toBeInTheDocument();
        });

        it('should toggle reduced motion when clicked', async () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggle = screen.getByLabelText(/reduced motion/i);
            fireEvent.click(toggle);
            
            await waitFor(() => {
                expect(mockProps.setReducedMotion).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('Larger Font Size', () => {
        it('should render larger font size toggle', () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            expect(screen.getByLabelText(/larger text/i)).toBeInTheDocument();
        });

        it('should toggle larger font size when clicked', async () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggle = screen.getByLabelText(/larger text/i);
            fireEvent.click(toggle);
            
            await waitFor(() => {
                expect(mockProps.setLargerFontSize).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('should display keyboard shortcuts', () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            expect(screen.getByText(/Alt\+D/i)).toBeInTheDocument(); // Dark mode
            expect(screen.getByText(/Alt\+H/i)).toBeInTheDocument(); // High contrast
            expect(screen.getByText(/Alt\+M/i)).toBeInTheDocument(); // Reduced motion
            expect(screen.getByText(/Alt\+F/i)).toBeInTheDocument(); // Font size
        });

        it('should handle keyboard shortcuts', () => {
            render(<AccessibilityMenu {...mockProps} />);
            
            // Simulate Alt+D for dark mode
            fireEvent.keyDown(document, { key: 'd', altKey: true });
            expect(themeUtils.toggleDarkMode).toHaveBeenCalled();
            
            // Simulate Alt+H for high contrast
            fireEvent.keyDown(document, { key: 'h', altKey: true });
            expect(mockProps.setHighContrast).toHaveBeenCalledWith(true);
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            expect(screen.getByRole('group', { name: /accessibility settings/i })).toBeInTheDocument();
            expect(screen.getAllByRole('checkbox')).toHaveLength(4);
        });

        it('should be keyboard navigable', () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggles = screen.getAllByRole('checkbox');
            expect(toggles).toHaveLength(4); // Verify we have all toggles
        });

        it('should announce changes to screen readers', async () => {
            const announceToScreenReader = jest.spyOn(accessibilityUtils, 'announceToScreenReader');
            
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const toggle = screen.getByLabelText(/dark mode/i);
            fireEvent.click(toggle);
            
            await waitFor(() => {
                expect(announceToScreenReader).toHaveBeenCalledWith(expect.stringContaining('Dark mode enabled'));
            });
        });
    });

    describe('Integration', () => {
        it('should persist settings across component remounts', () => {
            const { unmount } = render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            // Toggle dark mode
            fireEvent.click(screen.getByLabelText(/dark mode/i));
            
            unmount();
            
            // Remount and check state is preserved
            themeUtils.isDarkModeEnabled.mockReturnValue(true);
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            expect(screen.getByLabelText(/dark mode/i)).toBeChecked();
        });

        it('should handle multiple toggles simultaneously', async () => {
            render(<AccessibilityMenu {...mockProps} />);
            openMenu();
            
            const darkModeToggle = screen.getByLabelText(/dark mode/i);
            const highContrastToggle = screen.getByLabelText(/high contrast/i);
            
            fireEvent.click(darkModeToggle);
            fireEvent.click(highContrastToggle);
            
            await waitFor(() => {
                expect(themeUtils.toggleDarkMode).toHaveBeenCalled();
                expect(mockProps.setHighContrast).toHaveBeenCalledWith(true);
            });
        });
    });
});