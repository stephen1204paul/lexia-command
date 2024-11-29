import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Modal, SearchControl } from '@wordpress/components';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { searchCommands } from '../commands';
import '../css/command-bar.css';

function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const openCommandBar = useCallback(() => {
        setIsOpen(true);
        setSelectedIndex(0);
    }, []);

    const closeCommandBar = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
        setSelectedIndex(0);
    }, []);

    // Register keyboard shortcut
    useKeyboardShortcut(
        { key: 'k', metaKey: true },
        (event) => {
            event.preventDefault();
            openCommandBar();
        }
    );

    // Handle keyboard navigation
    useKeyboardShortcut(
        { key: 'ArrowDown' },
        (event) => {
            if (isOpen && results.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % results.length);
            }
        }
    );

    useKeyboardShortcut(
        { key: 'ArrowUp' },
        (event) => {
            if (isOpen && results.length > 0) {
                event.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
            }
        }
    );

    useKeyboardShortcut(
        { key: 'Enter' },
        (event) => {
            if (isOpen && results.length > 0) {
                event.preventDefault();
                const selectedResult = results[selectedIndex];
                if (selectedResult.action) {
                    selectedResult.action();
                    closeCommandBar();
                }
            }
        }
    );

    // Search handler
    useEffect(() => {
        if (!searchTerm) {
            setResults([]);
            setSelectedIndex(0);
            return;
        }

        const searchTimer = setTimeout(async () => {
            setLoading(true);
            try {
                // First, search commands
                const commandResults = searchCommands(searchTerm);
                
                // Then, search content via REST API
                const queryString = new URLSearchParams({ query: searchTerm }).toString();
                const response = await apiFetch({
                    path: `/${window.lexiaCommandData.restNamespace}/search?${queryString}`,
                    method: 'GET'
                });

                // Combine results, with commands first
                setResults([
                    ...commandResults,
                    ...response.data.map(item => ({
                        ...item,
                        icon: '📝',
                        action: () => {
                            window.location.href = item.url;
                        }
                    }))
                ]);
            } catch (error) {
                console.error('Search failed:', error);
                setResults(commandResults || []); // Still show command results even if API fails
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchTerm]);

    if (!isOpen) {
        return null;
    }

    return (
        <Modal
            title={__('LexiaCommand', 'lexia-command')}
            onRequestClose={closeCommandBar}
            className="lexia-command-modal"
        >
            <div className="lexia-command-container">
                <SearchControl
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={__('Type a command or search...', 'lexia-command')}
                    className="lexia-command-search"
                    autoComplete="off"
                    autoFocus
                />
                <div className="lexia-command-results">
                    {loading ? (
                        <div className="lexia-command-loading">
                            {__('Searching...', 'lexia-command')}
                        </div>
                    ) : results.length > 0 ? (
                        <ul>
                            {results.map((result, index) => (
                                <li
                                    key={result.id || index}
                                    className={`lexia-command-result ${index === selectedIndex ? 'selected' : ''}`}
                                    onClick={() => {
                                        result.action();
                                        closeCommandBar();
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <span className="lexia-command-result-icon">{result.icon}</span>
                                    <span className="lexia-command-result-title">{result.title}</span>
                                </li>
                            ))}
                        </ul>
                    ) : searchTerm ? (
                        <div className="lexia-command-no-results">
                            {__('No results found', 'lexia-command')}
                        </div>
                    ) : (
                        <div className="lexia-command-empty-state">
                            {__('Start typing to search...', 'lexia-command')}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default CommandBar; 