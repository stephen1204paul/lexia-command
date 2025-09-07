/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { __ } from '@wordpress/i18n';
import CommandTooltips from '../../../src/js/components/CommandTooltips';

// Mock WordPress i18n
jest.mock('@wordpress/i18n', () => ({
    __: jest.fn((text) => text),
}));

describe('CommandTooltips', () => {
    beforeEach(() => {
        // Clear localStorage and reset any previous state
        localStorage.clear();
        
        // Mock localStorage behavior
        const storage = {};
        localStorage.getItem = jest.fn((key) => storage[key] || null);
        localStorage.setItem = jest.fn((key, value) => {
            storage[key] = value;
        });
        localStorage.removeItem = jest.fn((key) => {
            delete storage[key];
        });
        
        // Clear all timers
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('Tooltip Display', () => {
        it('should show tooltip when hovering over command item', async () => {
            const mockCommand = {
                id: 'test-command',
                title: 'Test Command',
                description: 'This is a test command',
                category: 'content',
                keywords: ['test', 'command']
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="test-command" data-testid="command-item">
                        {mockCommand.title}
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            
            // Hover over the command item
            fireEvent.mouseEnter(commandItem);
            
            // Wait for tooltip delay
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Check if tooltip is displayed
            await waitFor(() => {
                const tooltip = screen.getByRole('tooltip');
                expect(tooltip).toBeInTheDocument();
                expect(tooltip).toHaveTextContent('Test Command');
                expect(tooltip).toHaveTextContent('This is a test command');
            });
        });

        it('should hide tooltip when mouse leaves command item', async () => {
            const mockCommand = {
                id: 'test-command',
                title: 'Test Command',
                description: 'This is a test command'
            };

            render(
                <CommandTooltips>
                    <div data-command-id="test-command" data-testid="command-item">
                        {mockCommand.title}
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            
            // Show tooltip first
            fireEvent.mouseEnter(commandItem);
            act(() => {
                jest.advanceTimersByTime(500);
            });

            await waitFor(() => {
                expect(screen.getByRole('tooltip')).toBeInTheDocument();
            });

            // Hide tooltip
            fireEvent.mouseLeave(commandItem);
            
            await waitFor(() => {
                expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
            });
        });

        it('should respect hover delay before showing tooltip', () => {
            const mockCommand = {
                id: 'test-command',
                title: 'Test Command',
                description: 'This is a test command'
            };

            render(
                <CommandTooltips delay={1000}>
                    <div data-command-id="test-command" data-testid="command-item">
                        {mockCommand.title}
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            
            fireEvent.mouseEnter(commandItem);
            
            // Should not show tooltip before delay
            act(() => {
                jest.advanceTimersByTime(500);
            });
            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
            
            // Should show tooltip after delay
            act(() => {
                jest.advanceTimersByTime(500);
            });
            expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });

        it('should not show tooltip for items without command data', () => {
            render(
                <CommandTooltips>
                    <div data-testid="regular-item">Regular Item</div>
                </CommandTooltips>
            );

            const regularItem = screen.getByTestId('regular-item');
            
            fireEvent.mouseEnter(regularItem);
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });
    });

    describe('Tooltip Content', () => {
        it('should display command title and description', () => {
            const mockCommand = {
                id: 'detailed-command',
                title: 'Create New Post',
                description: 'Create a new blog post or article',
                category: 'content'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="detailed-command" data-testid="command-item">
                        Create New Post
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.getByText('Create New Post')).toBeInTheDocument();
            expect(screen.getByText('Create a new blog post or article')).toBeInTheDocument();
        });

        it('should display keyboard shortcuts if available', () => {
            const mockCommand = {
                id: 'shortcut-command',
                title: 'Open Command Bar',
                description: 'Open the command palette',
                shortcuts: ['Cmd+K', 'Ctrl+K']
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="shortcut-command" data-testid="command-item">
                        Open Command Bar
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.getByText('Cmd+K')).toBeInTheDocument();
            expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
        });

        it('should display category information', () => {
            const mockCommand = {
                id: 'category-command',
                title: 'Install Plugin',
                description: 'Install a new WordPress plugin',
                category: 'plugins'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="category-command" data-testid="command-item">
                        Install Plugin
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.getByText('Category: plugins')).toBeInTheDocument();
        });

        it('should handle commands without descriptions gracefully', () => {
            const mockCommand = {
                id: 'minimal-command',
                title: 'Quick Action'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="minimal-command" data-testid="command-item">
                        Quick Action
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.getByText('Quick Action')).toBeInTheDocument();
            expect(screen.getByText('No description available')).toBeInTheDocument();
        });
    });

    describe('Tooltip Positioning', () => {
        it('should position tooltip above command item by default', () => {
            const mockCommand = {
                id: 'position-command',
                title: 'Test Position',
                description: 'Testing tooltip position'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="position-command" data-testid="command-item">
                        Test Position
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveClass('tooltip-top');
        });

        it('should position tooltip below if not enough space above', () => {
            // Mock getBoundingClientRect to simulate element near top of viewport
            Element.prototype.getBoundingClientRect = jest.fn(() => ({
                top: 50,
                left: 100,
                bottom: 70,
                right: 200,
                width: 100,
                height: 20
            }));

            const mockCommand = {
                id: 'bottom-command',
                title: 'Bottom Tooltip',
                description: 'This tooltip should appear below'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="bottom-command" data-testid="command-item">
                        Bottom Tooltip
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveClass('tooltip-bottom');
        });

        it('should adjust horizontal position if tooltip would overflow', () => {
            // Mock getBoundingClientRect to simulate element near right edge
            Element.prototype.getBoundingClientRect = jest.fn(() => ({
                top: 200,
                left: window.innerWidth - 50,
                bottom: 220,
                right: window.innerWidth,
                width: 50,
                height: 20
            }));

            const mockCommand = {
                id: 'overflow-command',
                title: 'Overflow Test',
                description: 'This is a very long description that might cause the tooltip to overflow the viewport width'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="overflow-command" data-testid="command-item">
                        Overflow Test
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveClass('tooltip-left');
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes', () => {
            const mockCommand = {
                id: 'aria-command',
                title: 'ARIA Test',
                description: 'Testing ARIA attributes'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="aria-command" data-testid="command-item">
                        ARIA Test
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveAttribute('aria-hidden', 'false');
            expect(tooltip).toHaveAttribute('aria-describedby');
            
            // Check that command item references the tooltip
            expect(commandItem).toHaveAttribute('aria-describedby', tooltip.id);
        });

        it('should be keyboard accessible', () => {
            const mockCommand = {
                id: 'keyboard-command',
                title: 'Keyboard Test',
                description: 'Testing keyboard accessibility'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div 
                        data-command-id="keyboard-command" 
                        data-testid="command-item"
                        tabIndex={0}
                    >
                        Keyboard Test
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            
            // Focus the item
            fireEvent.focus(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.getByRole('tooltip')).toBeInTheDocument();
            
            // Blur the item
            fireEvent.blur(commandItem);
            
            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });

        it('should support screen readers', () => {
            const mockCommand = {
                id: 'screen-reader-command',
                title: 'Screen Reader Test',
                description: 'This tooltip is accessible to screen readers'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="screen-reader-command" data-testid="command-item">
                        Screen Reader Test
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveTextContent('Screen Reader Test');
            expect(tooltip).toHaveTextContent('This tooltip is accessible to screen readers');
        });
    });

    describe('Performance', () => {
        it('should cleanup timers when component unmounts', () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
            
            const mockCommand = {
                id: 'cleanup-command',
                title: 'Cleanup Test',
                description: 'Testing timer cleanup'
            };

            const { unmount } = render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="cleanup-command" data-testid="command-item">
                        Cleanup Test
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            // Unmount before timer fires
            unmount();
            
            expect(clearTimeoutSpy).toHaveBeenCalled();
            clearTimeoutSpy.mockRestore();
        });

        it('should debounce rapid hover events', () => {
            const mockCommand = {
                id: 'debounce-command',
                title: 'Debounce Test',
                description: 'Testing debounce behavior'
            };

            render(
                <CommandTooltips commands={[mockCommand]}>
                    <div data-command-id="debounce-command" data-testid="command-item">
                        Debounce Test
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            
            // Rapid hover events
            fireEvent.mouseEnter(commandItem);
            fireEvent.mouseLeave(commandItem);
            fireEvent.mouseEnter(commandItem);
            fireEvent.mouseLeave(commandItem);
            fireEvent.mouseEnter(commandItem);
            
            // Should only show tooltip once after final hover
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.getAllByRole('tooltip')).toHaveLength(1);
        });
    });

    describe('Configuration', () => {
        it('should respect custom delay setting', () => {
            const mockCommand = {
                id: 'custom-delay-command',
                title: 'Custom Delay',
                description: 'Testing custom delay'
            };

            render(
                <CommandTooltips commands={[mockCommand]} delay={1500}>
                    <div data-command-id="custom-delay-command" data-testid="command-item">
                        Custom Delay
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            // Should not show after default delay
            act(() => {
                jest.advanceTimersByTime(500);
            });
            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
            
            // Should show after custom delay
            act(() => {
                jest.advanceTimersByTime(1000);
            });
            expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });

        it('should allow disabling tooltips', () => {
            const mockCommand = {
                id: 'disabled-command',
                title: 'Disabled Tooltip',
                description: 'This tooltip should not appear'
            };

            render(
                <CommandTooltips commands={[mockCommand]} enabled={false}>
                    <div data-command-id="disabled-command" data-testid="command-item">
                        Disabled Tooltip
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });

        it('should support custom tooltip styles', () => {
            const mockCommand = {
                id: 'styled-command',
                title: 'Styled Tooltip',
                description: 'Testing custom styles'
            };

            render(
                <CommandTooltips 
                    commands={[mockCommand]} 
                    className="custom-tooltip"
                    style={{ backgroundColor: 'red' }}
                >
                    <div data-command-id="styled-command" data-testid="command-item">
                        Styled Tooltip
                    </div>
                </CommandTooltips>
            );

            const commandItem = screen.getByTestId('command-item');
            fireEvent.mouseEnter(commandItem);
            
            act(() => {
                jest.advanceTimersByTime(500);
            });

            const tooltip = screen.getByRole('tooltip');
            expect(tooltip).toHaveClass('custom-tooltip');
            expect(tooltip).toHaveStyle({ backgroundColor: 'red' });
        });
    });
});