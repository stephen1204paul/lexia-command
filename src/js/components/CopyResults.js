import { useState, useCallback, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import '../css/copy-results.css';

/**
 * CopyResults component provides functionality to copy search results to clipboard
 * Supports multiple formats and provides visual feedback
 */
const CopyResults = ({
    results = [],
    format = 'text',
    fields = ['title', 'url'],
    buttonText = null,
    successMessage = null,
    errorMessage = null,
    feedbackTimeout = 3000,
    disabled = false,
    onCopyStart = null,
    onCopySuccess = null,
    onCopyError = null
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const timeoutRef = useRef(null);
    
    // Don't render if no results or disabled
    if (!results.length || disabled) {
        return null;
    }
    
    // Format results based on format type
    const formatResults = useCallback((data, formatType) => {
        if (typeof formatType === 'function') {
            return formatType(data);
        }
        
        switch (formatType) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'csv':
                if (data.length === 0) return '';
                
                // Get headers from first result
                const headers = fields.filter(field => 
                    data.some(item => item.hasOwnProperty(field))
                );
                
                const csvHeaders = headers.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(',');
                const csvRows = data.map(item => 
                    headers.map(field => {
                        const value = item[field] || '';
                        // Escape quotes and wrap in quotes
                        return `"${String(value).replace(/"/g, '""')}"`;
                    }).join(',')
                ).join('\n');
                
                return `${csvHeaders}\n${csvRows}`;
                
            case 'markdown':
                return data.map(item => {
                    const title = item.title || '';
                    const url = item.url || '';
                    return url ? `- [${title}](${url})` : `- ${title}`;
                }).join('\n');
                
            case 'text':
            default:
                if (fields.length === 1) {
                    return data.map(item => item[fields[0]] || '').join('\n');
                }
                return data.map(item => {
                    const parts = fields.map(field => item[field] || '');
                    return parts.join(' - ');
                }).join('\n');
        }
    }, [fields]);
    
    // Copy to clipboard using modern API with fallback
    const copyToClipboard = useCallback(async (text) => {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                console.warn('Clipboard API failed, trying fallback:', error);
            }
        }
        
        // Fallback for older browsers
        if (document.execCommand) {
            try {
                // Create a temporary textarea element
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '-9999px';
                document.body.appendChild(textarea);
                
                // Select and copy the text
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
                
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    return true;
                }
            } catch (error) {
                console.warn('execCommand fallback failed:', error);
            }
        }
        
        throw new Error(__('Copy feature not supported in this browser', 'lexia-command'));
    }, []);
    
    // Show feedback message with auto-clear
    const showFeedback = useCallback((message, type = 'success') => {
        setFeedback({ message, type });
        
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout to clear feedback
        timeoutRef.current = setTimeout(() => {
            setFeedback(null);
            timeoutRef.current = null;
        }, feedbackTimeout);
    }, [feedbackTimeout]);
    
    // Handle copy operation
    const handleCopy = useCallback(async () => {
        if (isLoading) return; // Prevent multiple simultaneous operations
        
        setIsLoading(true);
        
        try {
            // Call onCopyStart callback
            if (onCopyStart) {
                onCopyStart(results);
            }
            
            // Format the results
            const formattedText = formatResults(results, format);
            
            // Copy to clipboard
            await copyToClipboard(formattedText);
            
            // Show success feedback
            const message = successMessage || __('Copied to clipboard!', 'lexia-command');
            showFeedback(message, 'success');
            
            // Call onCopySuccess callback
            if (onCopySuccess) {
                onCopySuccess(results, formattedText);
            }
            
        } catch (error) {
            console.error('Copy operation failed:', error);
            
            // Show error feedback
            const message = errorMessage || __('Failed to copy to clipboard', 'lexia-command');
            showFeedback(message, 'error');
            
            // Call onCopyError callback
            if (onCopyError) {
                onCopyError(error, results);
            }
        } finally {
            setIsLoading(false);
        }
    }, [
        isLoading, 
        results, 
        format, 
        formatResults, 
        copyToClipboard, 
        successMessage, 
        errorMessage, 
        showFeedback, 
        onCopyStart, 
        onCopySuccess, 
        onCopyError
    ]);
    
    // Handle keyboard events
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCopy();
        }
    }, [handleCopy]);
    
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    
    const defaultButtonText = buttonText || __('Copy Results', 'lexia-command');
    const buttonLabel = __('Copy search results to clipboard', 'lexia-command');
    
    return (
        <div className="copy-results-container">
            <button
                type="button"
                className={`copy-results-button ${isLoading ? 'loading' : ''}`}
                onClick={handleCopy}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                aria-label={buttonLabel}
                title={buttonLabel}
            >
                <span className="copy-results-icon">
                    {isLoading ? '⏳' : '📋'}
                </span>
                <span className="copy-results-text">
                    {isLoading ? __('Copying...', 'lexia-command') : defaultButtonText}
                </span>
                <span className="copy-results-count">
                    ({results.length})
                </span>
            </button>
            
            {feedback && (
                <div 
                    className={`copy-results-feedback copy-results-feedback-${feedback.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span className="copy-results-feedback-icon">
                        {feedback.type === 'success' ? '✅' : '❌'}
                    </span>
                    <span className="copy-results-feedback-text">
                        {feedback.message}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CopyResults;