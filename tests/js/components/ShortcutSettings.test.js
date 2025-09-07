/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import ShortcutSettings from '../../../src/js/components/ShortcutSettings';

// Mock the useKeyboardShortcut hook
jest.mock('../../../src/js/hooks/useKeyboardShortcut', () => ({
    useKeyboardShortcut: () => ({
        shortcuts: {
            openCommand: { key: 'k', meta: true, ctrl: true, alt: false, shift: false },
            selectResult1: { key: '1', meta: true, ctrl: true, alt: false, shift: false }
        },
        isMac: false,
        updateShortcut: jest.fn(),
        resetShortcuts: jest.fn(),
        resetShortcut: jest.fn(),
        detectConflicts: jest.fn(() => []),
        exportShortcuts: jest.fn(() => ({})),
        importShortcuts: jest.fn(),
        isValidShortcut: jest.fn(() => true)
    })
}));

describe('ShortcutSettings', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render when open', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            expect(screen.getByText('Keyboard Shortcuts Settings')).toBeInTheDocument();
            expect(screen.getByText('Open Command Bar')).toBeInTheDocument();
            expect(screen.getByText('Select Result 1')).toBeInTheDocument();
        });

        it('should not render when closed', () => {
            render(<ShortcutSettings {...defaultProps} isOpen={false} />);
            
            expect(screen.queryByText('Keyboard Shortcuts Settings')).not.toBeInTheDocument();
        });

        it('should display shortcuts in the correct format', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            // Should show formatted shortcuts
            const shortcuts = screen.getAllByRole('generic', { name: /Ctrl \+ [K1]/ });
            expect(shortcuts.length).toBeGreaterThan(0);
        });
    });

    describe('User Interactions', () => {
        it('should call onClose when close button is clicked', () => {
            const onClose = jest.fn();
            render(<ShortcutSettings {...defaultProps} onClose={onClose} />);
            
            fireEvent.click(screen.getByLabelText('Close shortcuts settings'));
            expect(onClose).toHaveBeenCalled();
        });

        it('should show edit buttons for each shortcut', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            const editButtons = screen.getAllByText('Edit');
            expect(editButtons.length).toBe(2); // One for each shortcut
        });

        it('should show reset buttons for each shortcut', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            const resetButtons = screen.getAllByText('Reset');
            expect(resetButtons.length).toBe(2); // One for each shortcut
        });

        it('should show reset all button', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            expect(screen.getByText('Reset All to Defaults')).toBeInTheDocument();
        });

        it('should show import/export buttons', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            expect(screen.getByText('Export Settings')).toBeInTheDocument();
            expect(screen.getByText('Import Settings')).toBeInTheDocument();
        });
    });

    describe('Recording State', () => {
        it('should enter recording mode when edit is clicked', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            fireEvent.click(screen.getAllByText('Edit')[0]);
            
            expect(screen.getByText('Press new shortcut keys...')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });
    });

    describe('Import/Export', () => {
        it('should show import/export section when import button is clicked', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            fireEvent.click(screen.getByText('Import Settings'));
            
            expect(screen.getByText('Import/Export Shortcuts Configuration')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Paste shortcuts configuration JSON here...')).toBeInTheDocument();
        });
    });

    describe('Help Section', () => {
        it('should display help information', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            expect(screen.getByText('Help')).toBeInTheDocument();
            expect(screen.getByText(/Click "Edit" to record a new shortcut/)).toBeInTheDocument();
        });
    });

    describe('Conflicts', () => {
        it('should display conflicts when they exist', () => {
            // Mock conflicts
            const mockUseKeyboardShortcut = require('../../../src/js/hooks/useKeyboardShortcut');
            mockUseKeyboardShortcut.useKeyboardShortcut.mockReturnValue({
                shortcuts: {
                    openCommand: { key: 'k', meta: true, ctrl: true, alt: false, shift: false }
                },
                isMac: false,
                updateShortcut: jest.fn(),
                resetShortcuts: jest.fn(),
                resetShortcut: jest.fn(),
                detectConflicts: jest.fn(() => [{
                    shortcut: { key: 'k', meta: true, ctrl: true, alt: false, shift: false },
                    commands: ['openCommand', 'anotherCommand']
                }]),
                exportShortcuts: jest.fn(() => ({})),
                importShortcuts: jest.fn(),
                isValidShortcut: jest.fn(() => true)
            });

            render(<ShortcutSettings {...defaultProps} />);
            
            expect(screen.getByText('⚠️ Shortcut Conflicts Detected')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<ShortcutSettings {...defaultProps} />);
            
            expect(screen.getByLabelText('Close shortcuts settings')).toBeInTheDocument();
        });

        it('should handle escape key to close modal', () => {
            const onClose = jest.fn();
            render(<ShortcutSettings {...defaultProps} onClose={onClose} />);
            
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(onClose).toHaveBeenCalled();
        });
    });
});