import { __ } from '@wordpress/i18n';
import { Command } from 'cmdk';
import { useState, useEffect, useMemo } from '@wordpress/element';

function PostActionMenu({ page, closeCommandBar, onBack }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hoverIndex, setHoverIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Define the available actions for the page
    const actions = [
        {
            id: 'view',
            title: page.status === 'publish' ? __('View Post', 'lexia-command') : __('Preview Post', 'lexia-command'),
            icon: '👁️',
            action: () => {
                window.location.href = page.url;
                closeCommandBar();
            }
        },
        {
            id: 'edit',
            title: __('Edit Post', 'lexia-command'),
            icon: '✏️',
            action: () => {
                window.location.href = `${window.lexiaCommandData.adminUrl}post.php?post=${page.id}&action=edit`;
                closeCommandBar();
            }
        },
        {
            id: 'trash',
            title: __('Move to Trash', 'lexia-command'),
            icon: '🗑️',
            action: () => {
                // Send request to trash the page
                const formData = new FormData();
                formData.append('action', 'trash');
                formData.append('post', page.id);
                formData.append('_wpnonce', window.lexiaCommandData.nonce);
                
                fetch(`${window.lexiaCommandData.adminUrl}post.php`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                }).then(() => {
                    // Show success message or redirect
                    closeCommandBar();
                    // Optionally refresh the page list
                    window.location.reload();
                }).catch(error => {
                    console.error('Error trashing page:', error);
                });
            }
        }
    ];
    
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onBack();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);
    
    // Filter actions based on search term
    const filteredActions = useMemo(() => {
        if (!searchTerm) return actions;
        
        return actions.filter(action => 
            action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            action.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, actions]);
    
    // Reset selected index when filtered actions change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredActions.length]);
    
    // Add styles for the modern UI
    const styles = {
        container: {
            backgroundColor: 'transparent',
            overflow: 'hidden',
            padding: '16px',
            color: '#fff',
            height: '100%'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '12px'
        },
        backButton: {
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            marginRight: '12px',
            fontSize: '14px'
        },
        pageTitle: {
            margin: '0',
            fontSize: '18px',
            fontWeight: '500',
            color: '#fff',
            flex: '1',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        actionGroup: {
            marginTop: '10px'
        },
        actionHeading: {
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '12px',
            fontWeight: 'normal'
        },
        searchContainer: {
            marginBottom: '16px',
            position: 'relative'
        },
        searchInput: {
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease'
        },
        searchIcon: {
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.5)',
            pointerEvents: 'none'
        },
        actionItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            margin: '4px 0',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: 'transparent' // Will be set dynamically in the render
        },
        actionIcon: {
            fontSize: '18px',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
        },
        actionTitle: {
            fontSize: '15px',
            fontWeight: '400'
        }
    };

    return (
        <div className="lexia-command-page-actions-wrapper">
            <div style={styles.header} className="lexia-command-page-actions-header">
                <button 
                    style={{
                        ...styles.backButton,
                        backgroundColor: hoverIndex === -1 ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                    }} 
                    className="lexia-command-back-button" 
                    onClick={onBack}
                    aria-label={__('Back to search results', 'lexia-command')}
                    onMouseEnter={() => setHoverIndex(-1)}
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <span style={{ marginRight: '6px' }}>←</span> {__('Back', 'lexia-command')}
                </button>
                <h3 style={styles.pageTitle} className="lexia-command-page-title">{page.title}</h3>
            </div>
            
            <div className="lexia-command-search-wrapper">
                <Command.Input
                    type="text"
                    style={styles.searchInput}
                    className="lexia-command-search"
                    placeholder={__('Search actions...', 'lexia-command')}
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    autoFocus
                />
            </div>
            
            <Command.List style={styles.container} className="lexia-command-page-actions">
                <div style={styles.actionGroup}>
                    <Command.Group>
                        {filteredActions.length === 0 ? (
                            <Command.Item value="no-results">
                                <div style={{ padding: '10px 0', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {__('No actions found', 'lexia-command')}
                                </div>
                            </Command.Item>
                        ) : filteredActions.map((action, index) => (
                            <Command.Item
                                key={action.id}
                                value={action.id}
                                style={{
                                    ...styles.actionItem,
                                    backgroundColor: index === selectedIndex ? 'rgba(255, 255, 255, 0.15)' : 
                                                index === hoverIndex ? 'rgba(255, 255, 255, 0.08)' : 
                                                'transparent'
                                }}
                                className="lexia-command-action-item"
                                onMouseEnter={() => {
                                    setSelectedIndex(index);
                                    setHoverIndex(index);
                                }}
                                onMouseLeave={() => setHoverIndex(null)}
                                onSelect={action.action}
                                data-selected={index === selectedIndex}
                            >
                                <span style={styles.actionIcon} className="lexia-command-action-icon">{action.icon}</span>
                                <span style={styles.actionTitle} className="lexia-command-action-title">{action.title}</span>
                            </Command.Item>
                        ))}
                    </Command.Group>
                </div>
            </Command.List>
        </div>
    );
}

export default PostActionMenu;