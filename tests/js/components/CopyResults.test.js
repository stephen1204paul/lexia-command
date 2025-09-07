/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import { __ } from '@wordpress/i18n';
import CopyResults from '../../../src/js/components/CopyResults';

// Mock WordPress i18n
jest.mock('@wordpress/i18n', () => ({
    __: jest.fn((text) => text),
}));

// Mock clipboard API
const mockClipboard = {
    writeText: jest.fn(),
    readText: jest.fn(),
};

Object.assign(navigator, {
    clipboard: mockClipboard,
});

describe('CopyResults', () => {
    beforeEach(() => {
        // Reset mocks
        mockClipboard.writeText.mockClear();
        mockClipboard.readText.mockClear();
        
        // Mock successful clipboard operations by default
        mockClipboard.writeText.mockResolvedValue();
        mockClipboard.readText.mockResolvedValue('');
        
        // Clear all timers
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('Copy Button', () => {
        it('should render copy button when results are present', () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' },
                { id: '2', title: 'Test Result 2', url: 'http://example.com/2' }
            ];

            render(<CopyResults results={mockResults} />);
            
            expect(screen.getByRole('button', { name: /copy results/i })).toBeInTheDocument();
        });

        it('should not render copy button when no results', () => {
            render(<CopyResults results={[]} />);
            
            expect(screen.queryByRole('button', { name: /copy results/i })).not.toBeInTheDocument();
        });

        it('should have proper accessibility attributes', () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            expect(copyButton).toHaveAttribute('aria-label');
            expect(copyButton).toHaveAttribute('title');
        });

        it('should have keyboard support', () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            
            // Should be focusable
            copyButton.focus();
            expect(document.activeElement).toBe(copyButton);
            
            // Should trigger copy on Enter key
            fireEvent.keyDown(copyButton, { key: 'Enter' });
            expect(mockClipboard.writeText).toHaveBeenCalled();
        });
    });

    describe('Copy Functionality', () => {
        it('should copy results in plain text format by default', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' },
                { id: '2', title: 'Test Result 2', url: 'http://example.com/2' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalledWith(
                    'Test Result 1 - http://example.com/1\nTest Result 2 - http://example.com/2'
                );
            });
        });

        it('should copy results in JSON format when specified', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' },
                { id: '2', title: 'Test Result 2', url: 'http://example.com/2' }
            ];

            render(<CopyResults results={mockResults} format="json" />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalledWith(
                    JSON.stringify(mockResults, null, 2)
                );
            });
        });

        it('should copy results in CSV format when specified', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' },
                { id: '2', title: 'Test Result 2', url: 'http://example.com/2' }
            ];

            render(<CopyResults results={mockResults} format="csv" />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalledWith(
                    'Title,URL\n"Test Result 1","http://example.com/1"\n"Test Result 2","http://example.com/2"'
                );
            });
        });

        it('should copy results in markdown format when specified', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' },
                { id: '2', title: 'Test Result 2', url: 'http://example.com/2' }
            ];

            render(<CopyResults results={mockResults} format="markdown" />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalledWith(
                    '- [Test Result 1](http://example.com/1)\n- [Test Result 2](http://example.com/2)'
                );
            });
        });

        it('should handle custom format function', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            const customFormatter = jest.fn(() => 'Custom formatted result');

            render(<CopyResults results={mockResults} format={customFormatter} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(customFormatter).toHaveBeenCalledWith(mockResults);
                expect(mockClipboard.writeText).toHaveBeenCalledWith('Custom formatted result');
            });
        });

        it('should include selected fields only when specified', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1', description: 'Description 1' },
                { id: '2', title: 'Test Result 2', url: 'http://example.com/2', description: 'Description 2' }
            ];

            render(<CopyResults results={mockResults} fields={['title']} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalledWith(
                    'Test Result 1\nTest Result 2'
                );
            });
        });
    });

    describe('Visual Feedback', () => {
        it('should show success message after successful copy', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
            });
        });

        it('should show error message when copy fails', async () => {
            mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
            
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText(/failed to copy/i)).toBeInTheDocument();
            });
        });

        it('should clear feedback message after timeout', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
            });

            act(() => {
                jest.advanceTimersByTime(3000);
            });

            expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
        });

        it('should change button appearance during copy operation', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            
            // Should not be disabled initially
            expect(copyButton).not.toBeDisabled();
            
            fireEvent.click(copyButton);
            
            // Should be disabled during operation
            expect(copyButton).toBeDisabled();

            await waitFor(() => {
                // Should be enabled again after operation
                expect(copyButton).not.toBeDisabled();
            });
        });
    });

    describe('Configuration Options', () => {
        it('should respect custom button text', () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} buttonText="Copy All" />);
            
            expect(screen.getByRole('button', { name: /copy all/i })).toBeInTheDocument();
        });

        it('should respect custom success message', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} successMessage="Results copied successfully!" />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText('Results copied successfully!')).toBeInTheDocument();
            });
        });

        it('should respect custom error message', async () => {
            mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
            
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} errorMessage="Copy operation failed!" />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText('Copy operation failed!')).toBeInTheDocument();
            });
        });

        it('should respect custom feedback timeout', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} feedbackTimeout={1000} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
            });

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
        });

        it('should allow disabling the component', () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} disabled={true} />);
            
            expect(screen.queryByRole('button', { name: /copy results/i })).not.toBeInTheDocument();
        });
    });

    describe('Event Callbacks', () => {
        it('should call onCopyStart callback when copy begins', () => {
            const onCopyStart = jest.fn();
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} onCopyStart={onCopyStart} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            expect(onCopyStart).toHaveBeenCalledWith(mockResults);
        });

        it('should call onCopySuccess callback on successful copy', async () => {
            const onCopySuccess = jest.fn();
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} onCopySuccess={onCopySuccess} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(onCopySuccess).toHaveBeenCalledWith(mockResults, expect.any(String));
            });
        });

        it('should call onCopyError callback on copy failure', async () => {
            const error = new Error('Clipboard error');
            mockClipboard.writeText.mockRejectedValue(error);
            
            const onCopyError = jest.fn();
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} onCopyError={onCopyError} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(onCopyError).toHaveBeenCalledWith(error, mockResults);
            });
        });
    });

    describe('Clipboard Fallback', () => {
        it('should handle browsers without clipboard API', async () => {
            // Mock navigator.clipboard as undefined
            const originalClipboard = navigator.clipboard;
            Object.defineProperty(navigator, 'clipboard', {
                value: undefined,
                configurable: true
            });

            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(screen.getByText(/copy feature not supported/i)).toBeInTheDocument();
            });

            // Restore original clipboard
            Object.defineProperty(navigator, 'clipboard', {
                value: originalClipboard,
                configurable: true
            });
        });

        it('should use document.execCommand fallback when available', async () => {
            // Mock clipboard API as undefined
            const originalClipboard = navigator.clipboard;
            Object.defineProperty(navigator, 'clipboard', {
                value: undefined,
                configurable: true
            });

            // Mock document.execCommand
            document.execCommand = jest.fn(() => true);

            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(document.execCommand).toHaveBeenCalledWith('copy');
                expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
            });

            // Restore original clipboard
            Object.defineProperty(navigator, 'clipboard', {
                value: originalClipboard,
                configurable: true
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty results gracefully', () => {
            render(<CopyResults results={[]} />);
            
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should handle results without required fields', async () => {
            const mockResults = [
                { id: '1' }, // Missing title and url
                { id: '2', title: 'Test Result 2' } // Missing url
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalledWith(
                    ' - \nTest Result 2 - '
                );
            });
        });

        it('should handle very large result sets', async () => {
            const mockResults = Array.from({ length: 1000 }, (_, i) => ({
                id: `${i}`,
                title: `Result ${i}`,
                url: `http://example.com/${i}`
            }));

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            fireEvent.click(copyButton);

            await waitFor(() => {
                expect(mockClipboard.writeText).toHaveBeenCalled();
                const copiedText = mockClipboard.writeText.mock.calls[0][0];
                expect(copiedText.split('\n')).toHaveLength(1000);
            });
        });

        it('should prevent multiple simultaneous copy operations', async () => {
            const mockResults = [
                { id: '1', title: 'Test Result 1', url: 'http://example.com/1' }
            ];

            render(<CopyResults results={mockResults} />);
            
            const copyButton = screen.getByRole('button', { name: /copy results/i });
            
            // Click multiple times rapidly
            fireEvent.click(copyButton);
            fireEvent.click(copyButton);
            fireEvent.click(copyButton);

            await waitFor(() => {
                // Should only be called once
                expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
            });
        });
    });
});