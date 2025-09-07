/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcut } from '../../../src/js/hooks/useKeyboardShortcut';

describe('useKeyboardShortcut', () => {
    beforeEach(() => {
        // Clear localStorage and reset event listeners
        localStorage.clear();
        document.removeEventListener = jest.fn();
        document.addEventListener = jest.fn();
        
        // Mock localStorage behavior
        const storage = {};
        localStorage.getItem.mockImplementation((key) => storage[key] || null);
        localStorage.setItem.mockImplementation((key, value) => {
            storage[key] = value;
        });
    });

    describe('Default Shortcuts', () => {
        it('should return default shortcut configuration', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(result.current.shortcuts).toEqual({
                openCommand: { key: 'k', meta: true, ctrl: true, alt: false, shift: false },
                selectResult1: { key: '1', meta: true, ctrl: true, alt: false, shift: false },
                selectResult2: { key: '2', meta: true, ctrl: true, alt: false, shift: false },
                selectResult3: { key: '3', meta: true, ctrl: true, alt: false, shift: false },
                selectResult4: { key: '4', meta: true, ctrl: true, alt: false, shift: false },
                selectResult5: { key: '5', meta: true, ctrl: true, alt: false, shift: false },
                selectResult6: { key: '6', meta: true, ctrl: true, alt: false, shift: false },
                selectResult7: { key: '7', meta: true, ctrl: true, alt: false, shift: false },
                selectResult8: { key: '8', meta: true, ctrl: true, alt: false, shift: false },
                selectResult9: { key: '9', meta: true, ctrl: true, alt: false, shift: false },
            });
        });

        it('should detect Mac vs Windows/Linux for default shortcuts', () => {
            // Mock Mac environment
            Object.defineProperty(navigator, 'platform', {
                value: 'MacIntel',
                configurable: true
            });
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            // On Mac, should use meta key primarily
            expect(result.current.shortcuts.openCommand.meta).toBe(true);
            expect(result.current.shortcuts.openCommand.ctrl).toBe(true); // Fallback
        });
    });

    describe('Custom Shortcuts', () => {
        it('should load custom shortcuts from localStorage', () => {
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: 'space', meta: false, ctrl: true, alt: false, shift: false }
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(result.current.shortcuts.openCommand).toEqual({
                key: 'space',
                meta: false,
                ctrl: true,
                alt: false,
                shift: false
            });
        });

        it('should merge custom shortcuts with defaults', () => {
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: 'j', meta: true, ctrl: false, alt: false, shift: false },
                selectResult1: { key: 'q', meta: true, ctrl: false, alt: false, shift: false }
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(result.current.shortcuts.openCommand.key).toBe('j');
            expect(result.current.shortcuts.selectResult1.key).toBe('q');
            expect(result.current.shortcuts.selectResult2.key).toBe('2'); // Default preserved
        });

        it('should validate shortcut format', () => {
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: 'invalid' }, // Missing required fields
                selectResult1: 'invalid format'
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Should fall back to defaults for invalid shortcuts
            expect(result.current.shortcuts.openCommand.key).toBe('k');
            expect(result.current.shortcuts.selectResult1.key).toBe('1');
        });
    });

    describe('Shortcut Management', () => {
        it('should update shortcuts', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            const newShortcut = { key: 'l', meta: true, ctrl: false, alt: false, shift: false };
            
            act(() => {
                result.current.updateShortcut('openCommand', newShortcut);
            });
            
            expect(result.current.shortcuts.openCommand).toEqual(newShortcut);
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'lexia-command-shortcuts',
                JSON.stringify({ openCommand: newShortcut })
            );
        });

        it('should reset shortcuts to defaults', () => {
            // Start with custom shortcuts
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: 'space', meta: false, ctrl: true, alt: false, shift: false }
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            act(() => {
                result.current.resetShortcuts();
            });
            
            expect(result.current.shortcuts.openCommand.key).toBe('k');
            expect(localStorage.setItem).toHaveBeenCalledWith('lexia-command-shortcuts', '{}');
        });

        it('should reset individual shortcut', () => {
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: 'space', meta: false, ctrl: true, alt: false, shift: false },
                selectResult1: { key: 'q', meta: true, ctrl: false, alt: false, shift: false }
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            act(() => {
                result.current.resetShortcut('openCommand');
            });
            
            expect(result.current.shortcuts.openCommand.key).toBe('k');
            expect(result.current.shortcuts.selectResult1.key).toBe('q'); // Should remain
        });

        it('should export shortcuts configuration', () => {
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: 'l', meta: true, ctrl: false, alt: false, shift: false }
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            const exported = result.current.exportShortcuts();
            expect(exported).toEqual({
                openCommand: { key: 'l', meta: true, ctrl: false, alt: false, shift: false }
            });
        });

        it('should import shortcuts configuration', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            const importConfig = {
                openCommand: { key: 'm', meta: true, ctrl: false, alt: false, shift: false },
                selectResult1: { key: 'a', meta: true, ctrl: false, alt: false, shift: false }
            };
            
            act(() => {
                result.current.importShortcuts(importConfig);
            });
            
            expect(result.current.shortcuts.openCommand.key).toBe('m');
            expect(result.current.shortcuts.selectResult1.key).toBe('a');
        });
    });

    describe('Keyboard Event Handling', () => {
        it('should register keyboard event listeners', () => {
            const mockCallback = jest.fn();
            renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        it('should trigger callback for matching shortcuts', () => {
            const mockCallback = jest.fn();
            let keydownHandler;
            
            document.addEventListener.mockImplementation((event, handler) => {
                if (event === 'keydown') keydownHandler = handler;
            });
            
            renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Simulate CMD+K on Mac
            const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: false,
                altKey: false,
                shiftKey: false
            });
            
            keydownHandler(event);
            
            expect(mockCallback).toHaveBeenCalledWith('openCommand', event);
        });

        it('should trigger callback for Ctrl+K on Windows/Linux', () => {
            const mockCallback = jest.fn();
            let keydownHandler;
            
            document.addEventListener.mockImplementation((event, handler) => {
                if (event === 'keydown') keydownHandler = handler;
            });
            
            renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Simulate Ctrl+K on Windows/Linux
            const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: false,
                ctrlKey: true,
                altKey: false,
                shiftKey: false
            });
            
            keydownHandler(event);
            
            expect(mockCallback).toHaveBeenCalledWith('openCommand', event);
        });

        it('should not trigger callback for non-matching shortcuts', () => {
            const mockCallback = jest.fn();
            let keydownHandler;
            
            document.addEventListener.mockImplementation((event, handler) => {
                if (event === 'keydown') keydownHandler = handler;
            });
            
            renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Simulate just 'k' without modifiers
            const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: false,
                ctrlKey: false,
                altKey: false,
                shiftKey: false
            });
            
            keydownHandler(event);
            
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should handle number shortcuts', () => {
            const mockCallback = jest.fn();
            let keydownHandler;
            
            document.addEventListener.mockImplementation((event, handler) => {
                if (event === 'keydown') keydownHandler = handler;
            });
            
            renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Simulate CMD+1
            const event = new KeyboardEvent('keydown', {
                key: '1',
                metaKey: true,
                ctrlKey: false,
                altKey: false,
                shiftKey: false
            });
            
            keydownHandler(event);
            
            expect(mockCallback).toHaveBeenCalledWith('selectResult1', event);
        });

        it('should clean up event listeners on unmount', () => {
            const mockCallback = jest.fn();
            const { unmount } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            unmount();
            
            expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });

    describe('Shortcut Conflicts', () => {
        it('should detect shortcut conflicts', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            const conflicts = result.current.detectConflicts();
            expect(conflicts).toEqual([]); // No conflicts in default setup
        });

        it('should detect when shortcuts conflict', () => {
            localStorage.setItem('lexia-command-shortcuts', JSON.stringify({
                openCommand: { key: '1', meta: true, ctrl: true, alt: false, shift: false },
                selectResult1: { key: '1', meta: true, ctrl: true, alt: false, shift: false }
            }));
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            const conflicts = result.current.detectConflicts();
            expect(conflicts).toHaveLength(1);
            expect(conflicts[0]).toEqual({
                shortcut: { key: '1', meta: true, ctrl: true, alt: false, shift: false },
                commands: ['openCommand', 'selectResult1']
            });
        });
    });

    describe('Shortcut Validation', () => {
        it('should validate shortcut format', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Valid shortcut
            expect(result.current.isValidShortcut({
                key: 'k',
                meta: true,
                ctrl: false,
                alt: false,
                shift: false
            })).toBe(true);
            
            // Invalid shortcut - missing key
            expect(result.current.isValidShortcut({
                meta: true,
                ctrl: false,
                alt: false,
                shift: false
            })).toBe(false);
            
            // Invalid shortcut - wrong type
            expect(result.current.isValidShortcut('invalid')).toBe(false);
        });

        it('should reject shortcuts without modifiers', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(result.current.isValidShortcut({
                key: 'k',
                meta: false,
                ctrl: false,
                alt: false,
                shift: false
            })).toBe(false);
        });

        it('should allow single modifier shortcuts for specific keys', () => {
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            // Function keys should be allowed without modifiers
            expect(result.current.isValidShortcut({
                key: 'F1',
                meta: false,
                ctrl: false,
                alt: false,
                shift: false
            })).toBe(true);
            
            // Escape should be allowed
            expect(result.current.isValidShortcut({
                key: 'Escape',
                meta: false,
                ctrl: false,
                alt: false,
                shift: false
            })).toBe(true);
        });
    });

    describe('Platform Detection', () => {
        it('should detect macOS platform', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'MacIntel',
                configurable: true
            });
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(result.current.isMac).toBe(true);
        });

        it('should detect Windows platform', () => {
            Object.defineProperty(navigator, 'platform', {
                value: 'Win32',
                configurable: true
            });
            
            const mockCallback = jest.fn();
            const { result } = renderHook(() => useKeyboardShortcut(mockCallback));
            
            expect(result.current.isMac).toBe(false);
        });
    });
});